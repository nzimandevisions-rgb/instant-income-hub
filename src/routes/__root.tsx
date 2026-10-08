import type { ReactNode } from "react";
import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import appCss from "../styles.css?url";
import { ensureSession } from "@/lib/account";
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Syde Hustle - Live Tasks & PayPal Cashouts" },
      { name: "description", content: "Syde Hustle: complete simple online tasks and offers, earn points, and cash out to PayPal. 1,000 points = $1. Free to join with Google." },
      { property: "og:title", content: "Syde Hustle - Earn from tasks, cash out to PayPal" },
      { property: "og:description", content: "Complete simple online tasks and offers, earn points, and cash out to PayPal." },
      { property: "og:url", content: "https://sydehustle.dpdns.org/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://sydehustle.dpdns.org/icon-512.png" },
      { name: "theme-color", content: "#020617" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Syde Hustle" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: RootComponent,
});
type InstallPromptEvent = Event & { prompt: () => Promise<void> };
function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  if (installed || (!promptEvent && !isIos)) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={async () => {
          if (promptEvent) {
            await promptEvent.prompt();
            setPromptEvent(null);
          } else {
            setShowIosHelp((v) => !v);
          }
        }}
        className="rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-bold text-slate-950 hover:bg-emerald-400"
      >
        Install app
      </button>
      {showIosHelp && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300 shadow-xl">
          On iPhone: tap the Share button in Safari, then choose <b>Add to Home Screen</b>.
        </div>
      )}
    </div>
  );
}
function RootComponent() {
  const [points, setPoints] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/user/balance");
        if (response.ok) {
          const data = await response.json();
          if (!cancelled) setPoints(typeof data.points === "number" ? data.points : 0);
        }
      } catch {
        /* wallet retries */
      }
    };
    // The server decides which account this browser belongs to.
    ensureSession()
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        load();
        window.addEventListener("focus", load);
      });
    const timer = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
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
          <div className="flex items-center gap-2">
            <InstallButton />
          <Link
              to="/wallet"
              className="rounded-xl border border-slate-800 px-3.5 py-1.5 font-mono text-sm font-bold text-emerald-400"
            >
              {points.toLocaleString()} PTS{" "}
              <span className="text-xs text-slate-400">(${(points / 1000).toFixed(2)})</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <footer className="border-t border-slate-800/60 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <p>© 2026 Syde Hustle. Verified tasks &amp; tracked rewards.</p>
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
