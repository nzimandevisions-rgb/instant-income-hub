import { createRootRoute, Outlet, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const WORKER_URL = 'https://syde-hustle-proxy.velley-velley.workers.dev';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const [points, setPoints] = useState(0);

  const fetchBalance = async () => {
    if (typeof window === 'undefined') return;
    const id = localStorage.getItem('syde_hustle_account_id') || 'guest';
    try {
      const res = await fetch(`${WORKER_URL}/api/wallet?tracking_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points || 0);
      }
    } catch (e) {}
  };

  useEffect(() => {
    let id = localStorage.getItem('syde_hustle_account_id');
    if (!id) {
      id = 'sh-' + Math.random().toString(36).substring(2, 9).toLowerCase();
      localStorage.setItem('syde_hustle_account_id', id);
    }
    fetchBalance();

    const onFocus = () => fetchBalance();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link to="/offers" className="font-extrabold text-xl text-emerald-400 tracking-tight">
          Syde Hustle
        </Link>

        <nav className="flex items-center space-x-4">
          <Link
            to="/offers"
            className="text-xs font-semibold text-slate-300 hover:text-emerald-400 transition"
          >
            Offers
          </Link>

          <Link
            to="/wallet"
            className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-emerald-400 hover:border-emerald-500/40 transition"
          >
            <span className="font-mono font-bold text-xs">{points} PTS</span>
            <span className="text-[10px] text-slate-400">(${(points / 1000).toFixed(2)})</span>
          </Link>

          <Link
            to="/wallet"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition"
          >
            PayPal Wallet
          </Link>
        </nav>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Simple Clean Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        © 2026 Syde Hustle • <Link to="/offers" className="hover:underline">Offers</Link> • <Link to="/wallet" className="hover:underline">PayPal Wallet</Link>
      </footer>
    </div>
  );
}
