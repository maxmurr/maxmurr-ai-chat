import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { loadEnvConfig } from "@next/env";
import { makeSignature } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../drizzle/app-schema";
import {
  INSTANT_NAVIGATION_FIXTURES,
  INSTANT_NAVIGATION_STORAGE_STATES,
} from "./instant-navigation-fixtures";

const LOCAL_DATABASE_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);
const SESSION_COOKIE_NAME = "better-auth.session_token";

function requireInstantNavigationTestEnvironment() {
  if (process.env.INSTANT_E2E !== "1") {
    throw new Error(
      "Instant navigation setup refused: run `bun run test:e2e` with INSTANT_E2E=1"
    );
  }

  const postgresUrl = process.env.POSTGRES_URL;
  const authSecret = process.env.BETTER_AUTH_SECRET;

  if (!postgresUrl || !authSecret) {
    throw new Error(
      "Instant navigation setup missing POSTGRES_URL or BETTER_AUTH_SECRET"
    );
  }

  const databaseHost = new URL(postgresUrl).hostname;
  if (!LOCAL_DATABASE_HOSTS.has(databaseHost)) {
    throw new Error(
      `Instant navigation setup refused non-local database host: ${databaseHost}`
    );
  }

  return { authSecret, postgresUrl };
}

async function createStorageState(
  authSecret: string,
  expiresAt: Date,
  sessionToken: string
) {
  const signature = await makeSignature(sessionToken, authSecret);

  return {
    cookies: [
      {
        domain: "localhost",
        expires: Math.floor(expiresAt.getTime() / 1000),
        httpOnly: true,
        name: SESSION_COOKIE_NAME,
        path: "/",
        sameSite: "Lax" as const,
        secure: false,
        value: encodeURIComponent(`${sessionToken}.${signature}`),
      },
    ],
    origins: [],
  };
}

/** Seeds local-only users and route data, then writes signed browser sessions. */
export default async function instantNavigationGlobalSetup() {
  loadEnvConfig(process.cwd());
  const { authSecret, postgresUrl } = requireInstantNavigationTestEnvironment();
  const sql = postgres(postgresUrl, { max: 1 });
  const database = drizzle(sql, { schema });
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const invitationExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const activeSessionToken = crypto.randomUUID().replaceAll("-", "");
  const onboardingSessionToken = crypto.randomUUID().replaceAll("-", "");
  const fixtures = INSTANT_NAVIGATION_FIXTURES;

  try {
    await database.transaction(async (transaction) => {
      await transaction
        .delete(schema.organization)
        .where(eq(schema.organization.id, fixtures.workspace.id));
      await transaction
        .delete(schema.user)
        .where(
          inArray(schema.user.id, [
            fixtures.activeUser.id,
            fixtures.onboardingUser.id,
          ])
        );

      await transaction.insert(schema.user).values([
        {
          createdAt: now,
          email: fixtures.activeUser.email,
          emailVerified: true,
          id: fixtures.activeUser.id,
          image: null,
          name: fixtures.activeUser.name,
          updatedAt: now,
          username: fixtures.activeUser.username,
        },
        {
          createdAt: now,
          email: fixtures.onboardingUser.email,
          emailVerified: true,
          id: fixtures.onboardingUser.id,
          image: null,
          name: fixtures.onboardingUser.name,
          updatedAt: now,
          username: fixtures.onboardingUser.username,
        },
      ]);
      await transaction.insert(schema.organization).values({
        createdAt: now,
        id: fixtures.workspace.id,
        logo: null,
        metadata: null,
        name: fixtures.workspace.name,
        slug: fixtures.workspace.slug,
      });
      await transaction.insert(schema.member).values({
        createdAt: now,
        id: "instant-nav-member",
        organizationId: fixtures.workspace.id,
        role: "owner",
        userId: fixtures.activeUser.id,
      });
      await transaction.insert(schema.invitation).values({
        createdAt: now,
        email: fixtures.onboardingUser.email,
        expiresAt: invitationExpiresAt,
        id: fixtures.invitation.id,
        inviterId: fixtures.activeUser.id,
        organizationId: fixtures.workspace.id,
        role: "member",
        status: "pending",
      });
      await transaction.insert(schema.chat).values({
        createdAt: now,
        id: fixtures.chat.id,
        organizationId: fixtures.workspace.id,
        ownerId: fixtures.activeUser.id,
        pinned: true,
        publicToken: fixtures.chat.publicToken,
        title: fixtures.chat.title,
        updatedAt: now,
        visibility: "public",
      });
      await transaction.insert(schema.project).values({
        createdAt: now,
        description: "Persisted Project fixture",
        id: fixtures.project.id,
        instructions: "",
        name: fixtures.project.name,
        organizationId: fixtures.workspace.id,
        ownerId: fixtures.activeUser.id,
        updatedAt: now,
      });
      await transaction.insert(schema.libraryFolder).values({
        createdAt: now,
        id: fixtures.folder.id,
        name: fixtures.folder.name,
        organizationId: fixtures.workspace.id,
        ownerId: fixtures.activeUser.id,
      });
      await transaction.insert(schema.session).values([
        {
          activeOrganizationId: fixtures.workspace.id,
          createdAt: now,
          expiresAt,
          id: "instant-nav-active-session",
          ipAddress: null,
          token: activeSessionToken,
          updatedAt: now,
          userAgent: "Playwright instant navigation",
          userId: fixtures.activeUser.id,
        },
        {
          activeOrganizationId: null,
          createdAt: now,
          expiresAt,
          id: "instant-nav-onboarding-session",
          ipAddress: null,
          token: onboardingSessionToken,
          updatedAt: now,
          userAgent: "Playwright instant navigation",
          userId: fixtures.onboardingUser.id,
        },
      ]);
    });

    const stateDirectory = join(process.cwd(), ".scratch", "instant-nav");
    await mkdir(stateDirectory, { recursive: true });
    await Promise.all([
      writeFile(
        join(process.cwd(), INSTANT_NAVIGATION_STORAGE_STATES.active),
        JSON.stringify(
          await createStorageState(authSecret, expiresAt, activeSessionToken)
        )
      ),
      writeFile(
        join(process.cwd(), INSTANT_NAVIGATION_STORAGE_STATES.onboarding),
        JSON.stringify(
          await createStorageState(
            authSecret,
            expiresAt,
            onboardingSessionToken
          )
        )
      ),
    ]);
  } finally {
    await sql.end();
  }

  // ponytail: deterministic fixture rows persist; move to isolated test DB if parallel environments need cleanup.
}
