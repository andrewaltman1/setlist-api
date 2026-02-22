import { Show, Song, Venue } from '../models/index.ts';

export async function getStats() {
  const [totalShows, totalSongs, totalVenues, uniqueCities, uniqueStates] = await Promise.all([
    Show.count(),
    Song.count({ where: { isSong: true, deleted: false } }),
    Venue.count(),
    Venue.count({ distinct: true, col: 'city' }),
    Venue.count({ distinct: true, col: 'state' }),
  ]);

  const [earliest, latest] = await Promise.all([
    Show.min('date') as Promise<string | null>,
    Show.max('date') as Promise<string | null>,
  ]);

  let yearsActive = 0;
  if (earliest && latest) {
    yearsActive = new Date(latest).getFullYear() - new Date(earliest).getFullYear() + 1;
  }

  const mostRecentShow = await Show.findOne({
    order: [['date', 'DESC']],
    include: [{ model: Venue, as: 'venue', attributes: ['name'] }],
  });

  return {
    totalShows,
    totalSongs,
    totalVenues,
    uniqueCities,
    uniqueStates,
    yearsActive,
    mostRecentShow: mostRecentShow ? {
      id: mostRecentShow.id,
      date: mostRecentShow.date,
      venueName: mostRecentShow.venue?.name || null,
    } : null,
  };
}
