import { Request } from 'express';
import { Pool } from 'pg';

export const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: Number(process.env.DATABASE_PORT),
});

const getAllShows = async (req: Request) => {
    return await pool.query('SELECT venues.id as "venueId", shows.id as "showId", name as "venueName", city, state, country, date, ST_AsGeoJSON(geom) AS geometry FROM venues JOIN shows ON shows.venue_id = venues.id ORDER BY date DESC')
};

const getShowsBySongID = async (id: string) => {
    return await pool.query(
        'SELECT venues.id as "venueId", shows.id as "showId", songs.title, name as "venueName", city, state, country, date, ST_AsGeoJSON(geom) AS geometry FROM venues JOIN shows ON shows.venue_id = venues.id JOIN versions ON shows.id = show_id JOIN songs ON songs.id = song_id WHERE songs.id = $1 ORDER BY date DESC',
        [id]
    );
};

const getShowByID = async (id: string) => {
    return await pool.query(
        `SELECT name, city, state, country, date, ST_AsGeoJSON(geom) AS geometry, show_notes as "showNotes", title, position, set_number as "setNumber", version_notes as "versionNotes", transition FROM shows JOIN venues ON venues.id = shows.venue_id JOIN versions ON shows.id = show_id JOIN songs ON songs.id = song_id WHERE shows.id = $1 ORDER BY position`,
        [id]
    );
};

const getShowByDate = async (date: string) => {
    return await pool.query(
        `SELECT name, city, state, country, date, ST_AsGeoJSON(geom) AS geometry, show_notes as "showNotes", title, position, set_number as "setNumber", version_notes as "versionNotes", transition FROM shows JOIN venues ON venues.id = shows.venue_id JOIN versions ON shows.id = show_id JOIN songs ON songs.id = song_id WHERE shows.date = $1 ORDER BY position`,
        [date]
    );
};

const getAllSongs = async (req: Request) => {
    return await pool.query(`SELECT songs.id, title, author, COUNT(*) as "timesPlayed" FROM songs JOIN versions ON songs.id = versions.song_id WHERE songs.is_song = true GROUP BY songs.id ORDER BY "timesPlayed" DESC`);
};

const getAllSongsByAuthor = async (author: string) => {
    return await pool.query(
        `SELECT songs.id, title, author, COUNT(*) as "timesPlayed" FROM songs JOIN versions ON songs.id = versions.song_id WHERE SIMILARITY(author, $1) > 0.59 GROUP BY songs.id ORDER BY "timesPlayed" DESC`,
        [`%${author}%`]
    );
};

const getSongByID = async (id: string) => {
    return await pool.query(
        `SELECT songs.id, title, author, notes, COUNT(*) as "timesPlayed", (
          SELECT to_char(MIN(date), 'MM-DD-YYYY') as "firstTimePlayed" from shows JOIN versions on shows.id = show_id JOIN songs on songs.id = song_id WHERE songs.id = $1
          ), (
          SELECT to_char(MAX(date), 'MM-DD-YYYY') as "mostRecent" from shows JOIN versions on shows.id = show_id JOIN songs on songs.id = song_id WHERE songs.id = $1
          ) 
          FROM songs JOIN versions ON songs.id = versions.song_id WHERE songs.id = $1 GROUP BY songs.id`,
        [id]
    );
};

const getAllVenues = async (req: Request) => {
    return await pool.query(`SELECT city, state, country, venues.id as "venueId", name as "venueName", COUNT(*) as "total", ST_AsGeoJSON(geom) AS geometry FROM venues join shows on venues.id = venue_id group by venues.id order by "total" DESC`);
};

const getVenuesByState = async (state: string) => {
    return await pool.query(
        `SELECT city, state, country, venues.id as "venueId", name as "venueName", COUNT(*) as "total", ST_AsGeoJSON(geom) AS geometry, (SELECT AVG(ST_X(geom)) AS "centerLng" FROM venues where state = $1 or country = $1), (SELECT AVG(ST_Y(geom)) AS "centerLat" FROM venues where state = $1 or country = $1) FROM venues join shows on venues.id = venue_id where state = $1 or country = $1 group by venues.id order by "total" DESC`,
        [state]
    );
};

const getVenuesByCity = async (city: string, state: string) => {
    return await pool.query(
        `SELECT city, state, country, venues.id as "venueId", name as "venueName", COUNT(*) as total, ST_AsGeoJSON(geom) AS geometry, (SELECT AVG(ST_X(geom)) AS "centerLng" FROM venues where city = $1 AND state = $2 OR country = $2), (SELECT AVG(ST_Y(geom)) AS "centerLat" FROM venues where city = $1 AND state = $2 OR country = $2), MAX(date) as "mostRecent" FROM venues join shows on venues.id = venue_id where city = $1 AND state = $2 OR country = $2 group by venues.id ORDER BY "total" DESC`,
        [city, state]
    );
};

const getVenueByID = async (id: string) => {
    return await pool.query(
        `SELECT venues.id AS "venueId", shows.id AS "showId", name, city, state, country, ST_AsGeoJSON(geom) AS geometry, date FROM venues JOIN shows ON venues.id = shows.venue_id WHERE venues.id = $1 ORDER BY date`,
        [id]
    );
};

export default {
    getAllShows,
    getShowsBySongID,
    getShowByID,
    getShowByDate,
    getAllSongs,
    getAllSongsByAuthor,
    getSongByID,
    getAllVenues,
    getVenuesByState,
    getVenuesByCity,
    getVenueByID,
};
