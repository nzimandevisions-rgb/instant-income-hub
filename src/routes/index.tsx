import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const TASKS = [
  {
    id: 'task_1',
    title: 'Enter for a Samsung Galaxy S25 Giveaway',
    points: 340,
    rewardUsd: '$0.34',
    tag: 'HOT',
    baseLink: 'https://www.cpagrip.com/show.php?l=0&u=2554086&id=3',
  },
  {
    id: 'task_2',
    title: 'Enter for the Latest Smart Watch',
    points: 300,
    rewardUsd: '$0.30',
    tag: 'POPULAR',
    baseLink: 'https://www.cpagrip.com/show.php?l=0&u=2554086&id=6',
  },
  {
    id: 'task_3',
    title: 'Get the Best Instant Rewards & Free Signup',
    points: 200,
    rewardUsd: '$0.20',
    tag: 'EASY',
    baseLink: 'https://www.cpagrip.com/show.php?l=0&u=2554086&id=5',
  },
  {
    id: 'task_4',
    title: 'Enter for Your PlayStation 5 Sweepstakes',
    points: 130,
    rewardUsd: '$0.13',
    tag: 'FAST',
    baseLink: 'https://www.cpagrip.com/show.php?l=0&u=2554086&id=4',
  },
  {
    id: 'task_5',
    title: 'Take the New Finance & Opinion Survey',
    points: 100,
    rewardUsd: '$0.10',
    tag: 'SURVEY',
    baseLink: 'https://www.cpagrip.com/show.php?l=0&u=2554086&id=2',
  },
  {
    id: 'task_6',
    title: 'Protect Your Personal Data & Quick Setup',
    points: 100,
    rewardUsd: '$0.10',
    tag: 'INSTANT',
    baseLink: 'https://www.cpagrip.com/show.php?l=0&u=2554086&id=1',
  },
];

export const Route = createFileRoute('/')({
  component: IndexComponent,
});

function IndexComponent() {
  const [accountId, setAccountId] = useState('');

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
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 p-6 sm:p-8 rounded-2xl shadow-xl shadow-black/40">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-400 mb-2">
              <span>● Live Verified Tasks</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Complete Offers, Cash Out to PayPal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Account ID:{' '}
              <span className="font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {accountId || 'Loading...'}
              </span>{' '}
              • 1,000 PTS = $1.00 USD
            </p>
          </div>

          <Link
            to="/wallet"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-transform active:scale-95 whitespace-nowrap shadow-lg shadow-emerald-500/20"
          >
            View My Wallet →
          </Link>
        </div>
      </div>

      {/* Styled Grid of Tasks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TASKS.map((task) => (
          <div
            key={task.id}
            className="bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/20 group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {task.tag}
                </span>
                <span className="text-xs font-mono font-black text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80">
                  +{task.points} PTS ({task.rewardUsd})
                </span>
              </div>
              <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                {task.title}
              </h3>
            </div>

            <a
              href={`${task.baseLink}&tracking_id=${accountId || 'guest'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full text-center bg-slate-800/90 hover:bg-emerald-500 hover:text-slate-950 active:scale-98 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md"
            >
              Start Offer & Earn
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
