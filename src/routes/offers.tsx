import { createFileRoute } from "@tanstack/react-router";
import { Download, Flame } from "lucide-react";
import { toast } from "sonner";
import { BalanceHeader } from "@/components/BalanceHeader";
import { FeedEmptyState, FeedSkeleton } from "@/components/FeedEmptyState";
import { launchTask, useFeed } from "@/lib/feed";
import { useSession } from "@/lib/use-session";

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
  const { tasks, loading, isEmpty } = useFeed("offer");
  const { userId } = useSession();

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

        {loading && <FeedSkeleton />}
        {isEmpty && <FeedEmptyState />}

        {tasks.map((offer) => (
          <article key={offer.id} className="glass-card rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-base font-semibold">
                  {offer.title}
                  {offer.hot && <Flame className="size-4 text-gold" />}
                </h3>
                {offer.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
                )}
                {offer.meta && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Download className="size-3.5" /> {offer.meta}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-xl bg-gold px-3 py-1.5 text-sm font-bold text-gold-foreground shadow-gold">
                +{offer.points}
              </span>
            </div>

            <button
              onClick={() => {
                if (!offer.url) {
                  toast.error("This offer has no link yet");
                  return;
                }
                if (!userId) {
                  toast.error("Sign in again — we need your account id to track this offer");
                  return;
                }
                launchTask(offer.url, userId);
              }}
              className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Claim offer
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
