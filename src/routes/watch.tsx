import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { BalanceHeader } from "@/components/BalanceHeader";
import { useWallet } from "@/lib/wallet-store";

const VIDEO_POINTS = 120;
const VIDEO_SECONDS = 30;

export const Route = createFileRoute("/watch")({
  head: () => ({
    meta: [
      { title: "Rewarded Videos — Syde Hustle" },
      {
        name: "description",
        content:
          "Watch a 30-second rewarded video and earn points whenever a survey disqualifies you.",
      },
      { property: "og:title", content: "Rewarded Videos — Syde Hustle" },
      {
        property: "og:description",
        content: "A 30-second video is worth points too — never leave empty handed.",
      },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { credit } = useWallet();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      setRemaining(null);
      credit({ label: "Rewarded video", points: VIDEO_POINTS, source: "video" });
      toast.success(`${VIDEO_POINTS} points credited`);
      return;
    }
    const t = setTimeout(() => setRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [remaining, credit]);

  const playing = remaining !== null;
  const progress = playing ? ((VIDEO_SECONDS - remaining!) / VIDEO_SECONDS) * 100 : 0;

  return (
    <div>
      <BalanceHeader
        title="Rewarded video"
        subtitle="No survey match? A short video still pays."
      />

      <section className="px-5">
        <div className="glass-card flex flex-col items-center rounded-3xl p-8 text-center">
          <PlayCircle className="size-14 text-gold" />
          <h2 className="mt-4 text-lg font-semibold">
            {playing ? `Playing… ${remaining}s left` : `Earn ${VIDEO_POINTS} points`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One 30-second premium video advert. Unlimited replays per day.
          </p>

          <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gold transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            disabled={playing}
            onClick={() => setRemaining(VIDEO_SECONDS)}
            className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:bg-secondary disabled:text-muted-foreground"
          >
            {playing ? "Watching…" : "Watch video"}
          </button>
        </div>
      </section>
    </div>
  );
}
