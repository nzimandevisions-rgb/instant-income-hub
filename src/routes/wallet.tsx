import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const WORKER_URL = 'https://syde-hustle-proxy.velley-velley.workers.dev';

export const Route = createFileRoute('/wallet')({
  component: WalletComponent,
});

function WalletComponent() {
  const [accountId, setAccountId] = useState('');
  const [points, setPoints] = useState(0);
  const [cashouts, setCashouts] = useState<any[]>([]);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [ptsAmount, setPtsAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadWallet = async (id: string) => {
    try {
      const res = await fetch(`${WORKER_URL}/api/wallet?tracking_id=${id}`);
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
    let id = localStorage.getItem('syde_hustle_account_id');
    if (!id) {
      id = 'sh-' + Math.random().toString(36).substring(2, 9).toLowerCase();
      localStorage.setItem('syde_hustle_account_id', id);
    }
    setAccountId(id);
    loadWallet(id);

    const timer = setInterval(() => loadWallet(id), 8000);
    return () => clearInterval(timer);
  }, []);

  const handleCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paypalEmail.includes('@')) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`${WORKER_URL}/api/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingId: accountId,
          paypalEmail,
          points: ptsAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Failed to submit cashout.' });
      } else {
        setMsg({ type: 'success', text: `Cashout submitted to ${paypalEmail}! Status: Pending.` });
        setPoints(data.balance);
        setCashouts(data.cashouts);
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Network error. Please try again.' });
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
        <h2 className="text-base font-bold text-white mb-4">Cash Out to PayPal</h2>

        {msg && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs border ${
              msg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleCashout} className="space-y-4">
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
            <label className="block text-xs text-slate-400 mb-1">Points to Cash Out (Min: 500 PTS = $0.50)</label>
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
            {loading ? 'Submitting...' : `Cash Out ${(ptsAmount / 1000).toFixed(2)} USD via PayPal`}
          </button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">PayPal Cashout History</h3>
        {cashouts.length === 0 ? (
          <p className="text-xs text-slate-500">No cashouts requested yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {cashouts.map((c: any, i: number) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{c.email}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Ref: {c.id} • {new Date(c.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400">-${c.usd}</div>
                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
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
