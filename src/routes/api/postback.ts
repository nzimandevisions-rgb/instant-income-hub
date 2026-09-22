import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";

export const Route = createFileRoute("/api/postback")({
  server: {
    handlers: {
      GET: async ({ request, context }) => handlePostback(request, context),
      POST: async ({ request, context }) => handlePostback(request, context),
    },
  },
});

function env(context: unknown, name: string) {
  const root = context && typeof context === "object" ? (context as Record<string, unknown>) : {};
  const nested = root["env"] && typeof root["env"] === "object" ? (root["env"] as Record<string, unknown>) : {};
  const value = root[name] ?? nested[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function handlePostback(request: Request, context: unknown) {
  const secret = env(context, "POSTBACK_SHARED_SECRET");
  if (!secret) return new Response("Postback secret is not configured", { status: 503 });

  const url = new URL(request.url);
  const provided = request.headers.get("x-postback-key") ?? url.searchParams.get("key");
  if (!provided || provided !== secret) return new Response("Unauthorized", { status: 401 });

  const body: Record<string, unknown> = {};
  if (request.method === "POST") {
    try {
      const text = await request.text();
      const parsed = request.headers.get("content-type")?.includes("application/json")
        ? JSON.parse(text)
        : Object.fromEntries(new URLSearchParams(text));
      if (parsed && typeof parsed === "object") Object.assign(body, parsed);
    } catch {
      /* query parameters are still supported */
    }
  }

  const value = (names: string[]) =>
    names
      .map((name) => url.searchParams.get(name) ?? body[name])
      .find((item) => item !== null && item !== undefined && String(item).trim() !== "");

  const id = String(value(["subId", "subid", "subid1", "user_id", "playerid", "uid"]) ?? "").trim();
  const reward = Number.parseInt(
    String(value(["reward", "points", "payout_points"]) ?? "0"),
    10,
  );
  const payout = Number(String(value(["payout", "amount_usd"]) ?? "0"));
  const computedReward =
    Number.isFinite(payout) && payout > 0
      ? Math.max(1, Math.round(payout * 0.7 * 1000))
      : reward;
  const txid = String(
    value(["txid", "trans_id", "transId", "transaction_id", "event_id"]) ?? "tx_" + Date.now(),
  ).slice(0, 160);

  if (
    !/^[a-z0-9_.@+-]{1,128}$/.test(id) ||
    !Number.isInteger(computedReward) ||
    computedReward <= 0 ||
    computedReward > 100000000
  )
    return new Response("Missing subId or valid reward amount", { status: 400 });

  const db = getDatabase(context);
  if (!db) return new Response("D1 database binding missing in Cloudflare", { status: 500 });

  try {
    const email = id.includes("@") ? id : id + "@user.sydehustle.com";
    await db.prepare("INSERT OR IGNORE INTO users (id, email, points) VALUES (?, ?, 0)").bind(id, email).run();
    const transactionId = ("txn_" + id + "_" + txid).slice(0, 220);
    const inserted = await db
      .prepare("INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)")
      .bind(transactionId, id, computedReward, txid, "job_reward")
      .run();
    if (inserted.meta?.changes !== 0)
      await db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(computedReward, id).run();
    return new Response("OK");
  } catch (error) {
    console.error("[postback]", error);
    return new Response("Database error", { status: 500 });
  }
}
