import { useEffect, useState } from 'react';

const WORKER_URL = 'https://syde-hustle-proxy.velley-velley.workers.dev';

export function WalletComponent() {
  const [accountId, setAccountId] = useState('');
  const [inputRestoreId, setInputRestoreId] = useState('');
  const [points, setPoints] = useState(0);
  const [cashouts, setCashouts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [method, setMethod] = useState('MTN MoMo');
  const [destination, setDestination] = useState('');
  const [ptsAmount, setPtsAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const syncWallet = async (id: string) => {
    try {
      const res = await fetch(`${WORKER_URL}/api/wallet?tracking_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points || 0);
        setCashouts(data.cashouts || []);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Wallet sync error:', err);
    }
  };

  useEffect(() => {
    let id = localStorage.getItem('syde_hustle_account_id');
    if (!id) {
      id = 'sh-' + Math.random().toString(36).substring(2, 9).toLowerCase();
      localStorage.setItem('syde_hustle_account_id', id);
    }
    setAccountId(id);
    syncWallet(id);

    // Auto-sync every 8 seconds
    const timer = setInterval(() => syncWallet(id), 8000);
    return () => clearInterval(timer);
  }, []);

  const handleRestoreAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRestoreId.trim()) return;
    const cleanId = inputRestoreId.trim().toLowerCase();
    localStorage.setItem('syde_hustle_account_id', cleanId);
    setAccountId(cleanId);
    syncWallet(cleanId);
    setInputRestoreId('');
    setAlert({ type: 'success', text: `Switched to Account ID: ${cleanId}` });
  };

  const handleCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    setLoading(true);
    setAlert(null);

    try {
      const res = await fetch(`${WORKER_URL}/api/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingId: accountId,
          method,
          destination: destination.trim(),
          points: ptsAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: 'error', text: data.error || 'Withdrawal failed.' });
      } else {
        setAlert({
          type: 'success',
          text: `Request submitted! Ref: ${data.cashout.referenceId}. Payout queued to ${method}.`,
        });
        setPoints(data.balance);
        setCashouts(data.cashouts);
        setDestination('');
      }
    } catch (err) {
      setAlert({ type: 'error', text: 'Network connection issue. Please retry.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Notice Banner to Reduce Inquiries */}
      <div className="bg-slate-900/90 border border-emerald-500/20 p-4 rounded-xl text-xs text-slate-300 flex items-start space-x-3">
        <span className="text-emerald-400 text-base">ℹ</span>
        <div>
          <strong className="text-white block font-medium">How Tasks & Points Credit:</strong>
          Completed tasks report back within 2 to 15 minutes once the advertiser verifies the action. Keep this tab open; your balance auto-refreshes.
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Account ID:</span>
          <span className="text-xs font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {accountId}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(accountId);
              setAlert({ type: 'success', text: 'Account ID copied to clipboard!' });
            }}
            className="text-[10px] text-slate-400 hover:text-white underline"
          >
            Copy
          </button>
        </div>

        <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight">{points} PTS</div>
        <div className="text-slate-400 text-xs">Withdrawable Cash: ${(points / 1000).toFixed(2)} USD</div>

        <button
          onClick={() => syncWallet(accountId)}
          className="text-xs text-emerald-400 hover:underline pt-2 inline-block font-medium"
        >
          ↻ Refresh Balance Now
        </button>
      </div>

      {/* Cash Out Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-base font-bold text-white mb-4">Request Instant Cash Out</h2>

        {alert && (
          <div
            className={`mb-4 p-3 rounded-lg text-xs border ${
              alert.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {alert.text}
          </div>
        )}

        <form onSubmit={handleCashout} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Destination Gateway</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="MTN MoMo">MTN Mobile Money (MoMo)</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="PayPal">PayPal (Global)</option>
              <option value="Prepaid Airtime">Vodacom / MTN / Telkom Airtime</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {method === 'PayPal' ? 'PayPal Email Address' : 'Mobile Number (e.g. 0645007165)'}
            </label>
            <input
              type="text"
              required
              placeholder={method === 'PayPal' ? 'you@gmail.com' : '0645007165'}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Points to Cash Out (Min: 500 PTS)</label>
            <input
              type="number"
              min="500"
              step="50"
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
            {loading ? 'Submitting...' : `Cash Out ${(ptsAmount / 1000).toFixed(2)} USD`}
          </button>
        </form>
      </div>

      {/* Account Restore Form (Prevents complaints from users who cleared cookies) */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <details className="text-xs">
          <summary className="text-slate-400 cursor-pointer hover:text-white font-medium">
            Switched device or lost your points? Click to restore Account ID.
          </summary>
          <form onSubmit={handleRestoreAccount} className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Paste your old Account ID (e.g. sh-v4u4tx5)"
              value={inputRestoreId}
              onChange={(e) => setInputRestoreId(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <button
              type="submit"
              className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
            >
              Restore
            </button>
          </form>
        </details>
      </div>

      {/* Withdrawal Records */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Withdrawal Audit Log</h3>
        {cashouts.length === 0 ? (
          <p className="text-xs text-slate-500">No withdrawals on record.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {cashouts.map((c: any, i: number) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">
                    {c.method} ({c.destination})
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Ref: {c.referenceId || 'N/A'} • {new Date(c.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-rose-400">-${c.payoutUsd}</div>
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
