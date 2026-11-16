import { createFileRoute } from "@tanstack/react-router";
import { creditReferrer, ensureSchema, envString, getDatabase } from "@/lib/d1";
import { safeEqual, theoremReachHash } from "@/lib/theoremreach.server";

/**
 * TheoremReach reward callback (S2S).
 * Callback URL set in the TheoremReach publisher dashboard (app 25752):
 * https://sydehustle.dpdns.org/api/postback/theoremreach
 * TheoremReach appends user_id, reward (app currency = points), currency (USD),
 * tx_id, debug, reversal and finally hash. Placeholder style
 * (?user_id={user_id}&reward={reward}&tx_id={tx_id}...) is accepted too.
 *
 * Security: hash = base64url(HMAC-SHA1(secret_key, full URL up to "&hash=")).
 * debug=true callbacks are verified and acknowledged but never credited.
 * Reversals (reversal=true or a negative reward, same tx_id) take the points back.
 */
export const Route = createFileRoute("/api/postback/theoremreach")({
  server: {
    handlers: {
      GET: async ({ request, context }) => handle(request, context),
      POST: async ({ request, context }) => handle(request, context),
    },
  },
});

async function verify(rawUrl: string, secret: string, given: string): Promise<boolean> {
  const idx = Math.max(rawUrl.lastIndexOf("&hash="), rawUrl.lastIndexOf("?hash="));
  if (idx < 0 || !given) return false;
  const base = rawUrl.slice(0, idx);
  const candidates = new Set<string>([base]);
  // Proxies can rewrite the scheme; accept the https form TheoremReach called.
  candidates.add(base.replace(/^http:\/\//i, "https://"));
  try {
    candidates.add(decodeURI(base));
  } catch {
    /* ignore */
  }
  const want = given.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  for (const c of candidates) {
    if (safeEqual(await theoremReachHash(secret, c), want)) return true;
  }
  return false;
}

async function handle(request: Request, context: unknown) {
  const url = new URL(request.url);
  const q = (...names: string[]) => {
    for (const n of names) {
      const v = (url.searchParams.get(n) ?? "").trim();
      if (v) return v;
    }
    return "";
  };

  const secret = envString(context, "THEOREMREACH_SECRET_KEY");
  if (!secret) return new Response("TheoremReach secret key is not configured", { status: 503 });

  const hash = q("hash");
  if (!(await verify(request.url, secret, hash))) {
    return new Response("Invalid hash", { status: 401 });
  }

  const userId = q("user_id");
  const txId = q("tx_id", "transaction_id", "trans_id");
  const reward = Number(q("reward"));
  const debug = q("debug").toLowerCase() === "true";
  const reversal = q("reversal").toLowerCase() === "true" || reward < 0;

  // Dashboard test callbacks: hash verified, never credited.
  if (debug) return new Response("1");

  if (!txId || !/^[a-z0-9_.@+-]{1,128}$/i.test(userId) || !Number.isFinite(reward)) {
    return new Response("Missing tx_id, user_id or reward", { status: 400 });
  }

  const db = getDatabase(context);
  if (!db) return new Response("D1 database binding missing", { status: 500 });

  try {
    await ensureSchema(db);
    const txid = ("tr_" + txId).slice(0, 160);

    if (reversal) {
      const original = await db
        .prepare("SELECT amount FROM transactions WHERE txid = ? AND user_id = ?")
        .bind(txid, userId)
        .first<Record<string, unknown>>();
      if (!original) return new Response("1");
      const revTx = ("trrev_" + txId).slice(0, 160);
      const amount = Number(original["amount"] ?? 0) || 0;
      const inserted = await db
        .prepare("INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)")
        .bind(("txn_" + userId + "_" + revTx).slice(0, 220), userId, -amount, revTx, "reversal")
        .run();
      if (inserted.meta?.changes !== 0) {
        await db.prepare("UPDATE users SET points = MAX(0, points - ?) WHERE id = ?").bind(amount, userId).run();
      }
      return new Response("1");
    }

    // Screen-outs with no reward: acknowledge, nothing to credit.
    const points = Math.round(reward);
    if (points <= 0) return new Response("1");

    const user = await db.prepare("SELECT id FROM users WHERE id = ?").bind(userId).first<Record<string, unknown>>();
    if (!user) return new Response("Unknown user", { status: 404 });

    const inserted = await db
      .prepare("INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)")
      .bind(("txn_" + userId + "_" + txid).slice(0, 220), userId, points, txid, "job_reward")
      .run();
    if (inserted.meta?.changes !== 0) {
      await db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(points, userId).run();
      await creditReferrer(db, userId, points, txid);
    }
    return new Response("1");
  } catch (error) {
    console.error("[theoremreach postback]", error);
    return new Response("Database error", { status: 500 });
  }
}
