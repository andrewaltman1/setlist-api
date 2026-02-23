import type { Options } from "sequelize";
import { config } from "./index.ts";

export const databaseConfig: Options = {
  dialect: "postgres",
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  logging: config.nodeEnv === "development" ? false : false,
  dialectOptions:
    config.nodeEnv === "production"
      ? { ssl: { rejectUnauthorized: false } }
      : {},
};
