import "./lib/error-capture";
type ServerEntry = {
  fetch: (request: Request, options?: { context?: unknown }) => Promise<Response> | Response;
};
let serverEntryPromise: Promise<ServerEntry> | undefined;
async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise)
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  return serverEntryPromise;
}
async function normalize(response: Response) {
  if (
    response.status < 500 ||
    !(response.headers.get("content-type") ?? "").includes("application/json")
  )
    return response;
  try {
    const payload = JSON.parse(await response.clone().text()) as {
      unhandled?: unknown;
      message?: unknown;
    };
    if (payload.unhandled !== true || payload.message !== "HTTPError") return response;
  } catch {
    return response;
  }
  return new Response("Internal Server Error", { status: 500 });
}
export default {
  async fetch(request: Request, env: unknown, _ctx: unknown) {
    try {
      const response = await (await getServerEntry()).fetch(request, { context: env });
      return normalize(response);
    } catch (error) {
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
