import { createFileRoute } from "@tanstack/react-router";
import { ensureSchema, getDatabase } from "@/lib/d1";
import { createSession, getSessionUser, newAccountId, sessionCookie } from "@/lib/session.server";

/**
 * Returns the account behind the session cookie. When there is no valid
 * session, a brand-new anonymous account is created. The server never trusts
 * an account ID sent by the browser: that is what allowed account takeover.
 */
export const Route = createFileRoute("/api/user/session")({
  server: {
    handlers: {
      POST: async ({ request, context }) => {
        const db = getDatabase(context);
        if (!db) return Response.json({ error: "Wallet database is unavailable." }, { status: 500 });

        try {
          await ensureSchema(db);

          const current = await getSessionUser(db, request);
          if (current) {
            return Response.json(
              {
                ok: true,
                accountId: current.user.id,
                signedIn: Boolean(current.user.googleSub),
                email: current.user.googleSub ? current.user.email : null,
              },
              { headers: { "Cache-Control": "no-store" } },
            );
          }

          const userId = newAccountId();
          await db
            .prepare("INSERT INTO users (id, email, points) VALUES (?, ?, 0)")
            .bind(userId, userId + "@user.sydehustle.com")
            .run();
          const token = await createSession(db, userId);

          return Response.json(
            { ok: true, accountId: userId, signedIn: false, email: null },
            { headers: { "Set-Cookie": sessionCookie(token), "Cache-Control": "no-store" } },
          );
        } catch (error) {
          console.error("[session]", error);
          return Response.json({ error: "Unable to create wallet session." }, { status: 500 });
        }
      },
    },
  },
});
