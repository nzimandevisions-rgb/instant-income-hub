import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const WORKER_URL = 'https://syde-hustle-proxy.velley-velley.workers.dev';

export const Route = createFileRoute('/')({
  component: IndexComponent,
});

function IndexComponent() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let id = localStorage.getItem('syde_hustle_account_id');
    if (!id) {
      id = 'sh-' + Math.random().toString(36).substring(2, 9).toLowerCase();
      localStorage.setItem('syde_hustle_account_id', id);
    }

    fetch(`${WORKER_URL}/api/offers?tracking_id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.offers) setOffers(data.offers);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Complete Offers, Cash Out to PayPal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Points update automatically after completing an offer. 1,000 PTS = $1.00 USD.
          </p>
        </div>
        <Link
          to="/wallet"
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition whitespace-nowrap"
        >
          View My Wallet →
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Loading available offers...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
          No offers available for your region right now. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {offers.map((offer, i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-xl p-5 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    +{offer.points} PTS (${(offer.points / 1000).toFixed(2)})
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm mt-3">{offer.title}</h3>
              </div>

              <a
                href={offer.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block w-full text-center bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-lg text-xs transition"
              >
                Start Offer
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
