import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureSession } from "@/lib/account";

export const Route = createFileRoute("/surveys")({ component: SurveysPage });

function SurveysPage() {
  const [state, setState] = useState<"loading" | "signin" | "ready" | "error">("loading");
  const [url, setUrl] = useState("");

  useEffect(() => {
    ensureSession()
      .catch(() => undefined)
      .finally(async () => {
        try {
          const res = await fetch("/api/user/cpx-url", { cache: "no-store" });
          if (res.status === 401) return setState("signin");
          const data = (await res.json()) as { url?: string };
          if (!res.ok || !data.url) return setState("error");
          setUrl(data.url);
          setState("ready");
        } catch {
          setState("error");
        }
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Paid surveys</p>
          <h1 className="mt-1 text-xl font-black text-white">Share your opinion, earn points</h1>
          <p className="mt-1 text-xs text-slate-400">
            Surveys pay more than most offers. If a survey says you don't qualify, try the next one: new ones arrive all day.
          </p>
        </div>
        <Link to="/" className="shrink-0 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200">
          ← Tasks
        </Link>
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
          Surveys are unavailable right now. Please check back shortly.
        </div>
      )}

      {state === "ready" && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-white">
          <iframe title="Syde Hustle surveys" src={url} className="h-[85vh] w-full" frameBorder={0} />
        </div>
      )}
    </div>
  );
}
