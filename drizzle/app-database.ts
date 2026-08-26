import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";

import * as appDatabaseSchema from "./app-schema";

const postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl) {
  throw new Error("Database configuration error: POSTGRES_URL is not set");
}

/** Drizzle client for the app PostgreSQL database. */
export const appDatabase = drizzle(postgresUrl, {
  schema: appDatabaseSchema,
});
