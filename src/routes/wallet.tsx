import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { BalanceHeader } from "@/components/BalanceHeader";
import { formatUsd, payoutMethods } from "@/lib/hustle-data";
import { wallet as walletApi } from "@/lib/api";

const ZAR_PER_USD = 19;
const MIN_WITHDRAW_USD = 2;

type Txn = {
  id?: string | number;
  label?: string;
  description?: string;
  amount_usd?: number;
  amount?: number;
  type?: string;
  source?: string;
  created_at?: string;
  at?: string;
};

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet & Payouts — Syde Hustle" },
      {
        name: "description",
        content:
          "Cash out your balance to MTN MoMo, M-Pesa, Airtel Money, a local bank account, airtime or a data bundle.",
      },
      { property: "og:title", content: "Wallet & Payouts — Syde Hustle" },
      {
        property: "og:description",
        content: "Withdraw straight to African mobile money wallets, airtime or data.",
      },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const [balanceUsd, setBalanceUsd] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [currency, setCurrency] = useState<"USD" | "ZAR">("USD");
  const [methodId, setMethodId] = useState(payoutMethods[0]!.id);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState(String(MIN_WITHDRAW_USD));
  const [busy, setBusy] = useState(false);

  const method = payoutMethods.find((m) => m.id === methodId)!;
  const amountUsd = Number(amount) || 0;

  const refresh = useCallback(async () => {
    try {
      const [b, t] = await Promise.all([walletApi.balance(), walletApi.transactions()]);
      setBalanceUsd(Number(b?.balance ?? 0));
      setTransactions(Array.isArray(t?.transactions) ? t.transactions : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load your wallet");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const display = (usd: number) =>
    currency === "USD"
      ? formatUsd(usd)
      : `R${(usd * ZAR_PER_USD).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\+?[0-9]{6,15}$/.test(destination.replace(/\s/g, ""))) {
      toast.error("Enter a valid mobile or account number");
      return;
    }
    if (amountUsd < MIN_WITHDRAW_USD) {
      toast.error(`Minimum withdrawal is ${formatUsd(MIN_WITHDRAW_USD)}`);
      return;
    }
    if (balanceUsd !== null && amountUsd > balanceUsd) {
      toast.error("Not enough balance");
      return;
    }
    setBusy(true);
    try {
      await walletApi.withdraw(amountUsd, method.id, destination);
      toast.success(`Payout of ${display(amountUsd)} queued to ${method.label}`);
      setDestination("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <BalanceHeader
        title="Wallet"
        subtitle={`Minimum payout ${formatUsd(MIN_WITHDRAW_USD)}. Rate used for display: $1 = R${ZAR_PER_USD}.`}
        balanceLabel={balanceUsd === null ? "—" : display(balanceUsd)}
        balanceHint={currency === "USD" ? "US dollars" : "South African rand"}
      >
        <div className="mt-4 inline-flex rounded-full bg-secondary/60 p-1">
          {(["USD", "ZAR"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              data-active={c === currency}
              className="rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors data-[active=true]:bg-gold data-[active=true]:text-gold-foreground"
            >
              {c === "USD" ? "$" : "R"}
            </button>
          ))}
        </div>
      </BalanceHeader>

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
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              inputMode="tel"
              placeholder="+233 55 123 4567"
              className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Amount in USD
            </span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
            <span className="mt-1.5 block text-xs text-gold">
              You receive {display(amountUsd)} via {method.provider}
            </span>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-gold-foreground shadow-gold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Request payout
          </button>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-gold" />
            Payouts are processed by Flutterwave (mobile money and bank) and Reloadly (airtime and
            data).
          </p>
        </form>
      </section>

      <section className="mt-8 px-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Activity
        </h2>
        <div className="mt-3 space-y-2">
          {transactions.length === 0 && (
            <p className="glass-card rounded-2xl p-4 text-sm text-muted-foreground">
              No activity yet. Complete a survey or an offer to start your ledger.
            </p>
          )}
          {transactions.map((entry, i) => {
            const value = Number(entry.amount_usd ?? entry.amount ?? 0);
            const when = entry.created_at ?? entry.at;
            return (
              <div
                key={entry.id ?? i}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {entry.label ?? entry.description ?? entry.type ?? "Transaction"}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {entry.type ?? entry.source ?? "ledger"}
                    {when ? ` · ${new Date(when).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${
                    value < 0 ? "text-muted-foreground" : "text-gold"
                  }`}
                >
                  {value < 0 ? (
                    <ArrowDownRight className="size-4" />
                  ) : (
                    <ArrowUpRight className="size-4" />
                  )}
                  {display(Math.abs(value))}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
