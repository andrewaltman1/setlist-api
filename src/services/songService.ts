import { Op, QueryTypes } from 'sequelize';
import type { Order } from 'sequelize';
import { z } from 'zod';
import { sequelize, Song, Version, Show, Venue } from '../models/index.ts';
import { NotFoundError } from '../utils/errors.ts';
import { decodeCursor, buildPaginatedResponse } from '../utils/pagination.ts';
import { listSongsQuery } from '../routes/v1/songs.ts';

type ListSongsParams = z.infer<typeof listSongsQuery>;

export async function listSongs(params: ListSongsParams) {
  const {
    cursor,
    limit,
    sortBy,
    direction,
    author,
  } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic Op.and accumulation is incompatible with WhereOptions
  const where: any = {
    isSong: true,
    deleted: false,
  };

  if (author) {
    // Escape single quotes in author to prevent SQL injection
    const escapedAuthor = author.replace(/'/g, "''");
    where[Op.and] = [
      ...(where[Op.and] || []),
      sequelize.literal(`SIMILARITY("Song"."author", '${escapedAuthor}') > 0.59`),
    ];
  }

  if (cursor) {
    const decoded = decodeCursor(cursor);
    const sortCol = sortBy === 'author' ? 'author' : 'title';
    if (direction === 'desc') {
      where[Op.and] = [
        ...(where[Op.and] || []),
        sequelize.literal(`("Song"."${sortCol}", "Song"."id") < ('${decoded.v}', ${decoded.id})`),
      ];
    } else {
      where[Op.and] = [
        ...(where[Op.and] || []),
        sequelize.literal(`("Song"."${sortCol}", "Song"."id") > ('${decoded.v}', ${decoded.id})`),
      ];
    }
  }

  // Determine sort order
  let order: Order;
  if (sortBy === 'author') {
    order = [['author', direction], ['id', direction]];
  } else if (sortBy === 'timesPlayed') {
    order = [[sequelize.literal('"timesPlayed"'), direction], ['id', direction]];
  } else {
    order = [['title', direction], ['id', direction]];
  }

  const { rows, count } = await Song.findAndCountAll({
    attributes: {
      include: [
        [sequelize.fn('COUNT', sequelize.col('versions.id')), 'timesPlayed'],
      ],
    },
    where,
    include: [
      {
        model: Version,
        as: 'versions',
        attributes: [],
      },
    ],
    group: ['Song.id'],
    order,
    limit: limit + 1,
    subQuery: false,
  });

  const totalItems = typeof count === 'number' ? count : (count as { count: number }[]).length;

  const formatted = rows.map((song) => ({
    id: song.id,
    title: song.title,
    author: song.author,
    timesPlayed: Number(song.getDataValue('timesPlayed')) || 0,
  }));

  return buildPaginatedResponse({
    rows: formatted,
    totalItems,
    limit,
    sortKey: sortBy === 'author' ? 'author' : 'title',
    direction,
  });
}

export async function getSong(id: number) {
  const song = await Song.findByPk(id, {
    include: [
      {
        model: Version,
        as: 'versions',
        include: [
          {
            model: Show,
            as: 'show',
            include: [{ model: Venue, as: 'venue', attributes: ['name'] }],
            attributes: ['id', 'date'],
          },
        ],
      },
    ],
  });

  if (!song) {
    throw new NotFoundError('Song not found');
  }

  const versions = song.versions || [];
  const timesPlayed = versions.length;

  // Extract show dates for computing first/last played
  const showDates = versions
    .filter((v) => v.show?.date)
    .map((v) => ({ date: v.show!.date!, showId: v.show!.id, venueName: v.show!.venue?.name }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const firstPlayed = showDates.length > 0 ? showDates[showDates.length - 1].date : null;
  const lastPlayed = showDates.length > 0 ? showDates[0].date : null;

  const shows = showDates.map((s) => ({
    showId: s.showId,
    date: s.date,
    venueName: s.venueName,
  }));

  return {
    id: song.id,
    title: song.title,
    author: song.author,
    notes: song.notes,
    instrumental: song.instrumental,
    timesPlayed,
    firstPlayed,
    lastPlayed,
    shows,
  };
}

export async function lookupSongs(titles: string[]) {
  const resolved: Record<string, { id: number; title: string; matchType: string; confidence: number }> = {};
  const unresolved: string[] = [];

  for (const inputTitle of titles) {
    const escapedTitle = inputTitle.replace(/'/g, "''");
    const results = await sequelize.query(
      `SELECT id, title, SIMILARITY(title, $1) as confidence
       FROM songs
       WHERE SIMILARITY(title, $1) > 0.3 AND is_song = true AND deleted = false
       ORDER BY confidence DESC
       LIMIT 1`,
      {
        bind: [inputTitle],
        type: QueryTypes.SELECT,
      },
    ) as { id: number; title: string; confidence: string }[];

    if (results.length > 0) {
      const match = results[0];
      const confidence = parseFloat(match.confidence);
      resolved[inputTitle] = {
        id: match.id,
        title: match.title,
        matchType: confidence >= 0.8 ? 'exact' : 'fuzzy',
        confidence,
      };
    } else {
      unresolved.push(inputTitle);
    }
  }

  return { resolved, unresolved };
}
