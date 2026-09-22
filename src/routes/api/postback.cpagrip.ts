import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";

export const Route = createFileRoute("/api/postback/cpagrip")({
  server: {
    handlers: {
      GET: async ({ request, context }) => handle(request, context),
      POST: async ({ request, context }) => handle(request, context),
    },
  },
});

async function handle(request: Request, context: unknown) {
  const url = new URL(request.url);
  const body: Record<string, unknown> = {};

  if (request.method === "POST") {
    try {
      const raw = await request.text();
      const parsed = request.headers.get("content-type")?.includes("application/json")
        ? JSON.parse(raw)
        : Object.fromEntries(new URLSearchParams(raw));
      if (parsed && typeof parsed === "object") Object.assign(body, parsed);
    } catch {
      /* query parameters remain available */
    }
  }

  const value = (names: string[]) =>
    names
      .map((name) => url.searchParams.get(name) ?? body[name])
      .find((item) => item !== null && item !== undefined && String(item).trim() !== "");

  const userId = String(value(["tracking_id", "subid", "subId", "user_id"]) ?? "").trim();
  const offerId = String(value(["offer_id", "offerId"]) ?? "").trim();
  const payout = Number(value(["payout", "amount"]) ?? 0);

  if (
    !/^[a-z0-9_.@+-]{1,128}$/i.test(userId) ||
    !offerId ||
    !Number.isFinite(payout) ||
    payout <= 0
  ) {
    return new Response("Missing tracking_id, offer_id, or valid payout", { status: 400 });
  }

  const points = Math.max(1, Math.round(payout * 0.7 * 1000));
  const db = getDatabase(context);
  if (!db) return new Response("D1 database binding missing in Cloudflare", { status: 500 });

  try {
    const email = userId.includes("@") ? userId : userId + "@user.sydehustle.com";
    await db.prepare("INSERT OR IGNORE INTO users (id, email, points) VALUES (?, ?, 0)").bind(userId, email).run();

    // CPAGrip does not provide a lead_id in its documented global postback.
    // Use the supplied offer/tracking identifiers plus payout as a deterministic
    // conversion key; if CPAGrip later supplies a transaction identifier, prefer it.
    const externalTx = String(
      value(["transaction_id", "trans_id", "txid", "event_id"]) ?? ""
    ).trim();
    const txid = externalTx
      ? ("cpagrip_" + externalTx).slice(0, 160)
      : ("cpagrip_" + userId + "_" + offerId + "_" + payout.toFixed(4)).slice(0, 160);

    const transactionId = ("txn_" + userId + "_" + txid).slice(0, 220);
    const inserted = await db
      .prepare("INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)")
      .bind(transactionId, userId, points, txid, "job_reward")
      .run();

    if (inserted.meta?.changes !== 0) {
      await db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(points, userId).run();
    }

    return new Response("OK");
  } catch (error) {
    console.error("[cpagrip postback]", error);
    return new Response("Database error", { status: 500 });
  }
}
