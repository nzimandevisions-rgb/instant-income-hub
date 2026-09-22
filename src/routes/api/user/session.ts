import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";

const COOKIE = "syde_hustle_session";

function cookieHeader(value: string) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`;
}

function validLegacyId(id: string) {
  return /^sh-[a-z0-9]{5,32}$/i.test(id);
}

export const Route = createFileRoute("/api/user/session")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const db = getDatabase(context);
        if (!db) return Response.json({ error: "Wallet database is unavailable." }, { status: 500 });

        try {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const requestedId = String(body.accountId ?? "").trim();

          await db.prepare(
            "CREATE TABLE IF NOT EXISTS user_sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL)"
          ).run();

          let userId = "";
          if (requestedId && validLegacyId(requestedId)) {
            const existing = await db.prepare("SELECT id FROM users WHERE id = ?").bind(requestedId).first<Record<string, unknown>>();
            if (existing?.id) {
              userId = String(existing.id);
            }
          }

          if (!userId) {
            userId = "sh-" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
            const email = userId + "@user.sydehustle.com";
            await db.prepare("INSERT OR IGNORE INTO users (id, email, points) VALUES (?, ?, 0)").bind(userId, email).run();
          }

          const token = crypto.randomUUID() + crypto.randomUUID();
          await db.prepare(
            "INSERT INTO user_sessions (token, user_id, created_at) VALUES (?, ?, ?)"
          ).bind(token, userId, new Date().toISOString()).run();

          return Response.json(
            { ok: true, accountId: userId },
            { headers: { "Set-Cookie": cookieHeader(token), "Cache-Control": "no-store" } }
          );
        } catch (error) {
          console.error("[session]", error);
          return Response.json({ error: "Unable to create wallet session." }, { status: 500 });
        }
      },
    },
  },
});
