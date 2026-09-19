import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "@/lib/d1";
export const Route = createFileRoute("/api/user/balance")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const id = new URL(request.url).searchParams.get("user")?.trim();
        const db = getDatabase(context);
        if (!id || !db) return Response.json({ points: 0 });
        try {
          const row = await db
            .prepare("SELECT id, email, points FROM users WHERE id = ? OR email = ?")
            .bind(id, id)
            .first<Record<string, unknown>>();
          const points =
            typeof row?.["points"] === "number" ? row.points : Number(row?.["points"] ?? 0);
          return Response.json({
            ...(row ?? { id, email: id + "@user.sydehustle.com" }),
            points: Number.isFinite(points) ? points : 0,
          });
        } catch (error) {
          console.error("[balance]", error);
          return Response.json({ points: 0 });
        }
      },
    },
  },
});
