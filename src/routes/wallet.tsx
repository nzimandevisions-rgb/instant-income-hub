import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Wallet, 
  ArrowUpRight, 
  Coins, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  Smartphone, 
  CreditCard, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

interface PayoutMethod {
  id: string;
  name: string;
  category: "mobile_money" | "bank" | "airtime" | "digital";
  minPoints: number;
  icon: string;
  description: string;
}

const PAYOUT_METHODS: PayoutMethod[] = [
  {
    id: "momo",
    name: "MTN MoMo",
    category: "mobile_money",
    minPoints: 5000,
    icon: "📱",
    description: "Instant cashout to your MTN Mobile Money wallet",
  },
  {
    id: "mpesa",
    name: "Vodacom M-Pesa",
    category: "mobile_money",
    minPoints: 5000,
    icon: "📲",
    description: "Direct transfer to your M-Pesa phone number",
  },
  {
    id: "eft",
    name: "Bank EFT / Instant Transfer",
    category: "bank",
    minPoints: 10000,
    icon: "🏦",
    description: "Capitec, FNB, Standard Bank, Nedbank & others",
  },
  {
    id: "airtime",
    name: "Airtime & Data Voucher",
    category: "airtime",
    minPoints: 2000,
    icon: "📶",
    description: "Prepaid recharge voucher for all major networks",
  },
  {
    id: "paypal",
    name: "PayPal (USD)",
    category: "digital",
    minPoints: 5000,
    icon: "💳",
    description: "Cash out in USD directly to your PayPal account",
  },
];

export function WalletPage() {
  const [visitorId, setVisitorId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [points, setPoints] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<PayoutMethod | null>(null);
  const [recipientNumber, setRecipientNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize guest wallet & load saved balance
  useEffect(() => {
    let id = localStorage.getItem("sh_visitor_id");
    if (!id) {
      id = "SH-" + Math.random().toString(36).substring(2, 9).toUpperCase();
      localStorage.setItem("sh_visitor_id", id);
    }
    setVisitorId(id);

    const savedPts = parseInt(localStorage.getItem("sh_wallet_points") || "0", 10);
    setPoints(savedPts);
  }, []);

  const copyId = () => {
    if (!visitorId) return;
    navigator.clipboard.writeText(visitorId);
    setCopied(true);
    toast.success("Account ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;

    if (points < selectedMethod.minPoints) {
      toast.error(
        `Minimum payout for ${selectedMethod.name} is ${selectedMethod.minPoints.toLocaleString()} PTS`
      );
      return;
    }

    if (!recipientNumber.trim()) {
      toast.error("Please provide your phone number or account details");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSelectedMethod(null);
      setRecipientNumber("");
      toast.success("Payout request submitted! Processing takes 12-24 hours.");
    }, 1200);
  };

  const usdValue = (points / 1000).toFixed(2);
  const zarValue = (points * 0.0185).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Wallet Header & Device ID */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-br from-emerald-950/40 via-card to-card p-6 rounded-2xl border border-emerald-500/20 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active Instant Wallet
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My SydeHustle Wallet
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Points are automatically secured to your device. No password or email needed.
          </p>
        </div>

        {/* Visitor Device ID Badge */}
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-border">
          <div className="text-xs">
            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
              Account ID
            </span>
            <span className="font-mono font-semibold text-foreground">
              {visitorId || "Loading..."}
            </span>
          </div>
          <button
            type="button"
            onClick={copyId}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            title="Copy Account ID"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Balance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Available Points
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-foreground">
              {points.toLocaleString()}
            </span>
            <span className="text-sm text-amber-400 font-medium ml-1.5">PTS</span>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Estimated Value
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-foreground">
              ${usdValue} <span className="text-xs text-muted-foreground font-normal">USD</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-1">
              ≈ R{zarValue} ZAR
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payout Threshold
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-semibold text-foreground">
              From 2,000 PTS
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Airtime from R30 / Cash from $5.00
            </p>
          </div>
        </div>
      </div>

      {/* Cashout Methods Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Available Payout Methods</h2>
            <p className="text-xs text-muted-foreground">
              Withdraw points directly to African mobile wallets, instant EFT, or airtime
            </p>
          </div>
          <Link
            to="/"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Earn more points <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PAYOUT_METHODS.map((method) => {
            const canAfford = points >= method.minPoints;
            return (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedMethod?.id === method.id
                    ? "border-emerald-500 bg-emerald-500/5 shadow-md"
                    : "border-border bg-card hover:border-emerald-500/40 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {method.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                </div>
                <div className="text-right pl-3 shrink-0">
                  <span className="text-xs font-semibold block text-foreground">
                    {method.minPoints.toLocaleString()} PTS
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${
                      canAfford
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {canAfford ? "Ready" : "Locked"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payout Request Modal / Form */}
      {selectedMethod && (
        <div className="bg-card p-6 rounded-2xl border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedMethod.icon}</span>
              <div>
                <h3 className="font-semibold text-foreground">
                  Cash Out via {selectedMethod.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Min requirement: {selectedMethod.minPoints.toLocaleString()} PTS
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMethod(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleRequestPayout} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                {selectedMethod.category === "mobile_money"
                  ? "Mobile Money Phone Number"
                  : selectedMethod.category === "airtime"
                  ? "Recharge Phone Number"
                  : selectedMethod.category === "bank"
                  ? "Bank Name & Account Number"
                  : "PayPal Email Address"}
              </label>
              <input
                type="text"
                required
                value={recipientNumber}
                onChange={(e) => setRecipientNumber(e.target.value)}
                placeholder={
                  selectedMethod.category === "mobile_money" || selectedMethod.category === "airtime"
                    ? "+27 83 123 4567"
                    : selectedMethod.category === "bank"
                    ? "Capitec - 1234567890"
                    : "yourname@example.com"
                }
                className="w-full bg-background border border-border px-3.5 py-2.5 rounded-xl text-sm text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Your Balance: <strong>{points.toLocaleString()} PTS</strong>
              </span>
              <button
                type="submit"
                disabled={points < selectedMethod.minPoints || isSubmitting}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting
                  ? "Submitting..."
                  : points < selectedMethod.minPoints
                  ? "Insufficient Points"
                  : "Submit Cashout"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Action to Earn Points */}
      <div className="text-center p-8 rounded-2xl bg-gradient-to-b from-card to-background border border-border">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-foreground">Need More Points?</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
          Complete verified surveys, download free apps, or test quick games to boost your wallet balance.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-md"
        >
          Browse Tasks Now <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
