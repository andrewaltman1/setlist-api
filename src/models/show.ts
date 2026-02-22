import { Model, DataTypes } from 'sequelize';
import type { Sequelize, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from 'sequelize';
import type { Venue } from './Venue.ts';
import type { Version } from './Version.ts';
import type { Song } from './Song.ts';

export class Show extends Model<InferAttributes<Show>, InferCreationAttributes<Show>> {
  declare id: CreationOptional<number>;
  declare date: string | null;
  declare venueId: number | null;
  declare showNotes: string | null;
  declare verified: CreationOptional<boolean>;
  declare updatedBy: number | null;
  declare archiveInfo: string | null;
  declare createdBy: number | null;
  declare slug: string | null;
  declare createdByUserName: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations (populated by includes)
  declare venue?: NonAttribute<Venue>;
  declare versions?: NonAttribute<Version[]>;
  declare songs?: NonAttribute<Song[]>;
}

export function initShow(sequelize: Sequelize): typeof Show {
  Show.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      venueId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      showNotes: {
        type: DataTypes.STRING(4000),
        allowNull: true,
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      archiveInfo: {
        type: DataTypes.TEXT,
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
      createdByUserName: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: 'shows',
      underscored: true,
      timestamps: true,
    },
  );
  return Show;
}
