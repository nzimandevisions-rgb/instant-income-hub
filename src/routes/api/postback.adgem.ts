import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";

export const Route = createFileRoute("/api/postback/adgem")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const secret = getSecret(context, "ADGEM_POSTBACK_KEY");
        if (!secret) return new Response("AdGem postback secret is not configured", { status: 503 });

        const raw = await request.text();
        const signature = request.headers.get("Signature") ?? "";
        const expected = await hmacSha256(secret, raw);
        if (!timingSafeEqual(expected, signature)) return new Response("Invalid signature", { status: 401 });

        let payload: any;
        try { payload = JSON.parse(raw); } catch { return new Response("Invalid JSON", { status: 400 }); }
        const data = payload?.data ?? {};
        const id = String(data.player_id ?? data.playerId ?? "").trim().toLowerCase();
        const txid = String(data.conversion_id ?? data.request_id ?? data.transaction_id ?? "tx_" + Date.now()).slice(0, 160);
        const payout = Number(data.payout ?? data.amount ?? 0);
        if (!/^[a-z0-9_-]{1,255}$/.test(id) || !Number.isFinite(payout) || payout <= 0) {
          return new Response("Invalid player or payout", { status: 400 });
        }

        const reward = Math.max(1, Math.round(payout * 0.7 * 1000));
        const db = getDatabase(context);
        if (!db) return new Response("D1 database binding missing", { status: 500 });

        try {
          const email = id + "@user.sydehustle.com";
          await db.prepare("INSERT OR IGNORE INTO users (id, email, points) VALUES (?, ?, 0)").bind(id, email).run();
          const transactionId = ("txn_" + id + "_" + txid).slice(0, 220);
          const inserted = await db.prepare(
            "INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)"
          ).bind(transactionId, id, reward, txid, "job_reward").run();
          if (inserted.meta?.changes !== 0)
            await db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(reward, id).run();
          return new Response("OK", { status: 200 });
        } catch (error) {
          console.error("[adgem postback]", error);
          return new Response("Database error", { status: 500 });
        }
      },
    },
  },
});

function getSecret(context: unknown, name: string) {
  const root = context && typeof context === "object" ? (context as Record<string, unknown>) : {};
  const nested = root["env"] && typeof root["env"] === "object" ? (root["env"] as Record<string, unknown>) : {};
  const value = root[name] ?? nested[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function hmacSha256(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
