import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";
import { SESSION_COOKIE, clearCookie, getCookie } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const db = getDatabase(context);
        const token = getCookie(request, SESSION_COOKIE);
        if (db && token) await db.prepare("DELETE FROM user_sessions WHERE token = ?").bind(token).run();
        return Response.json({ ok: true }, { headers: { "Set-Cookie": clearCookie(SESSION_COOKIE) } });
      },
    },
  },
});
