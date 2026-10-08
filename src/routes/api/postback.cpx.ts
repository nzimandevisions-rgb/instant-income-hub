import { createFileRoute } from "@tanstack/react-router";
import { creditReferrer, ensureSchema, envString, getDatabase } from "@/lib/d1";
import { md5Hex } from "@/lib/cpx.server";

/**
 * CPX Research postback.
 * Postback URL to enter in CPX:
 * https://sydehustle.dpdns.org/api/postback/cpx?status={status}&trans_id={trans_id}&user_id={user_id}&amount_usd={amount_usd}&hash={secure_hash}
 * status 1 = completed, 2 = reversed (fraud / cancelled).
 */
export const Route = createFileRoute("/api/postback/cpx")({
  server: {
    handlers: {
      GET: async ({ request, context }) => handle(request, context),
      POST: async ({ request, context }) => handle(request, context),
    },
  },
});

async function handle(request: Request, context: unknown) {
  const url = new URL(request.url);
  const q = (name: string) => (url.searchParams.get(name) ?? "").trim();

  const secret = envString(context, "CPX_SECURE_HASH");
  if (!secret) return new Response("CPX secure hash is not configured", { status: 503 });

  const status = q("status");
  const transId = q("trans_id");
  const userId = q("user_id");
  const amountUsd = Number(q("amount_usd"));
  const hash = q("hash").toLowerCase();

  if (!transId || !/^[a-z0-9_.@+-]{1,128}$/i.test(userId) || !Number.isFinite(amountUsd)) {
    return new Response("Missing trans_id, user_id or amount_usd", { status: 400 });
  }
  if (hash !== (await md5Hex(transId + "-" + secret))) {
    return new Response("Invalid hash", { status: 401 });
  }

  const db = getDatabase(context);
  if (!db) return new Response("D1 database binding missing", { status: 500 });

  try {
    await ensureSchema(db);
    const points = Math.max(1, Math.round(Math.abs(amountUsd) * 0.7 * 1000));
    const txid = ("cpx_" + transId).slice(0, 160);

    if (status === "2") {
      // Reversal: take back the points only if we credited them before.
      const original = await db
        .prepare("SELECT amount FROM transactions WHERE txid = ? AND user_id = ?")
        .bind(txid, userId)
        .first<Record<string, unknown>>();
      if (!original) return new Response("1");
      const revTx = ("cpxrev_" + transId).slice(0, 160);
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

    if (amountUsd <= 0) return new Response("1");
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
    console.error("[cpx postback]", error);
    return new Response("Database error", { status: 500 });
  }
}
