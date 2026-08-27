import { mock } from "bun:test"

// Neutralize Next.js server-context guard so bun test can import modules
// that transitively reach the database client.
mock.module("server-only", () => ({}))
