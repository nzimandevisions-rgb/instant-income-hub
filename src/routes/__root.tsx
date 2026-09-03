import type { ReactNode } from 'react';
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import appCss from '../styles.css?url'; // Required by TanStack Start to emit stylesheet URL

const WORKER_URL = 'https://syde-hustle-proxy.velley-velley.workers.dev';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Syde Hustle - Live Tasks & PayPal Cashouts' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'icon',
        href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💸</text></svg>",
      },
    ],
  }),
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
    <RootDocument>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
        {/* Navigation Bar */}
        <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg shadow-black/20">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform font-bold text-sm shadow-inner">
              $
            </div>
            <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight group-hover:text-emerald-400 transition-colors">
              Syde Hustle
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <Link
              to="/wallet"
              className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-emerald-400 transition shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono font-bold text-sm">{points} PTS</span>
              <span className="text-xs text-slate-400 font-medium">(${(points / 1000).toFixed(2)})</span>
            </Link>

            <Link
              to="/wallet"
              className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20"
            >
              PayPal Wallet
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <p>© 2026 Syde Hustle. Instant PayPal Payouts & Verified Tasks.</p>
        </footer>
      </div>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
