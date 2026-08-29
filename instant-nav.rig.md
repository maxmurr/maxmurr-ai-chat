# instant-nav rig: maxmurr-ai-chat

- BUILD: `INSTANT_E2E=1 BETTER_AUTH_URL=http://localhost:3100 bun run build`, then `PORT=3100 bun run start`; Playwright `webServer` runs both.
- EXPOSE: `process.env.INSTANT_E2E === "1"` enables `experimental.exposeTestingApiInProductionBuild`; unset in normal production.
- RUN: `bun run test:e2e` against `http://localhost:3100`.
- TEST USER: global setup seeds local-only active-workspace and no-workspace accounts, then signs Better Auth storage states without login UI. Active account has owner role, one chat/public share, one Library folder, seed browser projects, and default plan/flags.
- DRIFT: workspace membership, active workspace, email verification, localStorage project mutations, chat/folder fixture presence, plan/flags, viewport, and auth-cookie expiry.
- LOOP: stop any process on port 3100 → Playwright builds → starts production server → seeds deterministic local fixtures → runs desktop and mobile Chromium guards → tears server down. Agent limit: PostgreSQL must already run and migrations must be current.
- LIVENESS: n/a; local build and `reuseExistingServer: false` guarantee freshly built artifact owns port 3100.
- WALLS: setup refuses non-local PostgreSQL hosts; email OTP is external and encrypted, so tests create signed local sessions instead; `BETTER_AUTH_URL` must be `http://localhost:3100`; a busy port fails rather than reusing stale server.
