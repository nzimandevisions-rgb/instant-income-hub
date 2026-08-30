export type Survey = {
  id: string;
  network: "Adscend Media" | "Digital Turbine";
  title: string;
  points: number;
  minutes: number;
  category: string;
};

export type Offer = {
  id: string;
  network: "AdGem" | "Adscend Media" | "Digital Turbine";
  title: string;
  task: string;
  points: number;
  size: string;
  hot?: boolean;
};

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

/**
 * Mock feeds. Swap each array for a live fetch once the network API keys land:
 *  - surveys  -> Adscend Media Survey API / Digital Turbine Offer Wall REST API
 *  - offers   -> AdGem Static Offer API
 */
export const surveys: Survey[] = [
  {
    id: "sv_1",
    network: "Adscend Media",
    title: "Mobile data spending habits",
    points: 640,
    minutes: 6,
    category: "Telecoms",
  },
  {
    id: "sv_2",
    network: "Adscend Media",
    title: "Which streaming apps do you pay for?",
    points: 420,
    minutes: 4,
    category: "Entertainment",
  },
  {
    id: "sv_3",
    network: "Digital Turbine",
    title: "Banking & mobile money preferences",
    points: 980,
    minutes: 11,
    category: "Finance",
  },
  {
    id: "sv_4",
    network: "Adscend Media",
    title: "Grocery shopping in your city",
    points: 350,
    minutes: 3,
    category: "Retail",
  },
  {
    id: "sv_5",
    network: "Digital Turbine",
    title: "Ride-hailing vs minibus taxis",
    points: 720,
    minutes: 8,
    category: "Transport",
  },
];

export const offers: Offer[] = [
  {
    id: "of_1",
    network: "AdGem",
    title: "Coin Master",
    task: "Install and reach village level 5",
    points: 3400,
    size: "94 MB",
    hot: true,
  },
  {
    id: "of_2",
    network: "AdGem",
    title: "Monopoly Go",
    task: "Install and complete the tutorial",
    points: 1250,
    size: "142 MB",
  },
  {
    id: "of_3",
    network: "Digital Turbine",
    title: "Bingo Blitz",
    task: "Play 3 rounds within 24 hours",
    points: 2100,
    size: "78 MB",
    hot: true,
  },
  {
    id: "of_4",
    network: "Adscend Media",
    title: "Shopping app signup",
    task: "Register a free account and verify email",
    points: 900,
    size: "—",
  },
  {
    id: "of_5",
    network: "AdGem",
    title: "Solitaire Cash",
    task: "Win your first match",
    points: 1600,
    size: "56 MB",
  },
];

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
