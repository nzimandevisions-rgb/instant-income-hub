import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";

const MIN_POINTS = 500;

export const Route = createFileRoute("/api/user/withdraw")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const db = getDatabase(context);
        if (!db) return Response.json({ error: "Wallet database is unavailable." }, { status: 500 });

        try {
          const body = (await request.json()) as Record<string, unknown>;
          const userId = String(body.userId ?? "").trim();
          const destination = String(body.destination ?? "").trim();
          const method = String(body.method ?? "paypal").trim().toLowerCase();
          const points = Number(body.points ?? 0);

          if (!/^[a-z0-9_.@+-]{1,128}$/i.test(userId))
            return Response.json({ error: "Invalid account ID." }, { status: 400 });
          if (!["paypal", "airtime", "data"].includes(method))
            return Response.json({ error: "Unsupported payout method." }, { status: 400 });
          if (method === "paypal" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(destination))
            return Response.json({ error: "Enter a valid PayPal email." }, { status: 400 });
          if (method !== "paypal" && !/^\+?[0-9\s-]{9,20}$/.test(destination))
            return Response.json({ error: "Enter a valid mobile number." }, { status: 400 });
          if (!Number.isInteger(points) || points < MIN_POINTS)
            return Response.json({ error: `Minimum cash-out is ${MIN_POINTS} points.` }, { status: 400 });

          await db.prepare(
            "CREATE TABLE IF NOT EXISTS cashouts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, destination TEXT NOT NULL, method TEXT NOT NULL, points INTEGER NOT NULL, usd REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)"
          ).run();

          const user = await db.prepare("SELECT points FROM users WHERE id = ?").bind(userId).first<Record<string, unknown>>();
          const balance = Number(user?.points ?? 0);
          if (!Number.isFinite(balance) || balance < points)
            return Response.json({ error: "Insufficient points." }, { status: 400 });

          const cashoutId = "co_" + crypto.randomUUID();
          const usd = points / 1000;

          await db.prepare(
            "INSERT INTO cashouts (id, user_id, destination, method, points, usd, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(cashoutId, userId, destination, method, points, usd, "pending", new Date().toISOString()).run();

          const deducted = await db
            .prepare("UPDATE users SET points = points - ? WHERE id = ? AND points >= ?")
            .bind(points, userId, points)
            .run();

          if (deducted.meta?.changes !== 1) {
            await db.prepare("UPDATE cashouts SET status = ? WHERE id = ?").bind("failed", cashoutId).run();
            return Response.json({ error: "Balance changed before the request could be reserved. Please try again." }, { status: 409 });
          }

          const rows = await db
            .prepare("SELECT id, destination AS email, created_at AS date, usd, status FROM cashouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50")
            .bind(userId)
            .first<Record<string, unknown>>();
          void rows;

          const updatedUser = await db.prepare("SELECT points FROM users WHERE id = ?").bind(userId).first<Record<string, unknown>>();
          const newBalance = Number(updatedUser?.points ?? 0);
          return Response.json({ ok: true, balance: Number.isFinite(newBalance) ? newBalance : 0, cashoutId });
        } catch (error) {
          console.error("[withdraw]", error);
          return Response.json({ error: "Unable to submit the cash-out request." }, { status: 500 });
        }
      },
    },
  },
});
