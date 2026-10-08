import { createFileRoute } from "@tanstack/react-router";
import { ensureSchema, getDatabase, getEnv, type D1DatabaseLike } from "@/lib/d1";
import { getPayPalPayout } from "@/lib/paypal.server";

const SESSION_COOKIE = "syde_hustle_session";

function getCookie(request: Request, name: string): string {
  const header = request.headers.get("Cookie") || "";
  const item = header.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

type CashoutRow = Record<string, unknown>;

/** Best-effort sync of pending PayPal payouts so the wallet shows real status. */
async function syncPendingCashouts(db: D1DatabaseLike, context: unknown, userId: string) {
  const rows = await db
    .prepare(
      "SELECT id, paypal_batch_id, points FROM cashouts WHERE user_id = ? AND status IN ('pending', 'processing') AND paypal_batch_id IS NOT NULL ORDER BY created_at ASC LIMIT 3",
    )
    .bind(userId)
    .all<CashoutRow>();

  for (const row of rows.results ?? []) {
    const batchId = String(row.paypal_batch_id ?? "");
    if (!batchId) continue;
    try {
      const batch = (await getPayPalPayout(getEnv(context), batchId)) as Record<string, unknown>;
      const header = (batch?.batch_header ?? {}) as Record<string, unknown>;
      const batchStatus = String(header.batch_status ?? "");
      if (batchStatus === "SUCCESS") {
        await db
          .prepare("UPDATE cashouts SET status = 'completed', paypal_status = ? WHERE id = ?")
          .bind(batchStatus, String(row.id))
          .run();
      } else if (batchStatus === "DENIED" || batchStatus === "CANCELED") {
        const updated = await db
          .prepare("UPDATE cashouts SET status = 'failed', paypal_status = ? WHERE id = ? AND status IN ('pending', 'processing')")
          .bind(batchStatus, String(row.id))
          .run();
        if (updated.meta?.changes === 1) {
          await db
            .prepare("UPDATE users SET points = points + ? WHERE id = ?")
            .bind(Number(row.points ?? 0), userId)
            .run();
        }
      } else if (batchStatus) {
        await db
          .prepare("UPDATE cashouts SET paypal_status = ? WHERE id = ?")
          .bind(batchStatus, String(row.id))
          .run();
      }
    } catch (error) {
      console.error("[balance] payout status sync failed", error);
    }
  }
}

export const Route = createFileRoute("/api/user/balance")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const db = getDatabase(context);
        if (!db) return Response.json({ points: 0, cashouts: [] });

        try {
          await ensureSchema(db);

          const token = getCookie(request, SESSION_COOKIE);
          const session = token
            ? await db.prepare("SELECT user_id FROM user_sessions WHERE token = ?").bind(token).first<Record<string, unknown>>()
            : null;
          const id = String(session?.user_id ?? "").trim();

          if (!id) return Response.json({ points: 0, cashouts: [] }, { status: 401 });

          await syncPendingCashouts(db, context, id);

          const row = await db
            .prepare("SELECT id, email, points FROM users WHERE id = ?")
            .bind(id)
            .first<Record<string, unknown>>();

          const points = typeof row?.points === "number" ? row.points : Number(row?.points ?? 0);

          const cashoutRows = await db
            .prepare(
              "SELECT id, destination AS email, created_at AS date, usd, status FROM cashouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
            )
            .bind(id)
            .all<Record<string, unknown>>();

          const referrals = await db
            .prepare("SELECT COUNT(*) AS n FROM users WHERE referred_by = ?")
            .bind(id)
            .first<Record<string, unknown>>();
          const referralEarnings = await db
            .prepare("SELECT COALESCE(SUM(amount), 0) AS pts FROM transactions WHERE user_id = ? AND type = 'referral_bonus'")
            .bind(id)
            .first<Record<string, unknown>>();

          return Response.json({
            id,
            referralCount: Number(referrals?.n ?? 0) || 0,
            referralPoints: Number(referralEarnings?.pts ?? 0) || 0,
            email: String(row?.email ?? id + "@user.sydehustle.com"),
            points: Number.isFinite(points) ? points : 0,
            cashouts: cashoutRows.results ?? [],
          }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          console.error("[balance]", error);
          return Response.json({ points: 0, cashouts: [] }, { status: 500 });
        }
      },
    },
  },
});
