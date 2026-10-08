import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useFeed, readStartedTasks, rememberStartedTask, type LiveTask, type StartedTask } from "@/lib/feed";
import { ensureSession } from "@/lib/account";

export const Route = createFileRoute("/")({ component: DashboardPage });

function TaskCard({ task, onStart }: { task: LiveTask; onStart: (task: LiveTask) => void }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 transition hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-xl">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-44 w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 sm:h-auto sm:w-48">
          {task.imageUrl ? (
            <img
              src={task.imageUrl}
              alt=""
              loading="lazy"
              className="h-full min-h-36 w-full object-cover transition duration-300 group-hover:scale-105"
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="flex h-full min-h-36 items-center justify-center text-4xl">🎁</div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-slate-950/80 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-300 backdrop-blur">
            {task.hot ? "🔥 HOT" : "LIVE"}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {task.meta && <span className="rounded-md bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase text-slate-400">{task.meta}</span>}
              {task.timeLabel && <span className="rounded-md bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-300">⏱ {task.timeLabel}</span>}
              {task.effort === 1 && <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">Quick win</span>}
              <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-black text-emerald-400">
                +{task.points.toLocaleString()} PTS
              </span>
            </div>
            <h3 className="line-clamp-2 text-base font-bold text-white">{task.title}</h3>
            {task.description && <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-400">{task.description}</p>}
            {task.flag && <p className="mt-1.5 text-[11px] font-semibold text-amber-300/90">⚠ {task.flag}</p>}
          </div>
          <button
            type="button"
            disabled={!task.url}
            onClick={() => task.url && onStart(task)}
            className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {task.url ? "Start & Earn →" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}

type Earning = { txid: string; amount: number; type: string; created_at: string };

const toTime = (value: string) => Date.parse(value.includes("T") ? value : value.replace(" ", "T") + "Z");

function TaskTracker() {
  const [started, setStarted] = useState<StartedTask[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  useEffect(() => {
    const refresh = async () => {
      setStarted(readStartedTasks());
      try {
        const res = await fetch("/api/user/balance");
        if (res.ok) {
          const data = await res.json();
          setEarnings(Array.isArray(data.recentEarnings) ? data.recentEarnings : []);
        }
      } catch {
        /* retry on next tick */
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 20000);
    window.addEventListener("syde-started-tasks", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("syde-started-tasks", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  if (started.length === 0) return null;

  // Match each started task to a task reward that arrived after it was started.
  // An offer ID inside the reward wins; otherwise the oldest unmatched reward is used.
  const rewards = earnings.filter((e) => e.type !== "referral_bonus");
  const used = new Set<string>();
  const oldestFirst = [...started].sort((a, b) => a.startedAt - b.startedAt);
  const credited = new Map<string, number>();
  for (const task of oldestFirst) {
    const after = rewards.filter((e) => !used.has(e.txid) && toTime(e.created_at) >= task.startedAt - 60000);
    const match = after.find((e) => e.txid.includes("_" + task.id + "_")) ?? after.sort((a, b) => toTime(a.created_at) - toTime(b.created_at))[0];
    if (match) {
      used.add(match.txid);
      credited.set(task.id + task.startedAt, Number(match.amount) || 0);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 className="font-bold text-white">Your tasks</h2>
      <p className="mt-1 text-xs text-slate-400">
        Most rewards confirm within minutes. Some networks take up to 24 hours.
      </p>
      <ul className="mt-3 divide-y divide-slate-800">
        {started.slice(0, 8).map((task) => {
          const points = credited.get(task.id + task.startedAt);
          const hours = (Date.now() - task.startedAt) / 3600000;
          const status =
            points !== undefined
              ? { text: `Credited +${points.toLocaleString()} PTS`, cls: "bg-emerald-500/15 text-emerald-300" }
              : hours > 48
                ? { text: "Not confirmed", cls: "bg-slate-800 text-slate-400" }
                : { text: "Pending confirmation", cls: "bg-amber-500/15 text-amber-300" };
          return (
            <li key={task.id + task.startedAt} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{task.title}</p>
                <p className="text-[11px] text-slate-500">
                  Started {new Date(task.startedAt).toLocaleString()} · worth {task.points.toLocaleString()} PTS
                </p>
              </div>
              <span className={"shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold " + status.cls}>{status.text}</span>
            </li>
          );
        })}
      </ul>
      {started.some((t) => !credited.has(t.id + t.startedAt) && Date.now() - t.startedAt > 48 * 3600000) && (
        <p className="mt-2 text-[11px] text-slate-500">
          "Not confirmed" usually means a step was skipped or the offer was already used on this device.
        </p>
      )}
    </section>
  );
}

function DashboardPage() {
  const [id, setId] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [askSignIn, setAskSignIn] = useState(false);
  const [authNote, setAuthNote] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "offer" | "survey">("all");
  const [activeTask, setActiveTask] = useState<LiveTask | null>(null);

  useEffect(() => {
    ensureSession()
      .then((session) => {
        setId(session.accountId);
        setSignedIn(session.signedIn);
      })
      .catch(() => undefined);
    const auth = new URLSearchParams(window.location.search).get("auth");
    if (auth === "ok") setAuthNote("You're signed in. Your points are saved to your Google account. Pick a task to start.");
    if (auth === "error") setAuthNote("Google sign-in didn't finish. Please try again.");
    if (auth) window.history.replaceState(null, "", "/");
  }, []);

  const startTask = (task: LiveTask) => {
    if (!signedIn) {
      setAskSignIn(true);
      return;
    }
    rememberStartedTask(task);
    setActiveTask(task);
  };

  const offers = useFeed("offer", id);
  const surveys = useFeed("survey", id);
  const tasks =
    tab === "offer"
      ? offers.tasks
      : tab === "survey"
        ? surveys.tasks
        : [...offers.tasks, ...surveys.tasks];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/50 p-6 sm:p-8">
        <div className="relative">
          <div className="mb-3 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            ● Earn points from completed tasks
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Complete offers. Build your balance.</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Complete tasks inside Syde Hustle. Your account ID is used for approved tracking and confirmed completions are credited automatically.
          </p>
          <p className="mt-4 font-mono text-xs text-slate-500">
            Account ID: <span className="text-emerald-400">{id || "Creating account..."}</span>
          </p>
        </div>
      </section>

      {authNote && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{authNote}</div>
      )}

      <Link
        to="/surveys"
        className="flex items-center justify-between gap-4 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/60 to-slate-900 p-5 transition hover:border-sky-400/60"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-300">New · Paid surveys</p>
          <h2 className="mt-1 font-black text-white">Earn more with surveys</h2>
          <p className="mt-1 text-xs text-slate-400">5 to 15 minutes each, no downloads, no deposits.</p>
        </div>
        <span className="shrink-0 rounded-xl bg-sky-400 px-4 py-2.5 text-xs font-black text-slate-950">Open surveys →</span>
      </Link>

      <TaskTracker />

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Available tasks</p>
            <h2 className="mt-1 text-xl font-black text-white">Earn by completing tasks</h2>
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
            Loading available tasks…
          </div>
        )}

        {!(offers.loading || surveys.loading) && tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
            No eligible tasks are available right now. New tasks will appear automatically when an approved feed has eligible inventory.
          </div>
        )}

        {(offers.error || surveys.error) && (
          <p className="text-xs text-amber-300">Some task inventory is temporarily unavailable. Please check back shortly.</p>
        )}

        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id + task.title} task={task} onStart={startTask} />
          ))}
        </div>
      </section>

      {askSignIn && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
            <div className="text-4xl">🔒</div>
            <h2 className="mt-3 text-lg font-black text-white">Sign in to start earning</h2>
            <p className="mt-2 text-sm text-slate-400">
              Your points are saved to your Google account, so you never lose them, even if you change phones.
            </p>
            <a
              href="/api/auth/google?next=/"
              className="mt-5 block rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400"
            >
              Continue with Google
            </a>
            <button type="button" onClick={() => setAskSignIn(false)} className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-300">
              Not now
            </button>
          </div>
        </div>
      )}

      {activeTask?.url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-2 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Syde Hustle task"
        >
          <div className="flex h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Syde Hustle Task</p>
                <h2 className="truncate text-sm font-bold text-white">{activeTask.title}</h2>
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href={activeTask.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
                >
                  Open in new tab
                </a>
                <button type="button" onClick={() => setActiveTask(null)} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700">
                  Close
                </button>
              </div>
            </div>
            <iframe
              title="Syde Hustle task"
              src={activeTask.url}
              className="min-h-0 flex-1 bg-white"
              sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts allow-same-origin"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="border-t border-slate-800 px-4 py-2 text-center text-[10px] text-slate-500">
              Page blank or stuck? Tap "Open in new tab". Your progress shows under Your tasks, and rewards are credited after the network confirms.
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-white">Ready to cash out?</h2>
            <p className="mt-1 text-xs text-slate-400">
              Balances refresh automatically after confirmed completions. Cash out to PayPal from
              your wallet once you reach 500 PTS.
            </p>
          </div>
          <Link to="/wallet" className="rounded-xl border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300">
            View wallet
          </Link>
        </div>
      </section>

      <p className="text-center text-[11px] text-slate-600">
        1,000 points = $1.00 USD. Third-party networks control approval and completion.
      </p>
    </div>
  );
}
