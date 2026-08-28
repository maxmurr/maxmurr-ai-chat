# Domain docs

Engineering skills use this repo's domain documentation before exploring code.

## Before exploring

- Read `CONTEXT.md`.
- Read ADRs under `docs/adr/` that affect the work area.

If either path is missing, proceed silently. Create domain docs only when `/domain-modeling` resolves new terms or decisions.

## Layout

This repo uses a single context:

- `CONTEXT.md` defines domain terms.
- `docs/adr/` records architectural decisions.

## Use glossary vocabulary

Use terms defined in `CONTEXT.md` in issue titles, proposals, hypotheses, and test names. Avoid synonyms that its glossary rejects.

A missing concept may mean the proposed term does not fit this project or the glossary has a real gap. Reconsider first, then note genuine gaps for `/domain-modeling`.

## Flag ADR conflicts

Call out conflicts instead of silently overriding decisions:

> Contradicts ADR-0007, but worth reopening because...
