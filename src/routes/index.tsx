import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useFeed, launchTask, type LiveTask } from "@/lib/feed";
import { getOrCreateAccountId } from "@/lib/account";

export const Route = createFileRoute("/")({ component: DashboardPage });
type Wall = {
  key: string;
  name: string;
  description: string;
  url: string;
  trackingParam: string;
  badge: string;
};
const WALLS: Wall[] = [
  {
    key: "cpalead",
    name: "CPAlead Offers",
    description: "Games, apps, surveys, and daily tasks.",
    url: "https://www.mobtrk.link/wall/HnRe",
    trackingParam: "subid",
    badge: "LIVE WALL",
  },
  {
    key: "cpagrip",
    name: "CPAGrip Global Offers",
    description: "Downloads, email submits, and quick offers.",
    url: "https://www.cpagrip.com/showoffer.php",
    trackingParam: "subid",
    badge: "FAST",
  },
  {
    key: "monlix",
    name: "Monlix Surveys & Tasks",
    description: "Surveys, micro-tasks, and mobile discovery.",
    url: "https://survey.monlix.com/",
    trackingParam: "userId",
    badge: "SURVEYS",
  },
  {
    key: "adscend",
    name: "Adscend Media Rewards",
    description: "Video rewards, surveys, and brand engagement.",
    url: "https://asmtech.adscendmedia.com/adwall/publisher/3359608/profile/default",
    trackingParam: "subid1",
    badge: "REWARDS",
  },
  {
    key: "adgem",
    name: "AdGem Gaming Wall",
    description: "Mobile games and high-reward install tasks.",
    url: "https://player.adgem.com/v1/wall",
    trackingParam: "playerid",
    badge: "GAMES",
  },
];
function trackedUrl(wall: Wall, id: string) {
  const url = new URL(wall.url);
  if (wall.key === "monlix") url.searchParams.set("appId", "sydehustle");
  if (wall.key === "adgem") url.searchParams.set("appid", "sydehustle");
  url.searchParams.set(wall.trackingParam, id);
  return url.toString();
}
function TaskCard({ task, id }: { task: LiveTask; id: string }) {
  return (
    <article className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:flex-row sm:items-center">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-extrabold uppercase text-emerald-400">
            {task.hot ? "HOT" : "LIVE"}
          </span>
          {task.meta && <span className="text-[11px] text-slate-500">{task.meta}</span>}
          <span className="rounded-lg bg-slate-950 px-2.5 py-1 font-mono text-xs font-black text-emerald-400">
            +{task.points.toLocaleString()} PTS
          </span>
        </div>
        <h3 className="text-base font-bold text-white">{task.title}</h3>
        {task.description && <p className="mt-1 text-xs text-slate-400">{task.description}</p>}
      </div>
      <button
        type="button"
        disabled={!task.url}
        onClick={() => task.url && launchTask(task.url, id)}
        className="shrink-0 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 hover:text-slate-950 disabled:opacity-40"
      >
        {task.url ? "Start & Earn" : "Link unavailable"}
      </button>
    </article>
  );
}
function DashboardPage() {
  const [id, setId] = useState("");
  const [tab, setTab] = useState<"all" | "offer" | "survey">("all");
  const [status, setStatus] = useState("");
  const [destination, setDestination] = useState("");
  useEffect(() => {
    setId(getOrCreateAccountId());
  }, []);
  const offers = useFeed("offer", id);
  const surveys = useFeed("survey", id);
  const tasks =
    tab === "offer"
      ? offers.tasks
      : tab === "survey"
        ? surveys.tasks
        : [...offers.tasks, ...surveys.tasks];
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setDestination("");
    setStatus(
      "Your balance refreshes automatically after a confirmed network postback. Open Wallet to request a payout.",
    );
  };
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/50 p-6 sm:p-8">
        <div className="relative">
          <div className="mb-3 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            ● Earn points from completed tasks
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            Complete offers. Build your balance.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Every wall is linked to your account ID. When a network confirms completion, the
            postback credits your points automatically.
          </p>
          <p className="mt-4 font-mono text-xs text-slate-500">
            Account ID: <span className="text-emerald-400">{id || "Creating account..."}</span>
          </p>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              All available networks
            </p>
            <h2 className="mt-1 text-xl font-black text-white">Offer walls</h2>
          </div>
          <p className="text-xs text-slate-500">
            Use the same account ID everywhere so rewards match.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WALLS.map((wall) => (
            <a
              key={wall.key}
              href={id ? trackedUrl(wall, id) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 hover:border-emerald-500/50"
            >
              <div className="flex justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  {wall.badge}
                </span>
                <span className="text-slate-500">↗</span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-white group-hover:text-emerald-300">
                {wall.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{wall.description}</p>
              <div className="mt-4 text-xs font-bold text-emerald-400">Browse offers →</div>
            </a>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Configured live feeds
            </p>
            <h2 className="mt-1 text-xl font-black text-white">Individual offers</h2>
          </div>
          <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
            {(["all", "offer", "survey"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={
                  tab === item
                    ? "rounded-lg bg-emerald-500 px-3 py-2 text-[11px] font-bold capitalize text-slate-950"
                    : "rounded-lg px-3 py-2 text-[11px] font-bold capitalize text-slate-400"
                }
              >
                {item === "all" ? "All" : item + "s"}
              </button>
            ))}
          </div>
        </div>
        {(offers.loading || surveys.loading) && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400">
            Loading configured offer feeds…
          </div>
        )}
        {!(offers.loading || surveys.loading) && tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
            No API-backed individual offers are configured yet. The five offer walls above are ready
            to browse now.
          </div>
        )}
        {(offers.error || surveys.error) && (
          <p className="text-xs text-amber-300">
            An optional live feed is unavailable; the offer walls remain available.
          </p>
        )}
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id + task.title} task={task} id={id} />
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-white">Ready to cash out?</h2>
            <p className="mt-1 text-xs text-slate-400">
              Wallet balances refresh after confirmed completions.
            </p>
          </div>
          <Link
            to="/wallet"
            className="rounded-xl border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300"
          >
            View wallet
          </Link>
        </div>
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            aria-label="Payout destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="PayPal email (optional)"
            className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300"
          >
            Check status
          </button>
        </form>
        {status && <p className="mt-3 text-xs text-emerald-300">{status}</p>}
      </section>
      <p className="text-center text-[11px] text-slate-600">
        1,000 points = $1.00 USD. Third-party networks control approval and completion.
      </p>
    </div>
  );
}
