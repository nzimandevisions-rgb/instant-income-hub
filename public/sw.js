// Syde Hustle service worker: makes the site installable.
// Always uses the network so points and offers are never stale.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="background:#020617;color:#e2e8f0;font-family:sans-serif;text-align:center;padding:40px"><h2>You are offline</h2><p>Connect to the internet to keep earning on Syde Hustle.</p></body>',
          { headers: { "Content-Type": "text/html" } },
        ),
    ),
  );
});
