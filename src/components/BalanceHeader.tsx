import { Link, useNavigate } from "@tanstack/react-router";
import { Flame, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useWallet } from "@/lib/wallet-store";
import { formatUsd, pointsToUsd } from "@/lib/hustle-data";
import { clearToken } from "@/lib/api";

export function BalanceHeader({
  title,
  subtitle,
  balanceLabel,
  balanceHint,
  children,
}: {
  title: string;
  subtitle: string;
  balanceLabel?: string;
  balanceHint?: string;
  children?: ReactNode;
}) {
  const { balance, lifetime } = useWallet();
  const navigate = useNavigate();

  const logout = () => {
    clearToken();
    navigate({ to: "/auth" });
  };

  return (
    <header className="px-5 pt-8 pb-6">
      <div className="flex items-center justify-between gap-2">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          Syde <span className="text-gradient-gold">Hustle</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <Flame className="size-3.5 text-gold" />
            {lifetime.toLocaleString()} pts
          </span>
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="inline-flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      <div className="glass-card mt-6 rounded-3xl p-5 shadow-glow">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Available balance
        </p>
        <div className="mt-2 flex items-end gap-3">
          <span className="font-display text-4xl font-extrabold">
            {balanceLabel ?? balance.toLocaleString()}
          </span>
          <span className="pb-1.5 text-sm text-gold">
            {balanceHint ?? `≈ ${formatUsd(pointsToUsd(balance))}`}
          </span>
        </div>
        {children}
        <div className="mt-4">
          <h1 className="text-base font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
