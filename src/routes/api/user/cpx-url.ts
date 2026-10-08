import { createFileRoute } from "@tanstack/react-router";
import { ensureSchema, envString, getDatabase } from "@/lib/d1";
import { getSessionUser, isAnonymous } from "@/lib/session.server";
import { CPX_APP_ID, md5Hex } from "@/lib/cpx.server";

/** Returns the signed-in user's personal CPX Research survey wall link. */
export const Route = createFileRoute("/api/user/cpx-url")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const db = getDatabase(context);
        const secret = envString(context, "CPX_SECURE_HASH");
        if (!db || !secret) return Response.json({ error: "Surveys are not configured yet." }, { status: 503 });
        await ensureSchema(db);
        const current = await getSessionUser(db, request);
        if (!current || isAnonymous(current.user)) {
          return Response.json({ error: "signin_required" }, { status: 401 });
        }
        const userId = current.user.id;
        const url = new URL("https://offers.cpx-research.com/index.php");
        url.searchParams.set("app_id", envString(context, "CPX_APP_ID") ?? CPX_APP_ID);
        url.searchParams.set("ext_user_id", userId);
        url.searchParams.set("secure_hash", await md5Hex(userId + "-" + secret));
        url.searchParams.set("username", current.user.email.split("@")[0] ?? userId);
        url.searchParams.set("email", current.user.email);
        url.searchParams.set("subid_1", "");
        url.searchParams.set("subid_2", "");
        return Response.json({ url: url.toString() }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
