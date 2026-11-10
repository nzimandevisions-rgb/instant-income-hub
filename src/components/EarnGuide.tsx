import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Honest note about ads. Offers and surveys open advertiser pages that Syde
 * Hustle does not control; some of them show "You won!" style pop-ups.
 */
export function AdsHonestyNote({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-5 text-amber-100/80">
        <b className="text-amber-200">Seeing "You won!" pop-ups?</b> They come from advertisers' pages, not from us. Close
        them. No one wins a prize here; you earn points for real tasks.{" "}
        <Link to="/how-it-works" className="font-bold text-amber-200 underline">
          How it works
        </Link>
      </p>
    );
  }
  return (
    <aside className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Straight talk</p>
      <h2 className="mt-1 font-black text-white">Seeing ads or "You won!" pop-ups?</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Those come from advertisers' pages, not from us. Close them. Ads and offers are what keep Syde Hustle free,
        and we share that revenue with you as points. No one wins a prize here; you earn points for real tasks.
      </p>
    </aside>
  );
}

type GuideVariant = "offers" | "surveys";

const STEPS: Record<GuideVariant, { icon: string; title: string; body: string }[]> = {
  offers: [
    {
      icon: "1",
      title: "Sign in with Google",
      body: "Your points are saved to your Google account, so you keep them on any phone.",
    },
    {
      icon: "2",
      title: "Pick a task and finish it honestly",
      body: "Read the steps on the card. Use your real details, stay off VPNs, and do it in one sitting.",
    },
    {
      icon: "3",
      title: "Points land, then cash out",
      body: "Most rewards arrive in minutes; some take a few days. Cash out to PayPal from 500 points.",
    },
  ],
  surveys: [
    {
      icon: "1",
      title: "Pick any survey",
      body: "Each one shows its reward and roughly how long it takes. Start with a short one.",
    },
    {
      icon: "2",
      title: "Answer truthfully",
      body: "Screen-outs (\"you don't qualify\") are normal. It isn't you. Just try the next survey.",
    },
    {
      icon: "3",
      title: "Points arrive automatically",
      body: "Completed surveys credit your balance. Cash out to PayPal from 500 points.",
    },
  ],
};

const storageKey = (variant: GuideVariant) => `syde_hustle_guide_${variant}_v1`;

/** A short, dismissible 3-step walkthrough shown on a member's first visit. */
export function FirstVisitGuide({ variant }: { variant: GuideVariant }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const steps = STEPS[variant];

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(storageKey(variant)) !== "done");
    } catch {
      setVisible(true);
    }
  }, [variant]);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(storageKey(variant), "done");
    } catch {
      /* storage blocked: the card simply shows again next time */
    }
  };

  if (!visible) return null;
  const current = steps[step]!;
  const last = step === steps.length - 1;

  return (
    <section
      className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-slate-900 p-5"
      aria-label="Getting started"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close the getting started guide"
        className="absolute right-3 top-3 rounded-lg px-2 py-1 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white"
      >
        ✕
      </button>
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
        New here? · Step {step + 1} of {steps.length}
      </p>
      <div className="mt-3 flex items-start gap-3 pr-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 font-black text-slate-950">
          {current.icon}
        </div>
        <div>
          <h2 className="font-black text-white">{current.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">{current.body}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((_, i) => (
            <span key={i} className={"h-1.5 w-6 rounded-full " + (i === step ? "bg-emerald-400" : "bg-slate-700")} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/how-it-works" className="text-xs font-bold text-emerald-300 underline hover:text-emerald-200">
            Full guide
          </Link>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? dismiss() : setStep((s) => s + 1))}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-emerald-400"
          >
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </section>
  );
}
