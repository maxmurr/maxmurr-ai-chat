---
status: superseded by ADR-0005
---

# Chat persistence in our own tables; Mastra stays stateless

Mastra (our agent runtime) ships its own persistence — PostgresStore plus a Memory abstraction that manages threads and messages itself — so the obvious move was to switch its `InMemoryStore` to Postgres and get chat history "for free". We chose instead to persist Chats and Messages in our own Drizzle tables and keep Mastra fully stateless.

Sharing is the reason: visibility (`private | workspace | public`), public-link tokens, workspace scoping, and cascade rules are our domain concerns, and Mastra's schema has no room for them — we would end up with sidecar tables referencing Mastra-managed rows, coupling our access-control model to a third-party library's internal schema and migration cadence. Owning the tables keeps the AI SDK `UIMessage` format stored verbatim and leaves Mastra swappable.

## Consequences

- Mastra's Memory features (recall, working memory) are unavailable until someone deliberately revisits this decision — do not "fix" the `InMemoryStore` in `mastra-runtime.ts` by pointing it at Postgres.
- Message persistence is wired manually: user message on request arrival, assistant message in the stream's `onFinish`.
