import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { useWallet } from "@/lib/wallet-store";
import { formatUsd, pointsToUsd } from "@/lib/hustle-data";

export function BalanceHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { balance, lifetime } = useWallet();

  return (
    <header className="px-5 pt-8 pb-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          Syde <span className="text-gradient-gold">Hustle</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
          <Flame className="size-3.5 text-gold" />
          {lifetime.toLocaleString()} pts earned
        </span>
      </div>

      <div className="glass-card mt-6 rounded-3xl p-5 shadow-glow">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Available balance
        </p>
        <div className="mt-2 flex items-end gap-3">
          <span className="font-display text-4xl font-extrabold">
            {balance.toLocaleString()}
          </span>
          <span className="pb-1.5 text-sm text-gold">≈ {formatUsd(pointsToUsd(balance))}</span>
        </div>
        <div className="mt-4">
          <h1 className="text-base font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
