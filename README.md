# maxmurr AI chat

Next.js 16 chat UI backed by Mastra and Vercel AI Gateway through AI SDK. Client chat state uses `@ai-sdk-tools/store` over AI SDK v5.

## Requirements

- Bun 1.4+
- Node.js 22.13+ compatibility for Mastra
- Vercel AI Gateway API key

## Setup

```bash
bun install
cp .env.example .env.local
```

Set `AI_GATEWAY_API_KEY` in `.env.local`, then run:

```bash
bun dev
```

Open [http://localhost:3000/chat](http://localhost:3000/chat).

## Checks

```bash
bun test
bun run lint
bun run build
```

Chat endpoint lives at `app/api/chat/route.ts`. Mastra agent lives at `mastra/agents/chat-assistant-agent.ts`.
