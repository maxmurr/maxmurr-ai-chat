# Deep modules

Copy `example/` to start a package, or delete it after creating a real one.

```text
src/packages/<name>/
├── index.ts       # entry point
├── client.ts      # optional second entry point
├── lib/           # private implementation
└── tests/         # tests and fixtures
```

1. **Entry-point seam.** Import a package only through its root files. Those files form its interface. Anything in a subfolder is private implementation. Prefer several small entry points over a barrel that re-exports an implementation subtree.

2. **Intra-package freedom.** Files inside one package may import each other freely. Keep implementation in `lib/` so callers gain behaviour through a small interface and maintainers keep changes local.

3. **Tests use entry points.** Files in `tests/` import package behaviour through root entry points, including integration tests across packages. They may import fixtures from their own `tests/` folder, but no package internals.

4. **No cycles.** Package dependencies must stay acyclic. Run `bun run lint:boundaries` to check entry-point imports and cycles.
