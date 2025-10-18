# schemafetcher

Utility scripts for capturing PostgreSQL backups using Bun + TypeScript. The CLI wraps two workflows:

- PostgreSQL `pg_dump` exports for full-fidelity backups.
- Whole-database Parquet exports powered by the DuckDB CLI.

> **Prerequisites**
>
> - Bun `^1.0`
> - PostgreSQL client tools (`pg_dump`).  
>   macOS: `brew install libpq && echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc`  
>   Debian/Ubuntu: `sudo apt-get install postgresql-client`
> - DuckDB CLI (`duckdb`).  
>   macOS: `brew install duckdb`  
>   Debian/Ubuntu: `sudo apt install duckdb-cli`
> - A `DATABASE_URL` pointing at the database you want to snapshot (you will be prompted if it is missing).

## Installation

```bash
bun install
```

## Commands

All commands are invoked through Bun. If `--database-url` (or `DATABASE_URL`) is omitted you will be prompted interactively:

```bash
DATABASE_URL="postgres://user:pass@host:5432/db" bun run index.ts <command> [options]
```

### `pg-dump`

Runs `pg_dump` twice — once for a plain-text SQL dump, once for the custom-format archive (`.pgdump`) that supports `pg_restore`.

```bash
bun run index.ts pg-dump --out backups/sql
```

Options:

- `--database-url=...` – override `DATABASE_URL`.
- `--out=dir` or `--out-dir=dir` – directory for output files (defaults to `sql-dumps`).
- `--skip-sql` – disable the plain-text dump.
- `--skip-custom` – disable the custom-format dump.

### `parquet`

Uses DuckDB to attach directly to Postgres and run `EXPORT DATABASE ... (FORMAT PARQUET, COMPRESSION ZSTD)`.

```bash
bun run index.ts parquet --out data/parquet
```

Options:

- `--database-url=...` – override `DATABASE_URL`.
- `--out=dir` or `--out-dir=dir` – directory for Parquet output (defaults to `parquet-out`).

The export mirrors DuckDB’s layout: each schema becomes a subdirectory containing table-level Parquet files and DuckDB metadata.

### `all`

Runs `pg-dump` followed by `parquet`. Useful for nightly jobs:

```bash
bun run index.ts all --out ./backups
```

This creates:

- `./backups/sql-dumps/dump-<timestamp>.{sql,pgdump}`
- `./backups/parquet-out/<schema>/<table>.parquet`

## Notes & Next Steps

- Want to customize the DuckDB export manually? Run the same command the script generates:

  ```bash
  duckdb -c "INSTALL postgres; LOAD postgres;
    ATTACH 'postgres://user:pass@host:5432/db' AS pg (TYPE POSTGRES);
    EXPORT DATABASE 'parquet-out' (FORMAT PARQUET, COMPRESSION ZSTD);"
  ```

- To capture Postgres roles/globals, also run `pg_dumpall --globals-only`.
