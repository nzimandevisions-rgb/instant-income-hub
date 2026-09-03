import { useEffect, useState } from 'react';

const WORKER_URL = 'https://syde-hustle-proxy.velley-velley.workers.dev';

export function WalletComponent() {
  const [accountId, setAccountId] = useState('');
  const [points, setPoints] = useState(0);
  const [cashouts, setCashouts] = useState<any[]>([]);
  const [method, setMethod] = useState('MTN MoMo');
  const [destination, setDestination] = useState('');
  const [ptsAmount, setPtsAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      id = 'SH-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      localStorage.setItem('syde_hustle_account_id', id);
    }
    setAccountId(id);
    loadWallet(id);

    const interval = setInterval(() => loadWallet(id), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(`${WORKER_URL}/api/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingId: accountId,
          method,
          destination,
          points: ptsAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to submit withdrawal.');
      } else {
        setMessage('Cashout requested! Processing via ' + method);
        setPoints(data.balance);
        setCashouts(data.cashouts);
        setDestination('');
      }
    } catch (err) {
      setMessage('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-2">
        <span className="text-xs font-mono text-slate-400">Account ID: {accountId}</span>
        <div className="text-4xl font-extrabold text-emerald-400 font-mono">{points} PTS</div>
        <div className="text-slate-400 text-sm">Balance: ${(points / 1000).toFixed(2)} USD</div>
        <button
          onClick={() => loadWallet(accountId)}
          className="text-xs text-emerald-500 hover:underline pt-2 inline-block"
        >
          ↻ Refresh Balance
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-4">Cash Out (PayPal / MoMo)</h2>

        {message && (
          <div className="mb-4 p-3 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            {message}
          </div>
        )}

        <form onSubmit={handleCashout} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="MTN MoMo">MTN Mobile Money (MoMo)</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="PayPal">PayPal</option>
              <option value="Airtime">Prepaid Airtime</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {method === 'PayPal' ? 'PayPal Email' : 'Phone Number (e.g. 064...)'}
            </label>
            <input
              type="text"
              required
              placeholder={method === 'PayPal' ? 'you@email.com' : '0645007165'}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Points to Cash Out (Min 500 PTS)</label>
            <input
              type="number"
              min="500"
              step="100"
              max={points}
              value={ptsAmount}
              onChange={(e) => setPtsAmount(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || points < ptsAmount || ptsAmount < 500}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-lg text-xs transition"
          >
            {loading ? 'Submitting...' : `Cash Out ${(ptsAmount / 1000).toFixed(2)} USD`}
          </button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-3">Withdrawal History</h3>
        {cashouts.length === 0 ? (
          <p className="text-xs text-slate-500">No cashout requests yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {cashouts.map((c: any, i: number) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{c.method} - {c.destination}</div>
                  <div className="text-[10px] text-slate-500">{new Date(c.date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-emerald-400">-${c.amountUsd}</div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
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
