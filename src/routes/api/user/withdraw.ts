import { createFileRoute } from "@tanstack/react-router";
import { ensureSchema, getDatabase } from "@/lib/d1";
import { getSessionUser } from "@/lib/session.server";
import { autoPayoutsEnabled, sendCashout } from "@/lib/payouts.server";

const MIN_POINTS = 500;
const OPEN_STATUSES = "('awaiting_approval', 'processing', 'pending')";

export const Route = createFileRoute("/api/user/withdraw")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const db = getDatabase(context);
        if (!db) return Response.json({ error: "Wallet database is unavailable." }, { status: 500 });

        try {
          await ensureSchema(db);

          const session = await getSessionUser(db, request);
          if (!session) return Response.json({ error: "Your wallet session has expired. Refresh and try again." }, { status: 401 });
          if (!session.user.googleSub)
            return Response.json({ error: "Sign in with Google before cashing out." }, { status: 403 });
          const userId = session.user.id;

          const body = (await request.json()) as Record<string, unknown>;
          const destination = String(body.destination ?? "").trim().toLowerCase();
          const method = String(body.method ?? "paypal").trim().toLowerCase();
          const points = Number(body.points ?? 0);

          if (method !== "paypal")
            return Response.json({ error: "PayPal is the only cash-out method currently enabled." }, { status: 400 });
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(destination))
            return Response.json({ error: "Enter a valid PayPal email." }, { status: 400 });
          if (!Number.isInteger(points) || points < MIN_POINTS)
            return Response.json({ error: `Minimum cash-out is ${MIN_POINTS} points.` }, { status: 400 });

          const open = await db
            .prepare(`SELECT COUNT(*) AS n FROM cashouts WHERE user_id = ? AND status IN ${OPEN_STATUSES}`)
            .bind(userId)
            .first<Record<string, unknown>>();
          if (Number(open?.n ?? 0) > 0)
            return Response.json({ error: "You already have a cash-out in progress. Please wait for it to finish." }, { status: 409 });

          const cashoutId = "co_" + crypto.randomUUID();
          const usd = Math.round((points / 1000) * 100) / 100;

          const deducted = await db
            .prepare("UPDATE users SET points = points - ? WHERE id = ? AND points >= ?")
            .bind(points, userId, points)
            .run();
          if (deducted.meta?.changes !== 1) return Response.json({ error: "Insufficient points." }, { status: 400 });

          const auto = autoPayoutsEnabled(context);
          await db
            .prepare(
              "INSERT INTO cashouts (id, user_id, destination, method, points, usd, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(cashoutId, userId, destination, "paypal", points, usd, auto ? "processing" : "awaiting_approval", new Date().toISOString())
            .run();

          if (auto) {
            const sent = await sendCashout(db, context, { id: cashoutId, userId, destination, usd, points });
            if (!sent.ok)
              return Response.json({ error: "PayPal could not accept the payout. Your points were returned.", cashoutId }, { status: 502 });
          }

          const cashoutRows = await db
            .prepare(
              "SELECT id, destination AS email, created_at AS date, usd, status FROM cashouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            )
            .bind(userId)
            .all();
          const updatedUser = await db.prepare("SELECT points FROM users WHERE id = ?").bind(userId).first<Record<string, unknown>>();
          return Response.json({
            ok: true,
            review: !auto,
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
