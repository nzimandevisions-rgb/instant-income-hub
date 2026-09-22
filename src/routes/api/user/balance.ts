import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";

export const Route = createFileRoute("/api/user/balance")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const id = new URL(request.url).searchParams.get("user")?.trim();
        const db = getDatabase(context);
        if (!id || !db) return Response.json({ points: 0, cashouts: [] });

        try {
          const row = await db
            .prepare("SELECT id, email, points FROM users WHERE id = ? OR email = ?")
            .bind(id, id)
            .first<Record<string, unknown>>();

          const points =
            typeof row?.["points"] === "number" ? row.points : Number(row?.["points"] ?? 0);

          await db.prepare(
            "CREATE TABLE IF NOT EXISTS cashouts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, destination TEXT NOT NULL, method TEXT NOT NULL, points INTEGER NOT NULL, usd REAL NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)"
          ).run();

          const cashoutRows = await db
            .prepare(
              "SELECT id, destination AS email, created_at AS date, usd, status FROM cashouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
            )
            .bind(id)
            .all<Record<string, unknown>>();

          return Response.json({
            ...(row ?? { id, email: id + "@user.sydehustle.com" }),
            points: Number.isFinite(points) ? points : 0,
            cashouts: cashoutRows.results ?? [],
          });
        } catch (error) {
          console.error("[balance]", error);
          return Response.json({ points: 0, cashouts: [] });
        }
      },
    },
  },
});
