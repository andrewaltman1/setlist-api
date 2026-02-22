import { Op } from 'sequelize';
import type { Includeable, IncludeOptions, Order } from 'sequelize';
import { z } from 'zod';
import { sequelize, Show, Venue, Version, Song } from '../models/index.ts';
import { NotFoundError, ValidationError } from '../utils/errors.ts';
import { decodeCursor, buildPaginatedResponse } from '../utils/pagination.ts';
import { listShowsQuery, createShowBody } from '../routes/v1/shows.ts';

type ListShowsParams = z.infer<typeof listShowsQuery>;
type CreateShowPayload = z.infer<typeof createShowBody>;

function mapSetNumber(raw: string): string {
  if (raw === 'Encore') return 'E';
  if (raw === '1st Encore') return 'E1';
  if (raw === '2nd Encore') return 'E2';
  if (raw === '' || raw === null) return '0';
  return raw; // '1', '2', '3' stay as-is
}

export async function listShows(params: ListShowsParams) {
  const {
    cursor,
    limit,
    sortBy,
    direction,
    songId,
    venueId,
    year,
    state,
  } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic Op.and accumulation is incompatible with WhereOptions
  const where: any = {};
  const includeArray: Includeable[] = [];

  // Always include Venue
  const venueInclude: IncludeOptions = {
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
  let order: Order;
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

  const totalItems = typeof count === 'number' ? count : (count as { count: number }[]).length;

  const formatted = rows.map((show) => ({
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
    direction,
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
  const sets: Record<string, {
    songId: number | undefined;
    title: string | null | undefined;
    position: number | null;
    setNumber: string;
    transition: boolean | null;
    versionNotes: string | null;
  }[]> = {};
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
        transition: s.transition,
        versionNotes: s.versionNotes || null,
        createdBy: userId,
      })),
      { transaction: t },
    );

    return { id: show.id, date: show.date };
  });

  return result;
}
