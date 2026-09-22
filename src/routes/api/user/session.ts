import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";

const COOKIE = "syde_hustle_session";

function getCookie(request: Request, name: string): string {
  const header = request.headers.get("Cookie") || "";
  const item = header.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

export const Route = createFileRoute("/api/user/session")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const db = getDatabase(context);
        if (!db) return Response.json({ error: "Wallet database is unavailable." }, { status: 500 });

        try {
          await db.prepare(
            "CREATE TABLE IF NOT EXISTS user_sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL)"
          ).run();

          const existingToken = getCookie(request, COOKIE);
          if (existingToken) {
            const existing = await db.prepare(
              "SELECT user_id FROM user_sessions WHERE token = ?"
            ).bind(existingToken).first<Record<string, unknown>>();
            if (existing?.user_id) {
              return Response.json(
                { ok: true, accountId: String(existing.user_id) },
                { headers: { "Cache-Control": "no-store" } }
              );
            }
          }

          const userId = "sh-" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
          const email = userId + "@user.sydehustle.com";
          await db.prepare(
            "INSERT OR IGNORE INTO users (id, email, points) VALUES (?, ?, 0)"
          ).bind(userId, email).run();

          const token = crypto.randomUUID() + crypto.randomUUID();
          await db.prepare(
            "INSERT INTO user_sessions (token, user_id, created_at) VALUES (?, ?, ?)"
          ).bind(token, userId, new Date().toISOString()).run();

          return Response.json(
            { ok: true, accountId: userId },
            {
              headers: {
                "Set-Cookie": COOKIE + "=" + token + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000",
                "Cache-Control": "no-store",
              },
            }
          );
        } catch (error) {
          console.error("[session]", error);
          return Response.json({ error: "Unable to create wallet session." }, { status: 500 });
        }
      },
    },
  },
});
