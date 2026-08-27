// Minimal typing for the bun test preload; @types/bun is not installed.
declare module "bun:test" {
  export const mock: {
    module(specifier: string, factory: () => unknown): void
  }
}
