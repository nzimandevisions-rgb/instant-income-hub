import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { BalanceHeader } from "@/components/BalanceHeader";
import {
  MIN_WITHDRAW_POINTS,
  formatUsd,
  payoutMethods,
  pointsToUsd,
} from "@/lib/hustle-data";
import { useWallet } from "@/lib/wallet-store";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet & Payouts — Syde Hustle" },
      {
        name: "description",
        content:
          "Cash out your points to MTN MoMo, M-Pesa, Airtel Money, a local bank account, airtime or a data bundle.",
      },
      { property: "og:title", content: "Wallet & Payouts — Syde Hustle" },
      {
        property: "og:description",
        content: "Withdraw points straight to African mobile money wallets, airtime or data.",
      },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { balance, ledger, withdraw } = useWallet();
  const [methodId, setMethodId] = useState(payoutMethods[0]!.id);
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState(String(MIN_WITHDRAW_POINTS));

  const method = payoutMethods.find((m) => m.id === methodId)!;
  const points = Number(amount) || 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\+?[0-9]{6,15}$/.test(account.replace(/\s/g, ""))) {
      toast.error("Enter a valid mobile or account number");
      return;
    }
    if (points < MIN_WITHDRAW_POINTS) {
      toast.error(`Minimum withdrawal is ${MIN_WITHDRAW_POINTS.toLocaleString()} points`);
      return;
    }
    if (points > balance) {
      toast.error("Not enough points in your balance");
      return;
    }
    withdraw({ label: `${method.label} payout`, points });
    setAccount("");
    toast.success(`Payout of ${formatUsd(pointsToUsd(points))} queued to ${method.label}`);
  };

  return (
    <div>
      <BalanceHeader
        title="Wallet"
        subtitle={`1,000 points = ${formatUsd(1)}. Minimum payout ${MIN_WITHDRAW_POINTS.toLocaleString()} points.`}
      />

      <section className="px-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Withdraw
        </h2>

        <form onSubmit={submit} className="glass-card mt-3 space-y-4 rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-2">
            {payoutMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethodId(m.id)}
                data-active={m.id === methodId}
                className="rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-left text-sm transition-colors data-[active=true]:border-gold data-[active=true]:bg-secondary"
              >
                <span className="block font-semibold">{m.label}</span>
                <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {method.kind === "bank" ? "Account number" : "Mobile number"}
            </span>
            <input
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              inputMode="tel"
              placeholder="+233 55 123 4567"
              className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Points to withdraw
            </span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
            <span className="mt-1.5 block text-xs text-gold">
              You receive {formatUsd(pointsToUsd(points))} via {method.provider}
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-gold py-3 text-sm font-bold text-gold-foreground shadow-gold transition-opacity hover:opacity-90"
          >
            Request payout
          </button>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-gold" />
            Payouts are processed by Flutterwave (mobile money and bank) and Reloadly (airtime and
            data). Live processing switches on once your API keys are added.
          </p>
        </form>
      </section>

      <section className="mt-8 px-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Activity
        </h2>
        <div className="mt-3 space-y-2">
          {ledger.length === 0 && (
            <p className="glass-card rounded-2xl p-4 text-sm text-muted-foreground">
              No activity yet. Complete a survey or an offer to start your ledger.
            </p>
          )}
          {ledger.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface/60 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{entry.label}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {entry.source} · {new Date(entry.at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-sm font-semibold ${
                  entry.points < 0 ? "text-muted-foreground" : "text-gold"
                }`}
              >
                {entry.points < 0 ? (
                  <ArrowDownRight className="size-4" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )}
                {Math.abs(entry.points).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
