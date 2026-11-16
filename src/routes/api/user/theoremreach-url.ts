import { createFileRoute } from "@tanstack/react-router";
import { ensureSchema, envString, getDatabase } from "@/lib/d1";
import { getSessionUser, isAnonymous } from "@/lib/session.server";

/** Returns the signed-in user's personal TheoremReach survey wall link. */
export const Route = createFileRoute("/api/user/theoremreach-url")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const db = getDatabase(context);
        const apiKey = envString(context, "THEOREMREACH_API_KEY");
        if (!db || !apiKey) return Response.json({ error: "TheoremReach is not configured yet." }, { status: 503 });
        await ensureSchema(db);
        const current = await getSessionUser(db, request);
        if (!current || isAnonymous(current.user)) {
          return Response.json({ error: "signin_required" }, { status: 401 });
        }
        const url = new URL("https://theoremreach.com/respondent_entry/direct");
        url.searchParams.set("api_key", apiKey);
        url.searchParams.set("user_id", current.user.id);
        url.searchParams.set("transaction_id", "trs_" + crypto.randomUUID().replace(/-/g, ""));
        return Response.json({ url: url.toString() }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
