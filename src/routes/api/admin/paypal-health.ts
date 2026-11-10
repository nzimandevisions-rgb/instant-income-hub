import { createFileRoute } from "@tanstack/react-router";
import { envString, getEnv } from "@/lib/d1";
import { getAccessToken } from "@/lib/paypal.server";

function authorized(request: Request, context: unknown): boolean {
  const key = envString(context, "ADMIN_API_KEY");
  if (!key || key.length < 24) return false;
  const supplied = request.headers.get("x-admin-key") ?? "";
  if (supplied.length !== key.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}

/** Owner-only: confirms PayPal accepts the configured credentials. Moves no money. */
export const Route = createFileRoute("/api/admin/paypal-health")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        if (!authorized(request, context)) return Response.json({ error: "Unauthorized" }, { status: 401 });
        try {
          await getAccessToken(getEnv(context));
          return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
        } catch (e) {
          return Response.json({ ok: false, error: String((e as Error).message) }, { status: 502, headers: { "Cache-Control": "no-store" } });
        }
      },
    },
  },
});
