import { createFileRoute } from "@tanstack/react-router";
import { Clock3, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BalanceHeader } from "@/components/BalanceHeader";
import { FeedEmptyState, FeedSkeleton } from "@/components/FeedEmptyState";
import { launchTask, useFeed } from "@/lib/feed";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Syde Hustle — Earn Mobile Money From Surveys" },
      {
        name: "description",
        content:
          "Answer paid surveys, try app offers and cash out to MTN MoMo, M-Pesa, Airtel Money, airtime or data with Syde Hustle.",
      },
      { property: "og:title", content: "Syde Hustle — Earn Mobile Money From Surveys" },
      {
        property: "og:description",
        content: "Paid surveys and app offers that pay out to African mobile money wallets.",
      },
    ],
  }),
  component: SurveysPage,
});

function SurveysPage() {
  const { tasks, loading, isEmpty } = useFeed("survey");
  const { userId } = useSession();

  return (
    <div>
      <BalanceHeader
        title="Today's survey feed"
        subtitle="Fresh market-research questionnaires matched to your region."
      />

      <section className="space-y-3 px-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Available surveys
        </h2>

        {loading && <FeedSkeleton />}
        {isEmpty && <FeedEmptyState />}

        {tasks.map((survey) => (
          <article
            key={survey.id}
            className="glass-card rounded-2xl p-4 transition-transform active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold leading-snug">{survey.title}</h3>
                {survey.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{survey.description}</p>
                )}
                {survey.meta && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" /> {survey.meta}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-xl bg-gold px-3 py-1.5 text-sm font-bold text-gold-foreground shadow-gold">
                +{survey.points}
              </span>
            </div>

            <button
              onClick={() => {
                if (!survey.url) {
                  toast.error("This survey has no link yet");
                  return;
                }
                if (!userId) {
                  toast.error("Sign in again — we need your account id to track this survey");
                  return;
                }
                launchTask(survey.url, userId);
              }}
              className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start survey
            </button>
          </article>
        ))}

        {!loading && !isEmpty && (
          <p className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" />
            Disqualified from a survey? Watch a rewarded video on the Watch tab instead.
          </p>
        )}
      </section>
    </div>
  );
}
