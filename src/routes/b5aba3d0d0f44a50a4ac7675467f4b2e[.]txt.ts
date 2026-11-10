import { createFileRoute } from "@tanstack/react-router";

/** IndexNow ownership key (Bing, Yandex and others). Public by design. */
export const Route = createFileRoute("/b5aba3d0d0f44a50a4ac7675467f4b2e.txt")({
  server: {
    handlers: {
      GET: async () => new Response("b5aba3d0d0f44a50a4ac7675467f4b2e", { headers: { "Content-Type": "text/plain; charset=utf-8" } }),
    },
  },
});
