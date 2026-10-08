import { createFileRoute } from "@tanstack/react-router";
import { ensureSchema, envString, getDatabase } from "@/lib/d1";
import { sendCashout } from "@/lib/payouts.server";

function authorized(request: Request, context: unknown): boolean {
  const key = envString(context, "ADMIN_API_KEY");
  if (!key || key.length < 24) return false;
  const supplied = request.headers.get("x-admin-key") ?? "";
  if (supplied.length !== key.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}

/** Owner-only: review and approve or reject cash-outs. Requires the x-admin-key header. */
export const Route = createFileRoute("/api/admin/cashouts")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        if (!authorized(request, context)) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const db = getDatabase(context);
        if (!db) return Response.json({ error: "Database unavailable" }, { status: 500 });
        await ensureSchema(db);
        const rows = await db
          .prepare(
            `SELECT c.id, c.user_id, u.email AS account_email, c.destination, c.points, c.usd, c.status, c.created_at, c.error_message,
               (SELECT COUNT(*) FROM transactions t WHERE t.user_id = c.user_id) AS completions,
               (SELECT COALESCE(SUM(amount), 0) FROM transactions t WHERE t.user_id = c.user_id) AS earned_points
             FROM cashouts c LEFT JOIN users u ON u.id = c.user_id
             ORDER BY CASE WHEN c.status = 'awaiting_approval' THEN 0 ELSE 1 END, c.created_at DESC LIMIT 100`,
          )
          .bind()
          .all();
        return Response.json({ cashouts: rows.results ?? [] }, { headers: { "Cache-Control": "no-store" } });
      },
      POST: async ({ request, context }) => {
        if (!authorized(request, context)) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const db = getDatabase(context);
        if (!db) return Response.json({ error: "Database unavailable" }, { status: 500 });
        await ensureSchema(db);

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const id = String(body.id ?? "");
        const action = String(body.action ?? "");
        if (!id || (action !== "approve" && action !== "reject"))
          return Response.json({ error: "Send { id, action: 'approve' | 'reject' }" }, { status: 400 });

        const row = await db
          .prepare("SELECT id, user_id, destination, usd, points FROM cashouts WHERE id = ? AND status = 'awaiting_approval'")
          .bind(id)
          .first<Record<string, unknown>>();
        if (!row) return Response.json({ error: "Cash-out not found or already reviewed." }, { status: 404 });

        const now = new Date().toISOString();
        const nextStatus = action === "approve" ? "processing" : "rejected";
        const claimed = await db
          .prepare("UPDATE cashouts SET status = ?, reviewed_at = ? WHERE id = ? AND status = 'awaiting_approval'")
          .bind(nextStatus, now, id)
          .run();
        if (claimed.meta?.changes !== 1) return Response.json({ error: "Already reviewed." }, { status: 409 });

        if (action === "reject") {
          await db.prepare("UPDATE users SET points = points + ? WHERE id = ?").bind(Number(row.points), String(row.user_id)).run();
          return Response.json({ ok: true, status: "rejected" });
        }

        const sent = await sendCashout(db, context, {
          id,
          userId: String(row.user_id),
          destination: String(row.destination),
          usd: Number(row.usd),
          points: Number(row.points),
        });
        return sent.ok
          ? Response.json({ ok: true, status: "pending" })
          : Response.json({ ok: false, status: "failed", error: sent.error }, { status: 502 });
      },
    },
  },
});
