import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Coins,
  Flame,
  Sparkles,
  ExternalLink,
  X,
  Search,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Globe,
  Wallet,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

// Live Feed Configuration (Hidden from customers)
const FEED_USER_ID = "2554086";
const FEED_KEY = "91dfbd4b76b0b246e74046864d815b6e";

export interface TaskOffer {
  id: string;
  title: string;
  description: string;
  payout: number;
  points: number;
  usdValue: string;
  zarValue: string;
  offerlink: string;
  offerphoto: string;
  category: string;
  country: string;
  device: string;
  isHot?: boolean;
}

export function Dashboard() {
  const [offers, setOffers] = useState<TaskOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [visitorId, setVisitorId] = useState("");
  
  // Live Offer Popup Modal state
  const [activePopupOffer, setActivePopupOffer] = useState<TaskOffer | null>(null);

  // Initialize tracking sub-ID
  useEffect(() => {
    let id = localStorage.getItem("sh_visitor_id");
    if (!id) {
      id = "SH-" + Math.random().toString(36).substring(2, 9).toUpperCase();
      localStorage.setItem("sh_visitor_id", id);
    }
    setVisitorId(id);
  }, []);

  // Fetch live tasks directly from the feed
  const loadLiveOffers = async (isManual = false) => {
    setLoading(true);
    const subid = visitorId || "SH-GUEST";

    try {
      // 1. Query auto-detected IP feed
      const primaryUrl = `https://www.cpagrip.com/common/offer_feed_json.php?user_id=${FEED_USER_ID}&key=${FEED_KEY}&tracking_id=${encodeURIComponent(subid)}`;
      
      let res = await fetch(primaryUrl);
      let data = await res.json();
      let rawList: any[] = data?.offers || [];

      // 2. If visitor region has no campaigns, automatically fetch South Africa (ZA) & Global inventory
      if (!rawList || rawList.length === 0) {
        const fallbackUrl = `https://www.cpagrip.com/common/offer_feed_json.php?user_id=${FEED_USER_ID}&key=${FEED_KEY}&country=ZA&tracking_id=${encodeURIComponent(subid)}`;
        const fallbackRes = await fetch(fallbackUrl);
        const fallbackData = await fallbackRes.json();
        rawList = fallbackData?.offers || [];
      }

      // 3. Normalize into SydeHustle task structure
      const normalized: TaskOffer[] = rawList.map((item: any, idx: number) => {
        const rawPayout = parseFloat(item.payout || "0.85") || 0.85;
        // Payout conversion: $1.00 = 1,000 Points with high user reward
        const points = Math.max(100, Math.round(rawPayout * 1000));
        const usd = (points / 1000).toFixed(2);
        const zar = (points * 0.0185).toFixed(2);

        let category = "Instant Task";
        const typeStr = (item.offer_type || "").toLowerCase();
        if (typeStr.includes("mobile") || typeStr.includes("install")) category = "Mobile App";
        else if (typeStr.includes("survey")) category = "Paid Survey";
        else if (typeStr.includes("pin") || typeStr.includes("sms")) category = "Fast Reward";
        else if (typeStr.includes("email") || typeStr.includes("zip")) category = "Quick Sign-up";

        return {
          id: item.offer_id ? String(item.offer_id) : `task_${idx}`,
          title: item.title || "Complete Verified Task",
          description: item.description || "Follow the prompt instructions on the target page to earn instant points.",
          payout: rawPayout,
          points,
          usdValue: usd,
          zarValue: zar,
          offerlink: item.offerlink || "#",
          offerphoto: item.offerphoto || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80",
          category,
          country: item.accepted_countries || "Global",
          device: (item.offer_type || "").toLowerCase().includes("mobile") ? "Mobile Only" : "All Devices",
          isHot: rawPayout >= 1.0 || idx < 3,
        };
      });

      setOffers(normalized);
      if (isManual) toast.success(`Refreshed ${normalized.length} active tasks`);
    } catch (err) {
      console.error("[Dashboard] Error loading feed:", err);
      toast.error("Could not refresh tasks. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveOffers();
  }, [visitorId]);

  // Filters
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchesSearch =
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat =
        selectedCategory === "all" ||
        offer.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [offers, searchQuery, selectedCategory]);

  // Handle claiming / launching task
  const handleLaunchOffer = (offer: TaskOffer) => {
    // Add subid tracking parameter
    let finalUrl = offer.offerlink;
    if (visitorId && !finalUrl.includes("tracking_id=")) {
      finalUrl += (finalUrl.includes("?") ? "&" : "?") + `tracking_id=${encodeURIComponent(visitorId)}`;
    }
    window.open(finalUrl, "_blank", "noopener,noreferrer");
    toast.success("Task opened! Complete instructions to receive your points.");
    setActivePopupOffer(null);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/60 via-card to-card p-6 border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Reward Tasks
              </span>
              <span className="text-xs text-muted-foreground">
                Account ID: <strong className="font-mono text-foreground">{visitorId || "Loading..."}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Complete Tasks, Earn Real Money
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mt-1.5">
              Select verified tasks below. Points are credited immediately to your wallet and can be cashed out via <strong>PayPal</strong>, <strong>MTN MoMo</strong>, <strong>M-Pesa</strong>, or <strong>Airtime</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/wallet"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-md"
            >
              <Wallet className="w-4 h-4" />
              Cash Out
            </Link>
            <button
              type="button"
              onClick={() => loadLiveOffers(true)}
              className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh Tasks"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Verified Tasks</span>
              <span className="text-sm font-bold text-foreground">{offers.length} Online</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Top Reward</span>
              <span className="text-sm font-bold text-foreground">
                {offers.length > 0 ? `${Math.max(...offers.map(o => o.points)).toLocaleString()} PTS` : "1,500+ PTS"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Payout Speed</span>
              <span className="text-sm font-bold text-foreground">Instant / Same Day</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search surveys, apps, quick tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border pl-10 pr-4 py-2.5 rounded-xl text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Tasks" },
            { id: "Mobile App", label: "Apps" },
            { id: "Paid Survey", label: "Surveys" },
            { id: "Quick Sign-up", label: "Sign-ups" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="bg-card border border-border p-5 rounded-2xl space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-muted/60 rounded" />
              <div className="h-9 bg-muted rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-12 px-4 bg-card rounded-2xl border border-border">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-foreground">No tasks match your search</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Try choosing a different category or click below to reload all regional tasks.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              loadLiveOffers(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => setActivePopupOffer(offer)}
              className="group bg-card border border-border hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer relative"
            >
              <div>
                {/* Card Top: Thumbnail + Badge */}
                <div className="flex items-start gap-3">
                  <img
                    src={offer.offerphoto}
                    alt={offer.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80";
                    }}
                    className="w-12 h-12 rounded-xl object-cover border border-border/80 shrink-0 bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {offer.category}
                      </span>
                      {offer.isHot && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> HOT
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-emerald-400 transition-colors line-clamp-1 mt-1">
                      {offer.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                  {offer.description}
                </p>
              </div>

              {/* Bottom Row: Reward + Popup Trigger */}
              <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block text-[10px] uppercase tracking-wider">
                    Reward
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-extrabold text-emerald-400">
                      +{offer.points.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      PTS (${offer.usdValue})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePopupOffer(offer);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all flex items-center gap-1"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* LIVE OFFER POPUP MODAL                                    */}
      {/* ========================================================= */}
      {activePopupOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-card border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActivePopupOffer(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Top Details */}
            <div className="flex items-start gap-4">
              <img
                src={activePopupOffer.offerphoto}
                alt={activePopupOffer.title}
                className="w-16 h-16 rounded-2xl object-cover border border-emerald-500/30 shrink-0 bg-muted"
              />
              <div className="pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SydeHustle Verified
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {activePopupOffer.category}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-foreground mt-1 leading-snug">
                  {activePopupOffer.title}
                </h2>
              </div>
            </div>

            {/* Reward Spotlight Box */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Guaranteed Payout</span>
                <div className="text-2xl font-black text-emerald-400">
                  +{activePopupOffer.points.toLocaleString()}{" "}
                  <span className="text-xs text-foreground font-normal">PTS</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-foreground block">
                  ${activePopupOffer.usdValue} USD
                </span>
                <span className="text-xs text-emerald-400 font-medium">
                  ≈ R{activePopupOffer.zarValue} ZAR
                </span>
              </div>
            </div>

            {/* Instructions & Steps */}
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                How to complete:
              </h4>
              <div className="space-y-2 bg-muted/40 p-3.5 rounded-xl border border-border">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>1. Click <strong>Start Task Now</strong> below to launch the offer.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>2. Follow the prompt instructions (e.g. install & run app, or answer survey).</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>3. Points automatically credit to your wallet upon task verification.</span>
                </div>
              </div>
            </div>

            {/* Device & Geo Info */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Device: <strong>{activePopupOffer.device}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                Region: <strong>{activePopupOffer.country}</strong>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActivePopupOffer(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleLaunchOffer(activePopupOffer)}
                className="flex-1 py-3 px-5 rounded-xl text-sm font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                Start Task & Earn Rewards
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
