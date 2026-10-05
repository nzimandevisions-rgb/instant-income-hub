import { createFileRoute } from "@tanstack/react-router";
import { ensureSchema, getDatabase } from "@/lib/d1";

const COOKIE = "syde_hustle_session";
/** Account IDs created by src/lib/account.ts look like sh-ab12cd3. */
const ACCOUNT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{3,62}$/i;

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
          await ensureSchema(db);

          // The browser's account ID is the same subid that offer feeds and
          // provider postbacks use, so binding the session to it keeps rewards
          // and the cash-out balance on ONE account instead of two.
          let requestedId = "";
          try {
            const body = (await request.json()) as Record<string, unknown>;
            const candidate = String(body?.accountId ?? "").trim();
            if (ACCOUNT_ID_PATTERN.test(candidate) && !candidate.includes("@")) requestedId = candidate;
          } catch {
            /* body optional */
          }

          const existingToken = getCookie(request, COOKIE);
          if (existingToken && !requestedId) {
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

          const userId = requestedId || "sh-" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
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
