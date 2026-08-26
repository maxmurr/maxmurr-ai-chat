import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());

const postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl) {
  throw new Error("Drizzle configuration error: POSTGRES_URL is not set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/app-schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: { url: postgresUrl },
});
