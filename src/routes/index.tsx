import { useEffect, useState } from 'react';

const WORKER_URL = 'https://syde-hustle-proxy.velley-velley.workers.dev';

export function IndexComponent() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All Tasks');
  const [accountId, setAccountId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('syde_hustle_account_id');
    if (!id) {
      id = 'SH-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      localStorage.setItem('syde_hustle_account_id', id);
    }
    setAccountId(id);

    fetch(`${WORKER_URL}/api/offers?tracking_id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.offers) setTasks(data.offers);
      })
      .catch((err) => console.error('Error fetching offers:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredTasks = tasks.filter((task) =>
    task.title?.toLowerCase().includes(search.toLowerCase()) ||
    task.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/20 p-6 rounded-2xl">
        <h1 className="text-2xl font-extrabold text-white">Complete Tasks, Earn Real Cash</h1>
        <p className="text-slate-400 text-sm mt-1">
          Choose an offer below. Earn points and cash out instantly to PayPal, MTN MoMo, M-Pesa, or Airtime.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium">
          <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400">Verified Tasks:</span> <strong className="text-white">{tasks.length} Live</strong>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400">Payouts:</span> <strong className="text-emerald-400">PayPal & MTN MoMo</strong>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex space-x-2">
          {['All Tasks', 'Apps', 'Surveys', 'Sign-ups'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search surveys, apps, quick sign-ups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading verified tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
          No offers available right now. Check back shortly.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between transition group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                    HOT
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    +{task.points || 100} PTS (${((task.points || 100) / 1000).toFixed(2)})
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-3 group-hover:text-emerald-300 transition">
                  {task.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
              </div>

              <a
                href={task.offerlink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full text-center bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white text-xs font-bold py-2 rounded-lg transition"
              >
                Start Task & Earn
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
