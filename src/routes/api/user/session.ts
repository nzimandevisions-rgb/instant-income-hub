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

          // Referral: a new account opened from someone's invite link is
          // linked to them. Only an existing account can be a referrer.
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const ref = String(body.ref ?? "").trim();
          let referredBy: string | null = null;
          if (/^sh-[a-z0-9]{6,32}$/i.test(ref)) {
            const referrer = await db.prepare("SELECT id FROM users WHERE id = ?").bind(ref).first<Record<string, unknown>>();
            if (referrer?.id) referredBy = String(referrer.id);
          }

          await db
            .prepare("INSERT INTO users (id, email, points, referred_by) VALUES (?, ?, 0, ?)")
            .bind(userId, userId + "@user.sydehustle.com", referredBy)
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
