import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useFeed, readStartedTasks, rememberStartedTask, type LiveTask, type StartedTask } from "@/lib/feed";
import { ensureSession } from "@/lib/account";
import { FirstVisitGuide } from "@/components/EarnGuide";

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
            <div className="flex h-full min-h-36 items-center justify-center text-4xl">📋</div>
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
    const timer = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 60000);
    window.addEventListener("syde-started-tasks", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("syde-started-tasks", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  if (started.length === 0) return null;

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
        Most rewards confirm within minutes. Some, like reaching a game level, take a few days.
      </p>
      <ul className="mt-3 divide-y divide-slate-800">
        {started.slice(0, 8).map((task) => {
          const points = credited.get(task.id + task.startedAt);
          const hours = (Date.now() - task.startedAt) / 3600000;
          const status =
            points !== undefined
              ? { text: `Credited +${points.toLocaleString()} PTS`, cls: "bg-emerald-500/15 text-emerald-300" }
              : hours > 120
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
      {started.some((t) => !credited.has(t.id + t.startedAt) && Date.now() - t.startedAt > 120 * 3600000) && (
        <p className="mt-2 text-[11px] text-slate-500">
          "Not confirmed" usually means a step was skipped or the offer was already used on this device.{" "}
          <Link to="/how-it-works" className="underline hover:text-slate-300">Tips to get credited</Link>
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
  const [taskNote, setTaskNote] = useState<string | null>(null);

  useEffect(() => {
    ensureSession()
      .then((session) => {
        setId(session.accountId);
        setSignedIn(session.signedIn);
      })
      .catch(() => undefined);
    const auth = new URLSearchParams(window.location.search).get("auth");
    if (auth === "ok") setAuthNote("You're signed in. Your points are saved to your Google account. Pick a survey or task to start.");
    if (auth === "error") setAuthNote("Google sign-in didn't finish. Please try again.");
    if (auth) window.history.replaceState(null, "", "/");
  }, []);

  const startTask = (task: LiveTask) => {
    if (!signedIn) {
      setAskSignIn(true);
      return;
    }
    if (!task.url) return;
    rememberStartedTask(task);
    const opened = window.open(task.url, "_blank");
    if (opened) opened.opener = null;
    else window.location.href = task.url;
    setTaskNote(
      "\"" + task.title + "\" opened in a new tab. Finish every step there, then come back here. Your reward shows under \"Your tasks\" once it's confirmed.",
    );
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
            ● Free to join · No deposits
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Get paid for surveys and quick tasks.</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Answer surveys or try apps, earn points, and cash out to PayPal from 500 points ($0.50). 1,000 points = $1.
          </p>
          {signedIn ? (
            <Link
              to="/surveys"
              className="mt-5 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400"
            >
              Start a survey →
            </Link>
          ) : (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <a
                href="/api/auth/google?next=/surveys"
                className="inline-flex justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400"
              >
                Sign up free with Google
              </a>
              <span className="text-xs text-slate-400">Takes 10 seconds. Your points stay safe on your Google account.</span>
            </div>
          )}
          <ol className="mt-5 grid max-w-xl gap-2 text-xs text-slate-400 sm:grid-cols-3">
            <li><span className="font-black text-emerald-400">1.</span> Sign in with Google</li>
            <li><span className="font-black text-emerald-400">2.</span> Finish a survey or task</li>
            <li><span className="font-black text-emerald-400">3.</span> Cash out to PayPal</li>
          </ol>
          {id && (
            <p className="mt-4 font-mono text-[10px] text-slate-600">
              Account ID: <span className="text-slate-500">{id}</span>
            </p>
          )}
        </div>
      </section>

      <FirstVisitGuide variant="offers" />

      {authNote && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{authNote}</div>
      )}

      {taskNote && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          <span>{taskNote}</span>
          <button type="button" onClick={() => setTaskNote(null)} className="shrink-0 text-xs font-bold text-sky-300 hover:text-white">
            Got it
          </button>
        </div>
      )}

      <Link
        to="/surveys"
        className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 to-slate-900 p-5 transition hover:border-emerald-400"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Fastest way to earn · Paid surveys</p>
          <h2 className="mt-1 text-lg font-black text-white">Earn more with daily surveys</h2>
          <p className="mt-1 text-xs text-slate-300">5 to 15 minutes each, no downloads, no deposits. Reach the $0.50 PayPal cash-out fastest here.</p>
        </div>
        <span className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950">Open surveys →</span>
      </Link>

      <TaskTracker />

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">App & task offers</p>
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

        {!(offers.loading || surveys.loading) && tab === "survey" && surveys.tasks.length === 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/70 p-6 text-center text-sm text-slate-300">
            <p className="font-bold text-white">Live surveys are waiting on our Paid Surveys wall</p>
            <p className="mt-1 text-slate-400">Open CPX Research surveys to see today's paid questionnaires.</p>
            <Link
              to="/surveys"
              className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-emerald-400"
            >
              Go to Paid Surveys →
            </Link>
          </div>
        )}

        {!(offers.loading || surveys.loading) && tab !== "survey" && tasks.length === 0 && (
          !signedIn ? (
            <div className="rounded-2xl border border-emerald-700/50 bg-slate-900/50 p-6 text-center text-sm text-slate-300">
              <p className="font-bold text-white">Sign in to see today's paid tasks</p>
              <p className="mt-1 text-slate-400">Tasks are matched to your account so your points are tracked.</p>
              <button
                type="button"
                onClick={() => setAskSignIn(true)}
                className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-400"
              >
                Continue with Google
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
              No app offers are available for your device right now. Check our{" "}
              <Link to="/surveys" className="font-bold text-emerald-300 underline">Paid Surveys</Link> for today's tasks!
            </div>
          )
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
        1,000 points = $1.00 USD. Third-party networks control approval and completion. Earnings vary; nothing is
        guaranteed. <Link to="/how-it-works" className="underline hover:text-slate-400">How it works</Link>
      </p>
    </div>
  );
}
