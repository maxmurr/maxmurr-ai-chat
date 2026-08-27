import { mock } from "bun:test"

// Neutralize Next.js server-context guard so bun test can import modules
// that transitively reach the database client.
mock.module("server-only", () => ({}))

// Client components use router hooks; bun test renders them without an
// app router mount.
mock.module("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound")
  },
  redirect: (url: string) => {
    throw new Error(`redirect: ${url}`)
  },
  usePathname: () => "/chat",
  useRouter: () => ({
    back: () => {},
    forward: () => {},
    prefetch: () => {},
    push: () => {},
    refresh: () => {},
    replace: () => {},
  }),
}))
