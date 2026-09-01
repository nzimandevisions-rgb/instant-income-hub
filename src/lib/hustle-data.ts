export type PayoutMethod = {
  id: string;
  label: string;
  provider: "Flutterwave" | "Reloadly";
  hint: string;
  kind: "momo" | "bank" | "airtime" | "data";
};

/** Points to USD-cents rate used across the app. 1000 pts = $1.00 */
export const POINTS_PER_USD = 1000;
export const MIN_WITHDRAW_POINTS = 2000;

export const pointsToUsd = (points: number) => points / POINTS_PER_USD;

export const formatUsd = (usd: number) =>
  usd.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const payoutMethods: PayoutMethod[] = [
  {
    id: "momo",
    label: "MTN MoMo",
    provider: "Flutterwave",
    hint: "Ghana, Uganda, Rwanda, Cameroon",
    kind: "momo",
  },
  {
    id: "mpesa",
    label: "M-Pesa",
    provider: "Flutterwave",
    hint: "Kenya, Tanzania",
    kind: "momo",
  },
  {
    id: "airtel",
    label: "Airtel Money",
    provider: "Flutterwave",
    hint: "Zambia, Malawi, Nigeria",
    kind: "momo",
  },
  {
    id: "bank",
    label: "Bank transfer",
    provider: "Flutterwave",
    hint: "Local bank account payout",
    kind: "bank",
  },
  {
    id: "airtime",
    label: "Airtime top-up",
    provider: "Reloadly",
    hint: "800+ networks worldwide",
    kind: "airtime",
  },
  {
    id: "data",
    label: "Data bundle",
    provider: "Reloadly",
    hint: "Instant prepaid data voucher",
    kind: "data",
  },
];
