# schemafetcher

Utility scripts for working with PostgreSQL schemas in Bun + TypeScript. The CLI wraps two workflows:

- `pg_dump` based exports for full-fidelity PostgreSQL backups.
- Per-table Parquet exports built with Bun's native SQL client and the [`parquets`](https://www.npmjs.com/package/parquets) library.

> **Prerequisites**
>
> - Bun `^1.0`
> - PostgreSQL client tools (`pg_dump`).  
>   macOS: `brew install libpq && echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc`  
>   Debian/Ubuntu: `sudo apt-get install postgresql-client`
> - A `DATABASE_URL` pointing at the database you want to snapshot.

## Installation

```bash
bun install
```

## Commands

All commands are invoked through Bun:

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
- `--out=dir` – directory for output files (defaults to `sql-dumps`).
- `--skip-sql` – disable the plain-text dump.
- `--skip-custom` – disable the custom-format dump.

### `parquet`

Exports every base table to a Parquet file using Bun's native `SQL` adapter and `parquets`.

```bash
bun run index.ts parquet --out data/parquet --batch-size=25000
```

Options:

- `--database-url=...` – override `DATABASE_URL`.
- `--out=dir` – directory for Parquet files (defaults to `parquet-out`).
- `--batch-size=n` – number of rows fetched per round trip (default `50000`).
- `--schema=public,...` – limit exports to specific schemas.
- `--table=users,...` – limit exports to specific table names.

Each table produces `<schema>.<table>.parquet`. Complex types (arrays, JSON, etc.) are stringified; timestamps are stored as ISO strings. Adjust the type mapping in `index.ts` if you need stricter Parquet logical types (e.g., DECIMAL with precision/scale).

### `all`

Runs `pg-dump` followed by `parquet`. Useful for nightly jobs:

```bash
bun run index.ts all --out ./backups --batch-size=10000
```

This creates:

- `./backups/sql-dumps/dump-<timestamp>.{sql,pgdump}`
- `./backups/parquet-out/<schema>.<table>.parquet`

## Notes & Next Steps

- Want blazing fast Parquet exports without TypeScript? DuckDB can connect directly to Postgres:

Duck DB Install: https://duckdb.org/install

  ```bash
  duckdb -c "INSTALL postgres; LOAD postgres;
    ATTACH 'postgres://user:pass@host:5432/db' AS pg (TYPE POSTGRES);
    EXPORT DATABASE 'parquet-out' (FORMAT PARQUET, COMPRESSION ZSTD);"
  ```

- If you need streaming exports for very large tables, consider swapping `sqlClient.unsafe` with a cursor-based reader (e.g., `pg-query-stream`) or lowering `--batch-size`.
- To capture Postgres roles/globals, also run `pg_dumpall --globals-only`.
