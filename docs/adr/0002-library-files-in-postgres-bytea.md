# Library file bytes live in Postgres, behind a repository interface

The Library stores uploaded and chat-originated files (whitelisted types, 20 MB cap). The obvious move was object storage — S3, R2, or a Railway bucket — but nothing of the sort is wired into this app today, and adding it means new credentials, env vars, SDKs, and a second infrastructure dependency to provision per environment. We chose instead to store file bytes in a `bytea` column in the same Postgres database everything else already uses, accessed only through a repository interface.

Zero new infrastructure is the reason: one table, one migration, the existing `POSTGRES_URL`, and transactional consistency between a file's metadata and its bytes for free. The repository interface is the escape hatch — when file volume makes the database bloat real (backup size, replication lag), swap the implementation for object storage without touching controllers or UI; only stored bytes need a one-time migration.

## Consequences

- Database backups and dumps grow with every upload; the 20 MB per-file cap is the guardrail, keep it enforced server-side.
- File bytes must never be selected in listing queries — fetch them only in the download path, or listings crawl.
- Moving to object storage later requires migrating existing rows' bytes, so revisit before the table gets large, not after.
