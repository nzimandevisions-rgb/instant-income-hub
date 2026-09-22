import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";

export const Route = createFileRoute("/api/postback/cpalead")({
  server: {
    handlers: {
      GET: async ({ request, context }) => handle(request, context),
      POST: async ({ request, context }) => handle(request, context),
    },
  },
});

function env(context: unknown, name: string) {
  const root = context && typeof context === "object" ? (context as Record<string, unknown>) : {};
  const nested = root["env"] && typeof root["env"] === "object" ? (root["env"] as Record<string, unknown>) : {};
  const value = root[name] ?? nested[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

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

  const password = env(context, "CPALEAD_POSTBACK_PASSWORD");
  if (!password) return new Response("Postback password is not configured", { status: 503 });
  if (String(value(["password"]) ?? "") !== password) return new Response("Unauthorized", { status: 401 });

  const userId = String(value(["subid", "subId", "user_id"]) ?? "").trim();
  const leadId = String(value(["lead_id", "transaction_id", "trans_id"]) ?? "").trim();
  const payout = Number(value(["payout", "event_payout", "amount"]) ?? 0);

  if (!/^[a-z0-9_.@+-]{1,128}$/i.test(userId) || !leadId || !Number.isFinite(payout) || payout <= 0)
    return new Response("Missing subid, lead_id, or valid payout", { status: 400 });

  const points = Math.max(1, Math.round(payout * 0.7 * 1000));
  const db = getDatabase(context);
  if (!db) return new Response("D1 database binding missing in Cloudflare", { status: 500 });

  try {
    const email = userId.includes("@") ? userId : userId + "@user.sydehustle.com";
    await db.prepare("INSERT OR IGNORE INTO users (id, email, points) VALUES (?, ?, 0)").bind(userId, email).run();

    const txid = ("cpalead_" + leadId).slice(0, 160);
    const transactionId = ("txn_" + userId + "_" + txid).slice(0, 220);
    const inserted = await db
      .prepare("INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)")
      .bind(transactionId, userId, points, txid, "job_reward")
      .run();

    if (inserted.meta?.changes !== 0)
      await db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(points, userId).run();

    return new Response("OK");
  } catch (error) {
    console.error("[cpalead postback]", error);
    return new Response("Database error", { status: 500 });
  }
}
