import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/')({
  component: IndexComponent,
});

function IndexComponent() {
  const [accountId, setAccountId] = useState('guest');

  useEffect(() => {
    let id = localStorage.getItem('syde_hustle_account_id');
    if (!id) {
      id = 'sh-' + Math.random().toString(36).substring(2, 9).toLowerCase();
      localStorage.setItem('syde_hustle_account_id', id);
    }
    setAccountId(id);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Complete Offers, Cash Out to PayPal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Account ID: <span className="font-mono text-emerald-400 font-bold">{accountId}</span> • 1,000 PTS = $1.00 USD.
          </p>
        </div>
        <Link
          to="/wallet"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition whitespace-nowrap"
        >
          View My Wallet →
        </Link>
      </div>

      {/* Instant Task Cards - Guaranteed to show immediately */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Task 1 */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between transition">
          <div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              +340 PTS ($0.34)
            </span>
            <h3 className="font-bold text-white text-sm mt-3">Enter for a Samsung Galaxy S25 Giveaway</h3>
          </div>
          <a
            href={`https://www.cpagrip.com/show.php?l=0&u=2554086&id=3&tracking_id=${accountId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block w-full text-center bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-lg text-xs transition"
          >
            Start Offer
          </a>
        </div>

        {/* Task 2 */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between transition">
          <div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              +300 PTS ($0.30)
            </span>
            <h3 className="font-bold text-white text-sm mt-3">Enter for the Latest Smart Watch</h3>
          </div>
          <a
            href={`https://www.cpagrip.com/show.php?l=0&u=2554086&id=6&tracking_id=${accountId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block w-full text-center bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-lg text-xs transition"
          >
            Start Offer
          </a>
        </div>

        {/* Task 3 */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between transition">
          <div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              +200 PTS ($0.20)
            </span>
            <h3 className="font-bold text-white text-sm mt-3">Get the Best Instant Rewards & Free Signup</h3>
          </div>
          <a
            href={`https://www.cpagrip.com/show.php?l=0&u=2554086&id=5&tracking_id=${accountId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block w-full text-center bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-lg text-xs transition"
          >
            Start Offer
          </a>
        </div>

        {/* Task 4 */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between transition">
          <div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              +130 PTS ($0.13)
            </span>
            <h3 className="font-bold text-white text-sm mt-3">Enter for Your PlayStation 5 Sweepstakes</h3>
          </div>
          <a
            href={`https://www.cpagrip.com/show.php?l=0&u=2554086&id=4&tracking_id=${accountId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block w-full text-center bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-lg text-xs transition"
          >
            Start Offer
          </a>
        </div>

        {/* Task 5 */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between transition">
          <div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              +100 PTS ($0.10)
            </span>
            <h3 className="font-bold text-white text-sm mt-3">Take the New Finance & Opinion Survey</h3>
          </div>
          <a
            href={`https://www.cpagrip.com/show.php?l=0&u=2554086&id=2&tracking_id=${accountId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block w-full text-center bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-lg text-xs transition"
          >
            Start Offer
          </a>
        </div>

        {/* Task 6 */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between transition">
          <div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              +100 PTS ($0.10)
            </span>
            <h3 className="font-bold text-white text-sm mt-3">Protect Your Personal Data & Quick Setup</h3>
          </div>
          <a
            href={`https://www.cpagrip.com/show.php?l=0&u=2554086&id=1&tracking_id=${accountId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block w-full text-center bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-lg text-xs transition"
          >
            Start Offer
          </a>
        </div>
      </div>
    </div>
  );
}
