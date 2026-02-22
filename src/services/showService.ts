import { Op } from 'sequelize';
import { sequelize, Show, Venue, Version, Song } from '../models/index.ts';
import { NotFoundError, ValidationError } from '../utils/errors.ts';
import { decodeCursor, buildPaginatedResponse } from '../utils/pagination.ts';

function mapSetNumber(raw: string): string {
  if (raw === 'Encore') return 'E';
  if (raw === '1st Encore') return 'E1';
  if (raw === '2nd Encore') return 'E2';
  if (raw === '' || raw === null) return '0';
  return raw; // '1', '2', '3' stay as-is
}

interface ListShowsParams {
  cursor?: string;
  limit?: number;
  sortBy?: string;
  direction?: string;
  songId?: number;
  venueId?: number;
  year?: number;
  state?: string;
}

export async function listShows(params: ListShowsParams) {
  const {
    cursor,
    limit = 25,
    sortBy = 'date',
    direction = 'desc',
    songId,
    venueId,
    year,
    state,
  } = params;

  const where: any = {};
  const includeArray: any[] = [];

  // Always include Venue
  const venueInclude: any = {
    model: Venue,
    as: 'venue',
    attributes: ['id', 'name', 'city', 'state', 'country', 'geom'],
  };

  if (state) {
    venueInclude.where = { state };
  }

  includeArray.push(venueInclude);

  // Filter by songId via Version join
  if (songId) {
    includeArray.push({
      model: Version,
      as: 'versions',
      where: { songId },
      attributes: [],
      required: true,
    });
  }

  if (venueId) {
    where.venueId = venueId;
  }

  if (year) {
    where[Op.and] = [
      ...(where[Op.and] || []),
      sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "Show"."date"')), year),
    ];
  }

  // Cursor-based pagination
  if (cursor) {
    const decoded = decodeCursor(cursor);
    const sortCol = sortBy === 'date' ? 'date' : 'date'; // Default sort column for cursor
    if (direction === 'desc') {
      where[Op.and] = [
        ...(where[Op.and] || []),
        sequelize.literal(`("Show"."${sortCol}", "Show"."id") < ('${decoded.v}', ${decoded.id})`),
      ];
    } else {
      where[Op.and] = [
        ...(where[Op.and] || []),
        sequelize.literal(`("Show"."${sortCol}", "Show"."id") > ('${decoded.v}', ${decoded.id})`),
      ];
    }
  }

  // Determine sort order
  let order: any[];
  if (sortBy === 'venue') {
    order = [[{ model: Venue, as: 'venue' }, 'name', direction], ['id', direction]];
  } else {
    order = [['date', direction], ['id', direction]];
  }

  const { rows, count } = await Show.findAndCountAll({
    where,
    include: includeArray,
    order,
    limit: limit + 1,
    distinct: true,
    subQuery: false,
  });

  const totalItems = typeof count === 'number' ? count : (count as any[]).length;

  const formatted = rows.map((show: any) => ({
    id: show.id,
    date: show.date,
    venue: show.venue ? {
      id: show.venue.id,
      name: show.venue.name,
      city: show.venue.city,
      state: show.venue.state,
      country: show.venue.country,
      geometry: show.venue.geom,
    } : null,
    notes: show.showNotes,
  }));

  return buildPaginatedResponse({
    rows: formatted,
    totalItems,
    limit,
    sortKey: sortBy === 'date' ? 'date' : 'date',
    direction: direction as 'asc' | 'desc',
  });
}

export async function getShow(id: number) {
  const show = await Show.findByPk(id, {
    include: [
      {
        model: Venue,
        as: 'venue',
        attributes: ['id', 'name', 'city', 'state', 'country', 'geom'],
      },
      {
        model: Version,
        as: 'versions',
        include: [
          {
            model: Song,
            as: 'song',
            attributes: ['id', 'title'],
          },
        ],
        order: [['position', 'ASC']],
      },
    ],
    order: [[{ model: Version, as: 'versions' }, 'position', 'ASC']],
  });

  if (!show) {
    throw new NotFoundError('Show not found');
  }

  // Group versions into sets
  const sets: Record<string, any[]> = {};
  const numericSets = new Set<number>();
  let didEncore = false;

  for (const version of (show.versions || [])) {
    const mappedSet = mapSetNumber(version.setNumber);
    if (!sets[mappedSet]) {
      sets[mappedSet] = [];
    }

    const numParsed = parseInt(mappedSet, 10);
    if (!isNaN(numParsed) && numParsed > 0) {
      numericSets.add(numParsed);
    }

    if (mappedSet.startsWith('E')) {
      didEncore = true;
    }

    sets[mappedSet].push({
      songId: version.song?.id,
      title: version.song?.title,
      position: version.position,
      setNumber: mappedSet,
      transition: version.transition,
      versionNotes: version.versionNotes,
    });
  }

  const setCount = numericSets.size;

  return {
    id: show.id,
    date: show.date,
    venue: show.venue ? {
      id: show.venue.id,
      name: show.venue.name,
      city: show.venue.city,
      state: show.venue.state,
      country: show.venue.country,
      geometry: show.venue.geom,
    } : null,
    notes: show.showNotes,
    setCount,
    didEncore,
    sets,
  };
}

interface CreateShowPayload {
  date: string;
  venueId: number;
  notes?: string | null;
  songs: Array<{
    songId: number;
    position: number;
    setNumber: string;
    transition?: boolean;
    versionNotes?: string | null;
  }>;
}

export async function createShow(payload: CreateShowPayload, userId: number) {
  const result = await sequelize.transaction(async (t) => {
    // Verify venue exists
    const venue = await Venue.findByPk(payload.venueId, { transaction: t });
    if (!venue) {
      throw new ValidationError('Venue not found');
    }

    // Create show
    const show = await Show.create(
      {
        date: payload.date,
        venueId: payload.venueId,
        showNotes: payload.notes || null,
        createdBy: userId,
      },
      { transaction: t },
    );

    // Bulk create versions
    await Version.bulkCreate(
      payload.songs.map((s) => ({
        showId: show.id,
        songId: s.songId,
        position: s.position,
        setNumber: s.setNumber,
        transition: s.transition || false,
        versionNotes: s.versionNotes || null,
        createdBy: userId,
      })),
      { transaction: t },
    );

    return { id: show.id, date: show.date };
  });

  return result;
}
