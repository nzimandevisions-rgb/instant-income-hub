import { Compass } from "lucide-react";

export function FeedEmptyState() {
  return (
    <div className="glass-card flex flex-col items-center rounded-3xl p-8 text-center">
      <Compass className="size-10 text-gold" />
      <p className="mt-4 text-sm text-muted-foreground">
        No custom match profiles available for your region right now. Check back soon!
      </p>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass-card h-32 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}
