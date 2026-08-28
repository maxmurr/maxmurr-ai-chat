# Issue tracker: local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- Feature spec: `.scratch/<feature-slug>/spec.md`
- Implementation issues: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`
- Number issues from `01`. Never combine tickets into one file.
- Append discussion under an `## Comments` heading.

## When a skill says "publish to the issue tracker"

Create a file under `.scratch/<feature-slug>/`, creating directories when needed.

## When a skill says "fetch the relevant ticket"

Read the referenced file. Users will normally provide its path or issue number.

## Wayfinding operations

Used by `/wayfinder`. A map is one file with one child file per ticket.

- **Map:** `.scratch/<effort>/map.md`
- **Child ticket:** `.scratch/<effort>/issues/NN-<slug>.md`
- **Type:** Record `research`, `prototype`, `grilling`, or `task` in a `Type:` line.
- **Status:** Record `claimed` or `resolved` in a `Status:` line.
- **Blocking:** Record dependencies in a `Blocked by: NN, NN` line. A ticket is unblocked when every listed ticket has status `resolved`.
- **Frontier:** Find the first numbered ticket that is open, unblocked, and unclaimed.
- **Claim:** Set `Status: claimed` and save before starting work.
- **Resolve:** Append the answer under `## Answer`, set `Status: resolved`, then add a context pointer to the map's Decisions-so-far section.
