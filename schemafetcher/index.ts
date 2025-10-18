import "dotenv/config";
import { $ } from "bun";
import { mkdirSync } from "node:fs";
import path from "node:path";

type FlagMap = Record<string, string | boolean>;

interface ParsedArgs {
  command?: string;
  flags: FlagMap;
  positionals: string[];
}

interface CommonOptions {
  databaseUrl: string;
  outDir?: string;
}

interface PgDumpOptions extends CommonOptions {
  skipCustomDump?: boolean;
  skipPlainText?: boolean;
}

interface ParquetOptions extends CommonOptions {}

const DEFAULT_SQL_DIR = "sql-dumps";
const DEFAULT_PARQUET_DIR = "parquet-out";

async function main() {
  const parsed = parseArgs(Bun.argv.slice(2));
  const command = parsed.command ?? "help";

  if (parsed.flags.help || parsed.flags.h || command === "help") {
    printUsage();
    process.exit(0);
  }

  const databaseUrl = await resolveDatabaseUrl(parsed.flags);
  const outDirFlag = readStringFlag(parsed.flags, "out") ?? readStringFlag(parsed.flags, "out-dir");

  try {
    switch (command) {
      case "pg-dump": {
        await runPgDump({
          databaseUrl,
          outDir: outDirFlag ?? DEFAULT_SQL_DIR,
          skipPlainText: Boolean(parsed.flags["skip-sql"]),
          skipCustomDump: Boolean(parsed.flags["skip-custom"]),
        });
        break;
      }
      case "parquet": {
        await exportParquet({
          databaseUrl,
          outDir: outDirFlag ?? DEFAULT_PARQUET_DIR,
        });
        break;
      }
      case "all": {
        await runPgDump({
          databaseUrl,
          outDir: path.join(outDirFlag ?? ".", DEFAULT_SQL_DIR),
        });
        await exportParquet({
          databaseUrl,
          outDir: path.join(outDirFlag ?? ".", DEFAULT_PARQUET_DIR),
        });
        break;
      }
      default:
        printUsage(`Unknown command "${command}"`);
        process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();

function parseArgs(args: string[]): ParsedArgs {
  if (args.length === 0) {
    return { command: "help", flags: {}, positionals: [] };
  }

  const [command, ...rest] = args;
  const flags: FlagMap = {};
  const positionals: string[] = [];

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (!arg.startsWith("-") || arg === "-") {
      positionals.push(arg);
      continue;
    }

    if (arg.startsWith("--")) {
      const [rawKey, rawValue] = arg.slice(2).split("=", 2);
      const key = rawKey.trim().toLowerCase();
      if (!key) continue;

      if (rawValue !== undefined) {
        flags[key] = rawValue;
        continue;
      }

      const next = rest[i + 1];
      if (next && !next.startsWith("-")) {
        flags[key] = next;
        i += 1;
      } else {
        flags[key] = true;
      }
    } else {
      const shortFlags = arg.slice(1);
      for (const ch of shortFlags) {
        flags[ch] = true;
      }
    }
  }

  return { command, flags, positionals };
}

async function resolveDatabaseUrl(flags: FlagMap): Promise<string> {
  const fromFlag =
    readStringFlag(flags, "database-url") ??
    readStringFlag(flags, "db") ??
    readStringFlag(flags, "url");
  const fromEnv = process.env.DATABASE_URL;

  const value = fromFlag ?? fromEnv;
  if (!value) {
    const prompted = await promptForDatabaseUrl();
    return prompted;
  }
  return value;
}

async function promptForDatabaseUrl(): Promise<string> {
  console.log("DATABASE_URL not found in environment or flags.");
  console.log("Please enter your database connection string:");
  console.log("(Format: postgres://user:pass@host:5432/db)");

  const password = await Bun.password({
    prompt: "Connection string: ",
  });

  if (!password || password.trim() === "") {
    throw new Error("Database URL is required to continue.");
  }

  return password.trim();
}

function readStringFlag(flags: FlagMap, key: string): string | undefined {
  const value = flags[key];
  return typeof value === "string" ? value : undefined;
}

async function runPgDump(options: PgDumpOptions) {
  const { databaseUrl, outDir = DEFAULT_SQL_DIR, skipCustomDump, skipPlainText } = options;

  if (!commandExists("pg_dump")) {
    throw new Error(
      'pg_dump was not found on PATH. Install PostgreSQL client tools (e.g., "brew install libpq") and try again.',
    );
  }

  mkdirSync(outDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = `dump-${timestamp}`;

  if (!skipPlainText) {
    const sqlPath = path.join(outDir, `${baseName}.sql`);
    await $`pg_dump --dbname=${databaseUrl} --file=${sqlPath}`;
    console.log(`✅ Wrote PostgreSQL plain-text dump to ${sqlPath}`);
  }

  if (!skipCustomDump) {
    const customPath = path.join(outDir, `${baseName}.pgdump`);
    await $`pg_dump --dbname=${databaseUrl} --format=custom --file=${customPath}`;
    console.log(`✅ Wrote PostgreSQL custom-format dump to ${customPath}`);
  }
}

async function exportParquet(options: ParquetOptions) {
  const { databaseUrl, outDir = DEFAULT_PARQUET_DIR } = options;

  if (!commandExists("duckdb")) {
    throw new Error(
      'duckdb was not found on PATH. Install DuckDB from https://duckdb.org/install and try again.',
    );
  }

  mkdirSync(outDir, { recursive: true });

  console.log(`Exporting database to Parquet using DuckDB...`);

  // First, get the list of tables
  const getTablesCommand = `
    INSTALL postgres;
    LOAD postgres;
    ATTACH '${databaseUrl}' AS pg (TYPE POSTGRES);
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
  `.trim().replace(/\n\s+/g, ' ');

  const result = await $`duckdb -csv -c ${getTablesCommand}`.text();
  const tables = result
    .split('\n')
    .slice(1) // Skip header
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (tables.length === 0) {
    throw new Error('No tables found in the public schema');
  }

  console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);

  // Export each table to parquet
  for (const table of tables) {
    const outputPath = path.join(outDir, `${table}.parquet`);
    console.log(`  Exporting ${table}...`);

    const exportCommand = `
      INSTALL postgres;
      LOAD postgres;
      ATTACH '${databaseUrl}' AS pg (TYPE POSTGRES);
      COPY (SELECT * FROM pg.public.${table})
      TO '${outputPath}'
      (FORMAT PARQUET, COMPRESSION ZSTD);
    `.trim().replace(/\n\s+/g, ' ');

    await $`duckdb -c ${exportCommand}`;
    console.log(`    ✅ Exported ${table}`);
  }

  console.log(`✅ Finished Parquet export to ${outDir}`);
}

function commandExists(command: string): boolean {
  try {
    const which = Bun.which(command);
    return which !== null;
  } catch {
    return false;
  }
}

function printUsage(prefix?: string) {
  if (prefix) {
    console.error(prefix);
    console.error("");
  }

  console.log(`Usage:
  bun run index.ts <command> [options]

Commands:
  pg-dump            Create PostgreSQL dumps using pg_dump
  parquet            Export all tables to Parquet files using DuckDB
  all                Run pg-dump and parquet sequentially
  help               Show this help message

Prerequisites:
  pg-dump            PostgreSQL client tools (brew install libpq)
  parquet            DuckDB CLI (https://duckdb.org/install)

Common options:
  --database-url=URL    Postgres connection string (defaults to env DATABASE_URL)
                        If not provided, you will be prompted to enter it
  --out=DIR             Output directory (defaults vary by command)

pg-dump options:
  --skip-sql            Skip generating the plain-text SQL dump
  --skip-custom         Skip generating the custom-format dump

Examples:
  DATABASE_URL=postgres://user:pass@host/db bun run index.ts pg-dump
  bun run index.ts parquet --database-url=postgres://... --out data
  bun run index.ts all --out backups
`);
}
