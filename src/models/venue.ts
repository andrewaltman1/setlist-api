import { Model, DataTypes } from 'sequelize';
import type { Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Venue extends Model<InferAttributes<Venue>, InferCreationAttributes<Venue>> {
  declare id: CreationOptional<number>;
  declare name: string | null;
  declare city: string | null;
  declare state: string | null;
  declare country: CreationOptional<string>;
  declare updatedBy: number | null;
  declare createdBy: number | null;
  declare geom: any | null;
  declare createdByUserName: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare shows?: any[];

  // Virtual fields from aggregation
  declare totalShows?: number;
}

export function initVenue(sequelize: Sequelize): typeof Venue {
  Venue.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      state: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(255),
        defaultValue: 'USA',
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      geom: {
        type: DataTypes.GEOMETRY('POINT', 4326),
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
      tableName: 'venues',
      underscored: true,
      timestamps: true,
    },
  );
  return Venue;
}
