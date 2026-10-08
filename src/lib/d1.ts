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
        "ALTER TABLE cashouts ADD COLUMN reviewed_at TEXT",
        "ALTER TABLE users ADD COLUMN google_sub TEXT",
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)",
        "ALTER TABLE users ADD COLUMN referred_by TEXT",
        "CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by)",
      ]) {
        try {
          await db.prepare(column).run();
        } catch {
          /* column or index already exists */
        }
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

/** Share of a referred friend's earned points paid to whoever invited them. */
export const REFERRAL_RATE = 0.1;

/**
 * Pays the referrer of `userId` a bonus for a points reward the user just
 * earned from a completed offer. Idempotent per conversion (keyed on txid),
 * so a repeated postback never pays twice. Never throws: a referral problem
 * must not fail the user's own credit.
 */
export async function creditReferrer(
  db: D1DatabaseLike,
  userId: string,
  earnedPoints: number,
  txid: string,
): Promise<void> {
  try {
    const row = await db
      .prepare("SELECT referred_by FROM users WHERE id = ?")
      .bind(userId)
      .first<Record<string, unknown>>();
    const referrer = String(row?.referred_by ?? "").trim();
    if (!referrer || referrer === userId) return;
    const bonus = Math.floor(earnedPoints * REFERRAL_RATE);
    if (bonus < 1) return;
    const refTx = ("ref_" + txid).slice(0, 160);
    const transactionId = ("txn_" + referrer + "_" + refTx).slice(0, 220);
    const inserted = await db
      .prepare("INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)")
      .bind(transactionId, referrer, bonus, refTx, "referral_bonus")
      .run();
    if (inserted.meta?.changes !== 0) {
      await db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(bonus, referrer).run();
    }
  } catch (error) {
    console.error("[referral] bonus failed", error);
  }
}
