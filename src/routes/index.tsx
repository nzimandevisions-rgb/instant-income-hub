import { createFileRoute } from "@tanstack/react-router";
import { Clock3, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BalanceHeader } from "@/components/BalanceHeader";
import { surveys } from "@/lib/hustle-data";
import { useWallet } from "@/lib/wallet-store";

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
  const { completed, credit } = useWallet();

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

        {surveys.map((survey) => {
          const done = completed.includes(survey.id);
          return (
            <article
              key={survey.id}
              className="glass-card rounded-2xl p-4 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {survey.network} · {survey.category}
                  </p>
                  <h3 className="mt-1 text-base font-semibold leading-snug">{survey.title}</h3>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" /> about {survey.minutes} min
                  </p>
                </div>
                <span className="shrink-0 rounded-xl bg-gold px-3 py-1.5 text-sm font-bold text-gold-foreground shadow-gold">
                  +{survey.points}
                </span>
              </div>

              <button
                disabled={done}
                onClick={() => {
                  const ok = credit({
                    label: survey.title,
                    points: survey.points,
                    source: "survey",
                    taskId: survey.id,
                  });
                  if (ok) toast.success(`${survey.points} points credited`);
                }}
                className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:bg-secondary disabled:text-muted-foreground"
              >
                {done ? "Completed" : "Start survey"}
              </button>
            </article>
          );
        })}

        <p className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" />
          Disqualified from a survey? Watch a rewarded video on the Watch tab instead.
        </p>
      </section>
    </div>
  );
}
