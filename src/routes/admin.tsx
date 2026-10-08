import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Row = {
  id: string;
  user_id: string;
  account_email: string;
  destination: string;
  points: number;
  usd: number;
  status: string;
  created_at: string;
  completions: number;
  earned_points: number;
  error_message: string | null;
};

const KEY_STORAGE = "syde_hustle_admin_key";

function AdminPage() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async (adminKey = key) => {
    setError(null);
    const res = await fetch("/api/admin/cashouts", { headers: { "x-admin-key": adminKey } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not load cash-outs.");
      return;
    }
    window.sessionStorage.setItem(KEY_STORAGE, adminKey);
    setRows(data.cashouts || []);
  };

  useEffect(() => {
    const saved = window.sessionStorage.getItem(KEY_STORAGE);
    if (saved) {
      setKey(saved);
      load(saved);
    }
  }, []);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    const res = await fetch("/api/admin/cashouts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ id, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || "Action failed.");
    setBusy(null);
    await load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-white">Cash-out review</h1>
      <div className="flex gap-2">
        <input
          type="password"
          placeholder="Admin key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
        />
        <button onClick={() => load()} className="rounded-lg bg-emerald-500 px-4 text-xs font-bold text-slate-950">
          Load
        </button>
      </div>
      {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}
      <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900">
        {rows.length === 0 && <p className="p-4 text-xs text-slate-500">No cash-outs.</p>}
        {rows.map((r) => (
          <div key={r.id} className="flex flex-col gap-2 p-4 text-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-white">
                ${Number(r.usd).toFixed(2)} to {r.destination}
              </div>
              <div className="text-slate-400">
                Account {r.account_email} · {r.completions} completed tasks · {Number(r.earned_points).toLocaleString()} pts earned
              </div>
              <div className="font-mono text-[10px] text-slate-500">
                {r.id} · {new Date(r.created_at).toLocaleString()} · {r.status.replace(/_/g, " ")}
                {r.error_message ? " · " + r.error_message : ""}
              </div>
            </div>
            {r.status === "awaiting_approval" && (
              <div className="flex gap-2">
                <button
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "approve")}
                  className="rounded-lg bg-emerald-500 px-3 py-2 font-bold text-slate-950 disabled:opacity-50"
                >
                  Approve & pay
                </button>
                <button
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "reject")}
                  className="rounded-lg border border-rose-500/40 px-3 py-2 font-bold text-rose-300 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
