export type D1PreparedStatement = {
  bind: (...values: unknown[]) => {
    first: <T = Record<string, unknown>>() => Promise<T | null>;
    run: () => Promise<{ meta?: { changes?: number } }>;
    all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
  };
  run: () => Promise<{ meta?: { changes?: number } }>;
};

export type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatement;
};

export function getDatabase(context: unknown): D1DatabaseLike | null {
  const value = context && typeof context === "object" ? (context as Record<string, unknown>) : {};
  const nested =
    value["env"] && typeof value["env"] === "object"
      ? (value["env"] as Record<string, unknown>)
      : null;
  const globalEnv = (globalThis as unknown as { __env__?: Record<string, unknown> }).__env__;
  const processEnv = (globalThis as unknown as { process?: { env?: Record<string, unknown> } })
    .process?.env;
  return (value["DB"] ??
    nested?.["DB"] ??
    globalEnv?.["DB"] ??
    processEnv?.["DB"] ??
    null) as D1DatabaseLike | null;
}

/** Reads Worker environment bindings/secrets from the request context. */
export function getEnv(context: unknown): Record<string, unknown> {
  const value = context && typeof context === "object" ? (context as Record<string, unknown>) : {};
  const nested =
    value["env"] && typeof value["env"] === "object"
      ? (value["env"] as Record<string, unknown>)
      : {};
  const processEnv = (globalThis as unknown as { process?: { env?: Record<string, unknown> } })
    .process?.env;
  return { ...(processEnv ?? {}), ...nested, ...value };
}

export function envString(context: unknown, name: string): string | null {
  const value = getEnv(context)[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

let schemaPromise: Promise<void> | null = null;

/**
 * Creates the wallet schema if it does not exist yet. Statements match the
 * schema already present in the production D1 database, so this is a no-op
 * there and only matters for fresh databases/previews.
 */
export function ensureSchema(db: D1DatabaseLike): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await db
        .prepare(
          "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, points INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, password TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT '')",
        )
        .run();
      await db
        .prepare(
          "CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, amount INTEGER NOT NULL, txid TEXT UNIQUE NOT NULL, type TEXT DEFAULT 'job_reward', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
        )
        .run();
      await db
        .prepare(
          "CREATE TABLE IF NOT EXISTS user_sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL)",
        )
        .run();
      await db
        .prepare(
          "CREATE TABLE IF NOT EXISTS cashouts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, destination TEXT NOT NULL, method TEXT NOT NULL, points INTEGER NOT NULL, usd REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)",
        )
        .run();
      for (const column of [
        "ALTER TABLE cashouts ADD COLUMN paypal_batch_id TEXT",
        "ALTER TABLE cashouts ADD COLUMN paypal_item_id TEXT",
        "ALTER TABLE cashouts ADD COLUMN paypal_status TEXT",
        "ALTER TABLE cashouts ADD COLUMN error_message TEXT",
      ]) {
        try {
          await db.prepare(column).run();
        } catch {
          /* column already exists */
        }
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}
