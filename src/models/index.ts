import { Sequelize } from 'sequelize';
import { databaseConfig } from '../config/database.ts';
import { Show, initShow } from './Show.ts';
import { Song, initSong } from './Song.ts';
import { Venue, initVenue } from './Venue.ts';
import { Version, initVersion } from './Version.ts';

const sequelize = new Sequelize(databaseConfig);

// Initialize models
initShow(sequelize);
initSong(sequelize);
initVenue(sequelize);
initVersion(sequelize);

// Define associations
Show.belongsTo(Venue, { foreignKey: 'venue_id', as: 'venue' });
Venue.hasMany(Show, { foreignKey: 'venue_id', as: 'shows' });

Show.hasMany(Version, { foreignKey: 'show_id', as: 'versions' });
Version.belongsTo(Show, { foreignKey: 'show_id', as: 'show' });

Song.hasMany(Version, { foreignKey: 'song_id', as: 'versions' });
Version.belongsTo(Song, { foreignKey: 'song_id', as: 'song' });

Show.belongsToMany(Song, { through: Version, foreignKey: 'show_id', otherKey: 'song_id', as: 'songs' });
Song.belongsToMany(Show, { through: Version, foreignKey: 'song_id', otherKey: 'show_id', as: 'shows' });

export { sequelize, Show, Song, Venue, Version };
