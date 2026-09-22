import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";

const SESSION_COOKIE = "syde_hustle_session";

function getCookie(request: Request, name: string): string {
  const header = request.headers.get("Cookie") || "";
  const item = header.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

export const Route = createFileRoute("/api/user/balance")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const db = getDatabase(context);
        if (!db) return Response.json({ points: 0, cashouts: [] });

        try {
          await db.prepare(
            "CREATE TABLE IF NOT EXISTS user_sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL)"
          ).run();

          const token = getCookie(request, SESSION_COOKIE);
          const session = token
            ? await db.prepare("SELECT user_id FROM user_sessions WHERE token = ?").bind(token).first<Record<string, unknown>>()
            : null;
          const id = String(session?.user_id ?? "").trim();

          if (!id) return Response.json({ points: 0, cashouts: [] }, { status: 401 });

          const row = await db
            .prepare("SELECT id, email, points FROM users WHERE id = ?")
            .bind(id)
            .first<Record<string, unknown>>();

          const points = typeof row?.points === "number" ? row.points : Number(row?.points ?? 0);

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
          }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          console.error("[balance]", error);
          return Response.json({ points: 0, cashouts: [] }, { status: 500 });
        }
      },
    },
  },
});
