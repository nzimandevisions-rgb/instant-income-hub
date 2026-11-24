import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureSession } from "@/lib/account";
import { FirstVisitGuide } from "@/components/EarnGuide";

export const Route = createFileRoute("/surveys")({ component: SurveysPage });

type Wall = "cpx" | "theoremreach";

const WALLS: { id: Wall; label: string; endpoint: string; title: string }[] = [
  { id: "cpx", label: "CPX Research", endpoint: "/api/user/cpx-url", title: "Syde Hustle surveys (CPX Research)" },
  { id: "theoremreach", label: "TheoremReach", endpoint: "/api/user/theoremreach-url", title: "Syde Hustle surveys (TheoremReach)" },
];

function SurveysPage() {
  const [state, setState] = useState<"loading" | "signin" | "ready" | "error">("loading");
  const [url, setUrl] = useState("");
  const [wall, setWall] = useState<Wall>(() => {
    if (typeof window === "undefined") return "cpx";
    const w = new URLSearchParams(window.location.search).get("wall");
    return w === "theoremreach" ? "theoremreach" : "cpx";
  });
  const current = WALLS.find((w) => w.id === wall) ?? WALLS[0];

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setUrl("");
    ensureSession()
      .catch(() => undefined)
      .finally(async () => {
        try {
          const res = await fetch(current.endpoint, { cache: "no-store" });
          if (cancelled) return;
          if (res.status === 401) return setState("signin");
          const data = (await res.json()) as { url?: string };
          if (!res.ok || !data.url) return setState("error");
          setUrl(data.url);
          setState("ready");
        } catch {
          if (!cancelled) setState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [current.endpoint]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Paid surveys</p>
          <h1 className="mt-1 text-xl font-black text-white">Share your opinion, earn points</h1>
          <p className="mt-1 text-xs text-slate-400">
            Surveys pay the fastest. If a survey says you don't qualify, try the next one—new surveys arrive all day.
          </p>
        </div>
        <Link to="/" className="shrink-0 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200">
          ← Tasks
        </Link>
      </div>

      <FirstVisitGuide variant="surveys" />

      <div role="tablist" aria-label="Survey providers" className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-1">
        {WALLS.map((w) => (
          <button
            key={w.id}
            type="button"
            role="tab"
            aria-selected={wall === w.id}
            onClick={() => setWall(w.id)}
            className={
              "rounded-xl px-3 py-2 text-xs font-black transition " +
              (wall === w.id ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:bg-slate-800")
            }
          >
            {w.label}
          </button>
        ))}
      </div>

      {state === "loading" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400">Loading surveys…</div>
      )}

      {state === "signin" && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center">
          <div className="text-4xl">🔒</div>
          <h2 className="mt-3 text-lg font-black text-white">Sign in to take surveys</h2>
          <p className="mt-2 text-sm text-slate-400">Your survey rewards are saved to your Google account.</p>
          <a href="/api/auth/google?next=/surveys" className="mt-5 inline-block rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950">
            Continue with Google
          </a>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
          {current.label} surveys are unavailable right now. Try the other tab or check back shortly.
        </div>
      )}

      {state === "ready" && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-white">
          <iframe
            key={wall}
            title={current.title}
            src={url}
            className="h-[85vh] w-full"
            frameBorder={0}
            allow="clipboard-write"
          />
        </div>
      )}
    </div>
  );
}
