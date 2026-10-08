import { createFileRoute } from "@tanstack/react-router";
import { ensureSchema, envString, getDatabase } from "@/lib/d1";
import {
  clearCookie,
  createSession,
  getCookie,
  getSessionUser,
  isAnonymous,
  newAccountId,
  sessionCookie,
  OAUTH_STATE_COOKIE,
  googleRedirectUri,
} from "@/lib/session.server";

function back(nextPage: string, status: "ok" | "error", cookies: string[] = []) {
  const headers = new Headers({ Location: nextPage + "?auth=" + status, "Cache-Control": "no-store" });
  headers.append("Set-Cookie", clearCookie(OAUTH_STATE_COOKIE, "/api/auth"));
  headers.append("Set-Cookie", clearCookie("syde_auth_next", "/api/auth"));
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

/** Google sends the user back here after they choose an account. */
export const Route = createFileRoute("/api/auth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code") ?? "";
        const state = url.searchParams.get("state") ?? "";
        const expectedState = getCookie(request, OAUTH_STATE_COOKIE);
        const nextCookie = decodeURIComponent(getCookie(request, "syde_auth_next"));
        const nextPage = ["/", "/surveys"].includes(nextCookie) ? nextCookie : "/wallet";
        if (!code || !state || !expectedState || state !== expectedState) return back(nextPage, "error");

        const clientId = envString(context, "GOOGLE_CLIENT_ID");
        const clientSecret = envString(context, "GOOGLE_CLIENT_SECRET");
        const db = getDatabase(context);
        if (!clientId || !clientSecret || !db) return back(nextPage, "error");

        try {
          const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: googleRedirectUri(request, context),
              grant_type: "authorization_code",
            }),
          });
          const tokens = (await tokenResponse.json().catch(() => ({}))) as Record<string, unknown>;
          if (!tokenResponse.ok || typeof tokens.access_token !== "string") {
            console.error("[google] token exchange failed", tokens.error, tokens.error_description);
            return back(nextPage, "error");
          }

          const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: { Authorization: "Bearer " + tokens.access_token },
          });
          const profile = (await profileResponse.json().catch(() => ({}))) as Record<string, unknown>;
          const sub = typeof profile.sub === "string" ? profile.sub : "";
          const email = typeof profile.email === "string" ? profile.email.toLowerCase() : "";
          if (!profileResponse.ok || !sub || !email || profile.email_verified !== true) return back(nextPage, "error");

          await ensureSchema(db);

          // 1. Already linked to this Google account.
          let userId = String(
            (
              await db
                .prepare("SELECT id FROM users WHERE google_sub = ?")
                .bind(sub)
                .first<Record<string, unknown>>()
            )?.id ?? "",
          );

          // 2. First Google sign-in: keep the points earned on this browser by
          //    upgrading its anonymous account.
          const current = await getSessionUser(db, request);
          if (!userId) {
            const emailOwner = await db
              .prepare("SELECT id, google_sub FROM users WHERE email = ?")
              .bind(email)
              .first<Record<string, unknown>>();
            if (emailOwner?.id && !emailOwner.google_sub) {
              userId = String(emailOwner.id);
              await db.prepare("UPDATE users SET google_sub = ? WHERE id = ?").bind(sub, userId).run();
            } else if (current && isAnonymous(current.user)) {
              userId = current.user.id;
              await db
                .prepare("UPDATE users SET google_sub = ?, email = ?, updated_at = ? WHERE id = ?")
                .bind(sub, email, new Date().toISOString(), userId)
                .run();
            } else {
              userId = newAccountId();
              await db
                .prepare("INSERT INTO users (id, email, points, google_sub) VALUES (?, ?, 0, ?)")
                .bind(userId, email, sub)
                .run();
            }
          }

          if (current) {
            await db.prepare("DELETE FROM user_sessions WHERE token = ?").bind(current.token).run();
          }
          const token = await createSession(db, userId);
          return back(nextPage, "ok", [sessionCookie(token)]);
        } catch (error) {
          console.error("[google] callback failed", error);
          return back(nextPage, "error");
        }
      },
    },
  },
});
