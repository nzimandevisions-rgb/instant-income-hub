import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useFeed, launchTask, type LiveTask } from "@/lib/feed";
import { getOrCreateAccountId } from "@/lib/account";

export const Route = createFileRoute("/")({ component: DashboardPage });
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
            Complete individual tasks directly through Syde Hustle. Your account ID is used for
            approved tracking and confirmed completions are credited automatically.
          </p>
          <p className="mt-4 font-mono text-xs text-slate-500">
            Account ID: <span className="text-emerald-400">{id || "Creating account..."}</span>
          </p>
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
            No eligible offers are available right now. New offers will appear here automatically when an
            approved feed is connected.
          </div>
        )}
        {(offers.error || surveys.error) && (
          <p className="text-xs text-amber-300">
            An optional live feed is temporarily unavailable. Please check back shortly.
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
