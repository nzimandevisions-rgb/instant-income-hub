import { createFileRoute, Link } from "@tanstack/react-router";
import { AdsHonestyNote } from "@/components/EarnGuide";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Syde Hustle works: surveys, tasks and PayPal cash-outs" },
      {
        name: "description",
        content:
          "A plain guide to earning on Syde Hustle: sign in with Google, complete surveys and tasks honestly, collect points and cash out to PayPal from 500 points.",
      },
      { property: "og:title", content: "How Syde Hustle works" },
      { property: "og:url", content: "https://sydehustle.dpdns.org/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://sydehustle.dpdns.org/how-it-works" }],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    title: "Sign in with Google",
    body: "Tap Start & Earn on any task, or open Surveys, and continue with Google. Your points are tied to your Google account, so you never lose them when you change phones.",
  },
  {
    title: "Pick a survey or a task",
    body: "Every card shows the points, roughly how long it takes, and anything you should know first (for example, a free trial or a deposit). New here? Start with a short survey.",
  },
  {
    title: "Complete it honestly",
    body: "Follow every step on the card, use your real details and finish in one sitting. The advertiser checks the work before they pay us, and we pass your share on as points.",
  },
  {
    title: "Points land in your balance",
    body: "Most rewards arrive within minutes. Some take a few days, for example when an app has to confirm you reached a level. You can follow each one under Your tasks.",
  },
  {
    title: "Cash out to PayPal",
    body: "Once you have 500 points (US$0.50), request a PayPal cash-out from your wallet. 1,000 points = US$1. Every cash-out is checked by a person before it's paid.",
  },
];

const EXAMPLES = [
  {
    tag: "Survey",
    icon: "📝",
    title: "A 5-minute survey",
    expect: [
      "A few quick questions first (age, country, interests) to see if the survey is a match for you.",
      "If it is, you answer the main questions. Take your time and answer truthfully.",
      "When you reach the end, the points are credited to your balance automatically.",
    ],
    note: "Screened out? That's normal. Survey companies need specific groups of people, and a \"you don't qualify\" message is not your fault. Just try the next survey.",
  },
  {
    tag: "App install",
    icon: "📱",
    title: "Install a game and reach a level",
    expect: [
      "Install the app from the link on the task card (not from a search in the app store), then open it.",
      "Play until you reach the level or goal the card mentions. That's the part the advertiser pays for.",
      "Keep the app installed until your points arrive. Some games confirm a few days later.",
    ],
    note: "Already had the app before? Most app offers only pay for new installs on that device.",
  },
  {
    tag: "Sign-up",
    icon: "✉️",
    title: "Sign up for a service",
    expect: [
      "Create the account with your real name and an email address you actually check.",
      "Confirm your email if they ask. Many sign-ups only count after confirmation.",
      "Read the terms. If it's a free trial, note the date and cancel before it renews if you don't want it.",
    ],
    note: "Anything that needs a payment or deposit is marked on its card. You never have to choose those.",
  },
];

const TIPS = [
  { title: "Use a real email", body: "Advertisers check it, and fake or throwaway emails usually don't get credited." },
  { title: "Don't use a VPN", body: "VPNs and proxies make tasks fail tracking and can get your account blocked." },
  { title: "Finish in one sitting", body: "Leaving halfway or switching browsers can break the tracking." },
  { title: "Screen-outs happen", body: "Not qualifying for some surveys is normal for everyone. Keep going." },
  { title: "One account per person", body: "Multiple accounts lose their points. Invite friends with your referral link instead." },
  { title: "Be patient with pending tasks", body: "Some rewards take a few days to confirm. Don't redo the same task." },
];

function HowItWorksPage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/50 p-6 sm:p-8">
        <div className="mb-3 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
          ● How it works
        </div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Real tasks. Real points. No prizes, no tricks.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Syde Hustle pays you points for surveys and tasks from advertisers. Here's exactly what to expect, so your
          first task goes smoothly.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/surveys" className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400">
            Try a survey →
          </Link>
          <Link to="/" className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800">
            See tasks
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Step by step</p>
        <h2 className="mt-1 text-xl font-black text-white">From sign-in to PayPal</h2>
        <ol className="mt-4 space-y-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 font-black text-emerald-400">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold text-white">{step.title}</h3>
                <p className="mt-0.5 text-sm leading-6 text-slate-400">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Worked examples</p>
          <h2 className="mt-1 text-xl font-black text-white">What a task actually looks like</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {EXAMPLES.map((ex) => (
            <article key={ex.title} className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{ex.icon}</span>
                <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase text-slate-400">{ex.tag}</span>
              </div>
              <h3 className="mt-3 font-bold text-white">{ex.title}</h3>
              <ul className="mt-2 flex-1 space-y-2 text-sm leading-6 text-slate-400">
                {ex.expect.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-xl bg-sky-500/10 px-3 py-2 text-xs leading-5 text-sky-200">{ex.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Tips</p>
        <h2 className="mt-1 text-xl font-black text-white">Get credited more often</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TIPS.map((tip) => (
            <div key={tip.title} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <h3 className="text-sm font-bold text-white">{tip.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>

      <AdsHonestyNote />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="font-bold text-white">What you can earn</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Earnings vary by country, by which surveys you qualify for, and by how many tasks you complete. There are
          no guarantees: think of it as pocket money for spare minutes, not a salary. Points are only credited when
          the advertiser confirms the task, and they can be removed if the advertiser later reverses it. See our{" "}
          <Link to="/terms" className="underline hover:text-slate-200">Terms</Link>.
        </p>
      </section>

      <div className="flex flex-wrap justify-center gap-2">
        <Link to="/surveys" className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400">
          Start with a survey →
        </Link>
        <Link to="/wallet" className="rounded-xl border border-emerald-500/40 px-5 py-3 text-sm font-bold text-emerald-300">
          View wallet
        </Link>
      </div>
    </div>
  );
}
