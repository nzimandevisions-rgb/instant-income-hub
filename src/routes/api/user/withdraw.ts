import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";
import { createPayPalPayout } from "@/lib/paypal.server";

const MIN_POINTS = 500;
const SESSION_COOKIE = "syde_hustle_session";

function getEnv(context: unknown): Record<string, unknown> {
  const value = context && typeof context === "object" ? (context as Record<string, unknown>) : {};
  return value.env && typeof value.env === "object" ? (value.env as Record<string, unknown>) : {};
}

function getCookie(request: Request, name: string): string {
  const header = request.headers.get("Cookie") || "";
  const item = header.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

async function addColumn(db: any, sql: string) {
  try { await db.prepare(sql).run(); } catch (_) {}
}

export const Route = createFileRoute("/api/user/withdraw")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const db = getDatabase(context);
        if (!db) return Response.json({ error: "Wallet database is unavailable." }, { status: 500 });

        try {
          const token = getCookie(request, SESSION_COOKIE);
          if (!token) return Response.json({ error: "Your wallet session has expired. Refresh the wallet and try again." }, { status: 401 });

          await db.prepare(
            "CREATE TABLE IF NOT EXISTS user_sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL)"
          ).run();

          const session = await db.prepare(
            "SELECT user_id FROM user_sessions WHERE token = ?"
          ).bind(token).first<Record<string, unknown>>();

          const userId = String(session?.user_id ?? "").trim();
          if (!userId) return Response.json({ error: "Invalid wallet session." }, { status: 401 });

          const body = (await request.json()) as Record<string, unknown>;
          const destination = String(body.destination ?? "").trim().toLowerCase();
          const method = String(body.method ?? "paypal").trim().toLowerCase();
          const points = Number(body.points ?? 0);

          if (method !== "paypal")
            return Response.json({ error: "PayPal is the only automatic cash-out method currently enabled." }, { status: 400 });
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(destination))
            return Response.json({ error: "Enter a valid PayPal email." }, { status: 400 });
          if (!Number.isInteger(points) || points < MIN_POINTS)
            return Response.json({ error: `Minimum cash-out is ${MIN_POINTS} points.` }, { status: 400 });

          await db.prepare(
            "CREATE TABLE IF NOT EXISTS cashouts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, destination TEXT NOT NULL, method TEXT NOT NULL, points INTEGER NOT NULL, usd REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)"
          ).run();
          await addColumn(db, "ALTER TABLE cashouts ADD COLUMN paypal_batch_id TEXT");
          await addColumn(db, "ALTER TABLE cashouts ADD COLUMN paypal_item_id TEXT");
          await addColumn(db, "ALTER TABLE cashouts ADD COLUMN paypal_status TEXT");
          await addColumn(db, "ALTER TABLE cashouts ADD COLUMN error_message TEXT");

          const user = await db.prepare("SELECT points FROM users WHERE id = ?").bind(userId).first<Record<string, unknown>>();
          const balance = Number(user?.points ?? 0);
          if (!Number.isFinite(balance) || balance < points)
            return Response.json({ error: "Insufficient points." }, { status: 400 });

          const cashoutId = "co_" + crypto.randomUUID();
          const usd = Math.round((points / 1000) * 100) / 100;
          if (usd <= 0) return Response.json({ error: "Cash-out amount is too small." }, { status: 400 });

          const deducted = await db.prepare(
            "UPDATE users SET points = points - ? WHERE id = ? AND points >= ?"
          ).bind(points, userId, points).run();

          if (deducted.meta?.changes !== 1)
            return Response.json({ error: "Balance changed before the request could be reserved. Please try again." }, { status: 409 });

          await db.prepare(
            "INSERT INTO cashouts (id, user_id, destination, method, points, usd, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(cashoutId, userId, destination, "paypal", points, usd, "processing", new Date().toISOString()).run();

          try {
            const payout = await createPayPalPayout(getEnv(context), cashoutId, destination, usd);
            await db.prepare(
              "UPDATE cashouts SET status = ?, paypal_batch_id = ?, paypal_item_id = ?, paypal_status = ? WHERE id = ?"
            ).bind("pending", payout.batchId, payout.itemId, payout.batchStatus, cashoutId).run();
          } catch (error) {
            const message = error instanceof Error ? error.message.slice(0, 500) : "PayPal payout failed.";
            await db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(points, userId).run();
            await db.prepare(
              "UPDATE cashouts SET status = ?, error_message = ? WHERE id = ?"
            ).bind("failed", message, cashoutId).run();
            return Response.json({ error: "PayPal could not accept the payout. Your points were returned.", cashoutId }, { status: 502 });
          }

          const cashoutRows = await db.prepare(
            "SELECT id, destination AS email, created_at AS date, usd, status FROM cashouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
          ).bind(userId).all();

          const updatedUser = await db.prepare("SELECT points FROM users WHERE id = ?").bind(userId).first<Record<string, unknown>>();
          return Response.json({
            ok: true,
            balance: Number(updatedUser?.points ?? 0),
            cashouts: cashoutRows.results ?? [],
            cashoutId,
          });
        } catch (error) {
          console.error("[withdraw]", error);
          return Response.json({ error: "Unable to submit the cash-out request." }, { status: 500 });
        }
      },
    },
  },
});
