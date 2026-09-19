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
async function handlePostback(request: Request, context: unknown) {
  const url = new URL(request.url);
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
    String(value(["reward", "points", "amount", "payout_points"]) ?? "0"),
    10,
  );
  const txid = String(
    value(["txid", "trans_id", "transId", "transaction_id"]) ?? "tx_" + Date.now(),
  ).slice(0, 160);
  if (
    !/^[A-Za-z0-9_.@+-]{1,128}$/.test(id) ||
    !Number.isInteger(reward) ||
    reward <= 0 ||
    reward > 100000000
  )
    return new Response("Missing subId or valid reward amount", { status: 400 });
  const db = getDatabase(context);
  if (!db) return new Response("D1 database binding missing in Cloudflare", { status: 500 });
  try {
    const email = id.includes("@") ? id : id + "@user.sydehustle.com";
    await db
      .prepare("INSERT OR IGNORE INTO users (id, email, points) VALUES (?, ?, 0)")
      .bind(id, email)
      .run();
    const transactionId = ("txn_" + id + "_" + txid).slice(0, 220);
    const inserted = await db
      .prepare(
        "INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(transactionId, id, reward, txid, "job_reward")
      .run();
    if (inserted.meta?.changes !== 0)
      await db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(reward, id).run();
    return new Response("OK");
  } catch (error) {
    console.error("[postback]", error);
    return new Response("Database error", { status: 500 });
  }
}
