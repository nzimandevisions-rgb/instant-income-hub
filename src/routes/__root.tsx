import { Outlet, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const WORKER_URL = 'https://syde-hustle-proxy.velley-velley.workers.dev';

export function getOrCreateAccountId(): string {
  if (typeof window === 'undefined') return 'SH-V4U4TX5';
  let id = localStorage.getItem('syde_hustle_account_id');
  if (!id) {
    id = 'SH-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    localStorage.setItem('syde_hustle_account_id', id);
  }
  return id;
}

export function RootComponent() {
  const [accountId, setAccountId] = useState<string>('');
  const [points, setPoints] = useState<number>(0);

  const fetchBalance = async (id: string) => {
    try {
      const res = await fetch(`${WORKER_URL}/api/wallet?tracking_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points || 0);
      }
    } catch (e) {
      console.error('Failed to sync wallet', e);
    }
  };

  useEffect(() => {
    const id = getOrCreateAccountId();
    setAccountId(id);
    fetchBalance(id);

    const handleFocus = () => fetchBalance(id);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="font-bold text-lg text-emerald-400 tracking-tight">
            Live Tasks Online
          </Link>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 font-mono">
            ID: {accountId}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/wallet"
            className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            <span className="text-xs font-semibold uppercase tracking-wider">Wallet:</span>
            <span className="font-mono font-bold">{points} PTS</span>
            <span className="text-xs text-slate-400">(${(points / 1000).toFixed(2)})</span>
          </Link>
          <Link
            to="/wallet"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-sm transition"
          >
            Cash Out
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © 2026 Syde Hustle. Instant cashouts to PayPal, MTN MoMo, M-Pesa & Airtime.
      </footer>
    </div>
  );
}
