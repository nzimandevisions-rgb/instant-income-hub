import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/feed/$kind")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const kind = params.kind === "survey" ? "survey" : params.kind === "offer" ? "offer" : null;
        if (!kind) return Response.json({ error: "Unknown feed" }, { status: 404 });

        const subidRaw = new URL(request.url).searchParams.get("subid");
        const subid = subidRaw && /^[\w-]{1,64}$/.test(subidRaw) ? subidRaw : null;

        const { loadFeed } = await import("@/lib/feeds/networks.server");
        try {
          const { tasks, errors } = await loadFeed(kind, subid);
          if (errors.length) console.error("[feed]", kind, errors.join(" | "));
          return Response.json(
            { tasks },
            { headers: { "cache-control": "private, max-age=60" } },
          );
        } catch (err) {
          console.error("[feed] failed", err);
          return Response.json({ tasks: [] }, { status: 200 });
        }
      },
    },
  },
});
