import { createFileRoute } from "@tanstack/react-router";
import { Download, Flame } from "lucide-react";
import { toast } from "sonner";
import { BalanceHeader } from "@/components/BalanceHeader";
import { offers } from "@/lib/hustle-data";
import { useWallet } from "@/lib/wallet-store";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "App Offers — Syde Hustle" },
      {
        name: "description",
        content:
          "High-paying mobile game and app offers. Install, play and earn points you can cash out as mobile money.",
      },
      { property: "og:title", content: "App Offers — Syde Hustle" },
      {
        property: "og:description",
        content: "Install apps, hit a milestone, get paid in points worth real mobile money.",
      },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { completed, credit } = useWallet();

  return (
    <div>
      <BalanceHeader
        title="Discovery panel"
        subtitle="Big-ticket app and game offers refreshed through the day."
      />

      <section className="space-y-3 px-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Top offers
        </h2>

        {offers.map((offer) => {
          const done = completed.includes(offer.id);
          return (
            <article key={offer.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {offer.network}
                  </p>
                  <h3 className="mt-1 flex items-center gap-2 text-base font-semibold">
                    {offer.title}
                    {offer.hot && <Flame className="size-4 text-gold" />}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{offer.task}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Download className="size-3.5" /> {offer.size}
                  </p>
                </div>
                <span className="shrink-0 rounded-xl bg-gold px-3 py-1.5 text-sm font-bold text-gold-foreground shadow-gold">
                  +{offer.points}
                </span>
              </div>

              <button
                disabled={done}
                onClick={() => {
                  const ok = credit({
                    label: offer.title,
                    points: offer.points,
                    source: "offer",
                    taskId: offer.id,
                  });
                  if (ok) toast.success(`${offer.points} points credited`);
                }}
                className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:bg-secondary disabled:text-muted-foreground"
              >
                {done ? "Reward credited" : "Claim offer"}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
