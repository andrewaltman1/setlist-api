import { Op } from 'sequelize';
import type { Order } from 'sequelize';
import { z } from 'zod';
import { sequelize, Venue, Show } from '../models/index.ts';
import { NotFoundError } from '../utils/errors.ts';
import { decodeCursor, buildPaginatedResponse } from '../utils/pagination.ts';
import { listVenuesQuery, createVenueBody } from '../routes/v1/venues.ts';

type ListVenuesParams = z.infer<typeof listVenuesQuery>;

export async function listVenues(params: ListVenuesParams) {
  const {
    cursor,
    limit,
    sortBy,
    direction,
    state,
    city,
    country,
  } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic Op.and accumulation is incompatible with WhereOptions
  const where: any = {};

  if (state) {
    where.state = state;
  }

  if (city) {
    where.city = city;
  }

  if (country) {
    where.country = country;
  }

  if (cursor) {
    const decoded = decodeCursor(cursor);
    const sortColMap: Record<string, string> = {
      name: 'name',
      city: 'city',
      state: 'state',
    };
    const sortCol = sortColMap[sortBy] || 'name';
    if (sortBy !== 'total') {
      if (direction === 'desc') {
        where[Op.and] = [
          ...(where[Op.and] || []),
          sequelize.literal(`("Venue"."${sortCol}", "Venue"."id") < ('${decoded.v}', ${decoded.id})`),
        ];
      } else {
        where[Op.and] = [
          ...(where[Op.and] || []),
          sequelize.literal(`("Venue"."${sortCol}", "Venue"."id") > ('${decoded.v}', ${decoded.id})`),
        ];
      }
    }
  }

  // Determine sort order
  let order: Order;
  if (sortBy === 'total') {
    order = [[sequelize.literal('"totalShows"'), direction], ['id', direction]];
  } else if (sortBy === 'city') {
    order = [['city', direction], ['id', direction]];
  } else if (sortBy === 'state') {
    order = [['state', direction], ['id', direction]];
  } else {
    order = [['name', direction], ['id', direction]];
  }

  const { rows, count } = await Venue.findAndCountAll({
    attributes: {
      include: [
        [sequelize.fn('COUNT', sequelize.col('shows.id')), 'totalShows'],
      ],
    },
    where,
    include: [
      {
        model: Show,
        as: 'shows',
        attributes: [],
      },
    ],
    group: ['Venue.id'],
    order,
    limit: limit + 1,
    subQuery: false,
  });

  const totalItems = typeof count === 'number' ? count : (count as { count: number }[]).length;

  const formatted = rows.map((venue) => ({
    id: venue.id,
    name: venue.name,
    city: venue.city,
    state: venue.state,
    country: venue.country,
    geometry: venue.geom,
    totalShows: Number(venue.getDataValue('totalShows')) || 0,
  }));

  return buildPaginatedResponse({
    rows: formatted,
    totalItems,
    limit,
    sortKey: sortBy === 'total' ? 'totalShows' : (sortBy === 'city' ? 'city' : sortBy === 'state' ? 'state' : 'name'),
    direction,
  });
}

export async function getVenue(id: number) {
  const venue = await Venue.findByPk(id, {
    include: [
      {
        model: Show,
        as: 'shows',
        attributes: ['id', 'date'],
        order: [['date', 'DESC']],
      },
    ],
    order: [[{ model: Show, as: 'shows' }, 'date', 'DESC']],
  });

  if (!venue) {
    throw new NotFoundError('Venue not found');
  }

  const shows = (venue.shows || []).map((show) => ({
    id: show.id,
    date: show.date,
  }));

  return {
    id: venue.id,
    name: venue.name,
    city: venue.city,
    state: venue.state,
    country: venue.country,
    geometry: venue.geom,
    totalShows: shows.length,
    shows,
  };
}

type CreateVenuePayload = z.infer<typeof createVenueBody>;

export async function createVenue(payload: CreateVenuePayload, userId: number) {
  const venue = await Venue.create({
    name: payload.name,
    city: payload.city,
    state: payload.state,
    country: payload.country,
    geom: null,
    createdBy: userId,
  });

  return {
    id: venue.id,
    name: venue.name,
    city: venue.city,
    state: venue.state,
    country: venue.country,
    geometry: venue.geom,
    totalShows: 0,
  };
}
