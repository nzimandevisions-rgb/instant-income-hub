import { createFileRoute } from "@tanstack/react-router";
import { envString } from "@/lib/d1";
import { OAUTH_STATE_COOKIE, googleRedirectUri } from "@/lib/session.server";

/** Starts Google sign-in. */
export const Route = createFileRoute("/api/auth/google")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const clientId = envString(context, "GOOGLE_CLIENT_ID");
        if (!clientId) return new Response("Google sign-in is not configured.", { status: 503 });

        const state = crypto.randomUUID();
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: googleRedirectUri(request, context),
          response_type: "code",
          scope: "openid email profile",
          state,
          prompt: "select_account",
        });
        return new Response(null, {
          status: 302,
          headers: {
            Location: "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString(),
            "Set-Cookie": `${OAUTH_STATE_COOKIE}=${state}; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
