import { Model, DataTypes } from 'sequelize';
import type { Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export class Version extends Model<InferAttributes<Version>, InferCreationAttributes<Version>> {
  declare id: CreationOptional<number>;
  declare showId: number | null;
  declare position: number | null;
  declare setNumber: CreationOptional<string>;
  declare songId: number | null;
  declare transition: boolean | null;
  declare versionNotes: string | null;
  declare createdBy: number | null;
  declare updatedBy: number | null;
  declare createdByUserName: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare show?: any;
  declare song?: any;
}

export function initVersion(sequelize: Sequelize): typeof Version {
  Version.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      showId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      setNumber: {
        type: DataTypes.STRING(255),
        defaultValue: '1',
      },
      songId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      transition: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      versionNotes: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
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
      tableName: 'versions',
      underscored: true,
      timestamps: true,
    },
  );
  return Version;
}
