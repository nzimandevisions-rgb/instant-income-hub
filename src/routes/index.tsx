import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useFeed, launchTask, type LiveTask } from "@/lib/feed";
import { getOrCreateAccountId } from "@/lib/account";

export const Route = createFileRoute("/")({ component: DashboardPage });
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
