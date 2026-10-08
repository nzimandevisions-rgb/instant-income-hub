import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ensureSession, signOut } from "@/lib/account";

export const Route = createFileRoute("/wallet")({
  component: WalletComponent,
});

type Cashout = { email: string; id: string; date: string; usd: string | number; status: string };

function WalletComponent() {
  const [accountId, setAccountId] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [cashouts, setCashouts] = useState<Cashout[]>([]);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [ptsAmount, setPtsAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralPoints, setReferralPoints] = useState(0);
  const [copied, setCopied] = useState(false);
  const inviteLink = accountId ? `https://sydehustle.dpdns.org/?ref=${accountId}` : "";

  const shareInvite = async () => {
    if (!inviteLink) return;
    const text = "I'm earning PayPal cash on Syde Hustle by doing quick tasks. Join with my link: " + inviteLink;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Syde Hustle", text, url: inviteLink });
        return;
      }
    } catch {
      /* fall back to copy */
    }
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your invite link:", inviteLink);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await fetch("/api/user/balance");
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points || 0);
        setCashouts(data.cashouts || []);
        setReferralCount(data.referralCount || 0);
        setReferralPoints(data.referralPoints || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const startSession = async () => {
      try {
        const session = await ensureSession();
        setAccountId(session.accountId);
        setSignedIn(session.signedIn);
        setGoogleEmail(session.email);
        const auth = new URLSearchParams(window.location.search).get("auth");
        if (auth === "error") setMsg({ type: "error", text: "Google sign-in didn't complete. Please try again." });
        if (auth === "ok") setMsg({ type: "success", text: "Signed in with Google. Your points are safe on this account." });
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
        setMsg({
          type: "success",
          text: data.review
            ? `Cash-out requested to ${paypalEmail}. It will be paid after a quick review.`
            : `Cash-out submitted to ${paypalEmail}. PayPal is processing your payout.`,
        });
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
        {signedIn ? (
          <div className="text-xs text-slate-400">
            Signed in as {googleEmail}{" "}
            <button
              type="button"
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
              className="underline hover:text-white"
            >
              Sign out
            </button>
          </div>
        ) : null}
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

        {!signedIn ? (
          <div className="space-y-3 text-center">
            <p className="text-xs text-slate-400">
              Sign in with Google to cash out and keep your points safe if you change phones or clear your browser.
            </p>
            <a
              href="/api/auth/google"
              className="inline-block w-full py-2.5 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-lg text-xs transition"
            >
              Continue with Google
            </a>
          </div>
        ) : (
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
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Invite friends, earn 10% forever</h2>
          <p className="text-xs text-slate-400 mt-1">
            Share your link. Every time a friend who joined with it completes a task, you get a bonus worth 10% of
            what they earned. It comes from our share, so your friend still gets their full reward.
          </p>
        </div>

        <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
          <li>Send your link to friends on WhatsApp or anywhere you chat.</li>
          <li>They open it and start doing tasks on Syde Hustle.</li>
          <li>When a task is confirmed, they get their points and you get 10% on top.</li>
        </ol>

        <div className="text-[11px] text-slate-500 bg-slate-950 border border-slate-800 rounded-lg p-3">
          Example: your friend finishes a task worth 1,000 points ($1.00). They keep all 1,000, and you get 100
          points ($0.10). There's no bonus just for signing up, only for tasks they actually complete.
        </div>

        <div className="flex gap-2">
          <input
            readOnly
            value={inviteLink || "Loading your link..."}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] text-white font-mono"
          />
          <button
            type="button"
            onClick={shareInvite}
            disabled={!inviteLink}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold rounded-lg text-xs transition whitespace-nowrap"
          >
            {copied ? "Copied!" : "Share link"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
            <div className="text-lg font-black text-white font-mono">{referralCount}</div>
            <div className="text-[10px] text-slate-500">Friends joined</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
            <div className="text-lg font-black text-emerald-400 font-mono">{referralPoints} PTS</div>
            <div className="text-[10px] text-slate-500">Earned from friends</div>
          </div>
        </div>
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
                    {c.status.replace(/_/g, " ")}
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
