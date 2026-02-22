import { Model, DataTypes } from 'sequelize';
import type { Sequelize, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from 'sequelize';
import type { Version } from './Version.ts';
import type { Show } from './Show.ts';

export class Song extends Model<InferAttributes<Song>, InferCreationAttributes<Song>> {
  declare id: CreationOptional<number>;
  declare title: string | null;
  declare author: string | null;
  declare isSong: CreationOptional<boolean>;
  declare notes: string | null;
  declare deleted: CreationOptional<boolean>;
  declare updatedBy: number | null;
  declare createdBy: number | null;
  declare slug: string | null;
  declare instrumental: boolean | null;
  declare createdByUserName: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare versions?: NonAttribute<Version[]>;
  declare shows?: NonAttribute<Show[]>;

  // Virtual fields from aggregation
  declare timesPlayed?: number;
}

export function initSong(sequelize: Sequelize): typeof Song {
  Song.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      author: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isSong: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      instrumental: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      createdByUserName: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'songs',
      underscored: true,
      timestamps: true,
    },
  );
  return Song;
}
