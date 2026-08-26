# maxmurr AI chat

Next.js 16 chat UI backed by Mastra and Vercel AI Gateway through AI SDK v7.

## Requirements

- Bun 1.4+
- Node.js 22.13+ compatibility for Mastra
- Docker
- Vercel AI Gateway API key

## Setup

```bash
bun install
docker compose up -d
cp .env.example .env.local
openssl rand -base64 32
```

Set `AI_GATEWAY_API_KEY` and put generated value in `BETTER_AUTH_SECRET`.

Email verification and workspace invitation delivery need a Resend API key and verified sending domain.
Set `RESEND_API_KEY` and `RESEND_EMAIL_FROM`, such as `AI Chat <notifications@yourdomain.com>`.
Without both values, local authentication keeps email verification optional and does not deliver invitation email.

Then run:

```bash
bun run db:migrate
bun dev
```

Open [http://localhost:3000/sign-up](http://localhost:3000/sign-up). Google sign-in is optional; add Google credentials and authorize `http://localhost:3000/api/auth/callback/google` to enable it.

## Architecture

![Clean architecture dependency flow](assets/clean-architecture-diagram.jpg)

Dependencies point inward. `bun run lint` rejects imports that cross these layers in the wrong direction.

| Layer | Paths | Responsibility |
| --- | --- | --- |
| Frameworks and drivers | `app`, `components`, `hooks`, `lib` | Next.js routes and UI |
| Interface adapters | `src/interface-adapters` | Input validation, controllers, presenters |
| Application | `src/application` | Use cases and infrastructure interfaces |
| Entities | `src/entities` | Provider-neutral models and errors |
| Infrastructure | `src/infrastructure` | Mastra and future repository implementations |
| Composition root | `di` | Type-safe Ioctopus registry, modules, and production wiring |
| Database driver | `drizzle` | Drizzle client, schema, migrations |

Chat flow: `app/api/chat/route.ts` -> `di/application-container.ts` -> chat controller -> application service interface -> Mastra adapter.

## Checks

```bash
bun test
bun run lint
bunx tsc --noEmit
bun run build
```

Add tables in `drizzle/app-schema.ts`, then run `bun run db:generate && bun run db:migrate`.
