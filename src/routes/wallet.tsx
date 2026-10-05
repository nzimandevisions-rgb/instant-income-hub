import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getOrCreateAccountId } from "@/lib/account";

export const Route = createFileRoute("/wallet")({
  component: WalletComponent,
});

type Cashout = { email: string; id: string; date: string; usd: string | number; status: string };

function WalletComponent() {
  const [accountId, setAccountId] = useState("");
  const [points, setPoints] = useState(0);
  const [cashouts, setCashouts] = useState<Cashout[]>([]);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [ptsAmount, setPtsAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadWallet = async () => {
    try {
      const res = await fetch("/api/user/balance");
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points || 0);
        setCashouts(data.cashouts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const startSession = async () => {
      try {
        // Reuse the browser account ID so the wallet session points at the
        // same user record that offer postbacks credit.
        const accountId = getOrCreateAccountId();
        const res = await fetch("/api/user/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId }),
        });
        const data = await res.json();
        if (!res.ok || !data.accountId) throw new Error(data.error || "Session failed");
        setAccountId(data.accountId);
        await loadWallet();
      } catch (error) {
        console.error(error);
        setMsg({ type: "error", text: "Wallet session could not be started. Refresh to try again." });
      }
    };
    startSession();

    const timer = setInterval(() => loadWallet(), 8000);
    return () => clearInterval(timer);
  }, []);

  const handleCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(paypalEmail)) {
      setMsg({ type: "error", text: "Enter a valid PayPal email address." });
      return;
    }
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/user/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: paypalEmail,
          points: ptsAmount,
          method: "paypal",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Failed to submit cashout." });
        await loadWallet();
      } else {
        setMsg({ type: "success", text: `Cash-out submitted to ${paypalEmail}. PayPal is processing your payout.` });
        setPoints(data.balance);
        setCashouts(data.cashouts);
      }
    } catch (err) {
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-1">
        <div className="text-xs font-mono text-slate-500">ID: {accountId}</div>
        <div className="text-4xl font-black text-emerald-400 font-mono">{points} PTS</div>
        <div className="text-xs text-slate-400">Available: ${(points / 1000).toFixed(2)} USD</div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-base font-bold text-white mb-4">Cash Out</h2>

        {msg && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs border ${
              msg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleCashout} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Payout method</label>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white">
              PayPal
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">PayPal Email Address</label>
            <input
              type="email"
              required
              placeholder="your-paypal@email.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Points to Cash Out (Min: 500 PTS = $0.50)
            </label>
            <input
              type="number"
              min="500"
              step="100"
              max={points}
              value={ptsAmount}
              onChange={(e) => setPtsAmount(parseInt(e.target.value, 10) || 500)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || points < ptsAmount || ptsAmount < 500}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-lg text-xs transition"
          >
            {loading ? "Submitting..." : `Cash Out $${(ptsAmount / 1000).toFixed(2)} USD via PayPal`}
          </button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Cash-out History
        </h3>
        {cashouts.length === 0 ? (
          <p className="text-xs text-slate-500">No cashouts requested yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {cashouts.map((c, i: number) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{c.email}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Ref: {c.id} • {new Date(c.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400">-${c.usd}</div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      c.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : c.status === "failed"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
