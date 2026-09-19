import type { ReactNode } from "react";
import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import appCss from "../styles.css?url";
import { getOrCreateAccountId } from "@/lib/account";
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Syde Hustle - Live Tasks & PayPal Cashouts" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootComponent,
});
function RootComponent() {
  const [points, setPoints] = useState(0);
  useEffect(() => {
    const id = getOrCreateAccountId();
    const load = async () => {
      try {
        const response = await fetch("/api/user/balance?user=" + encodeURIComponent(id));
        if (response.ok) {
          const data = await response.json();
          setPoints(typeof data.points === "number" ? data.points : 0);
        }
      } catch {
        /* wallet retries */
      }
    };
    load();
    window.addEventListener("focus", load);
    const timer = window.setInterval(load, 10000);
    return () => {
      window.removeEventListener("focus", load);
      window.clearInterval(timer);
    };
  }, []);
  return (
    <RootDocument>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
        <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg shadow-black/20">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 font-bold text-emerald-400">
              $
            </div>
            <span className="font-extrabold text-lg text-white">Syde Hustle</span>
          </Link>
          <Link
            to="/wallet"
            className="rounded-xl border border-slate-800 px-3.5 py-1.5 font-mono text-sm font-bold text-emerald-400"
          >
            {points.toLocaleString()} PTS{" "}
            <span className="text-xs text-slate-400">($ + {(points / 1000).toFixed(2)})</span>
          </Link>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <footer className="border-t border-slate-800/60 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <p>© 2026 Syde Hustle. Instant PayPal Payouts &amp; Verified Tasks.</p>
        </footer>
      </div>
    </RootDocument>
  );
}
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
