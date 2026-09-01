/**
 * Server-only offerwall adapters.
 *
 * Each network is optional: an adapter only runs when its credentials are
 * present in the environment, so you can add networks as approvals land
 * without touching the UI.
 */

export type FeedKind = "survey" | "offer";

export type NormalizedTask = {
  id: string;
  title: string;
  description: string;
  points: number;
  meta: string | null;
  url: string | null;
  hot: boolean;
  network: string;
};

const env = (name: string) => {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
};

const num = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

function pickStr(row: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = str(row[k]);
    if (v) return v;
  }
  return null;
}

function pickNum(row: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = num(row[k]);
    if (v !== null) return v;
  }
  return null;
}

function rowsFrom(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    for (const key of ["data", "offers", "surveys", "campaigns", "results", "items", "response"]) {
      const v = (payload as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
      if (v && typeof v === "object") {
        const nested = rowsFrom(v);
        if (nested.length) return nested;
      }
    }
  }
  return [];
}

async function getJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers: { Accept: "application/json", ...headers } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/** Points awarded per USD of network payout. Keeps 1000 pts = $1 consistent. */
const POINTS_PER_USD = 1000;
/** Share of the network payout passed on to the user. */
const USER_REVENUE_SHARE = 0.7;

const payoutToPoints = (payoutUsd: number | null) =>
  payoutUsd === null ? 0 : Math.max(1, Math.round(payoutUsd * USER_REVENUE_SHARE * POINTS_PER_USD));

/* ------------------------------- Adscend Media ------------------------------ */

async function adscend(kind: FeedKind, subid: string | null): Promise<NormalizedTask[]> {
  const publisherId = env("ADSCEND_PUBLISHER_ID");
  const apiKey = env("ADSCEND_API_KEY");
  const profileId = env("ADSCEND_PROFILE_ID");
  if (!publisherId || !apiKey || !profileId) return [];

  const base = `https://api.adscendmedia.com/v1/publisher/${publisherId}/profile/${profileId}`;
  const path = kind === "survey" ? "surveys.json" : "offers.json";
  const url = new URL(`${base}/${path}`);
  if (subid) url.searchParams.set("subid1", subid);

  const payload = await getJson(url.toString(), { Authorization: apiKey });

  return rowsFrom(payload).map((row, i) => {
    const minutes = pickNum(row, ["loi", "length_of_interview", "minutes", "duration"]);
    return {
      id: pickStr(row, ["id", "survey_id", "offer_id", "campaign_id"]) ?? `adscend_${kind}_${i}`,
      title: pickStr(row, ["name", "title", "headline"]) ?? "Untitled task",
      description: pickStr(row, ["description", "requirements", "instructions", "summary"]) ?? "",
      points: pickNum(row, ["points", "reward"]) ?? payoutToPoints(pickNum(row, ["payout", "amount", "revenue"])),
      meta: kind === "survey" ? (minutes ? `about ${minutes} min` : null) : pickStr(row, ["size", "file_size"]),
      url: pickStr(row, ["click_url", "url", "link", "tracking_url", "offer_url"]),
      hot: Boolean(row["featured"] ?? row["is_hot"]),
      network: "adscend",
    };
  });
}

/* ----------------------------------- AdGem ---------------------------------- */

async function adgem(kind: FeedKind, subid: string | null): Promise<NormalizedTask[]> {
  if (kind !== "offer") return [];
  const appId = env("ADGEM_APP_ID");
  if (!appId) return [];

  const url = new URL("https://api.adgem.com/v1/wall/json");
  url.searchParams.set("appid", appId);
  if (subid) url.searchParams.set("playerid", subid);
  const apiKey = env("ADGEM_API_KEY");

  const payload = await getJson(url.toString(), apiKey ? { Authorization: `Bearer ${apiKey}` } : {});

  return rowsFrom(payload).map((row, i) => ({
    id: pickStr(row, ["campaign_id", "id", "offer_id"]) ?? `adgem_${i}`,
    title: pickStr(row, ["name", "title", "short_name"]) ?? "Untitled offer",
    description: pickStr(row, ["description", "instructions", "short_description"]) ?? "",
    points: pickNum(row, ["amount", "points"]) ?? payoutToPoints(pickNum(row, ["payout", "revenue"])),
    meta: pickStr(row, ["size", "file_size", "platform"]),
    url: pickStr(row, ["tracking_url", "click_url", "url"]),
    hot: Boolean(row["featured"] ?? row["is_featured"]),
    network: "adgem",
  }));
}

/* ------------------------------ Digital Turbine ----------------------------- */

async function digitalTurbine(kind: FeedKind, subid: string | null): Promise<NormalizedTask[]> {
  if (kind !== "offer") return [];
  const apiKey = env("DIGITAL_TURBINE_API_KEY");
  const propertyId = env("DIGITAL_TURBINE_PROPERTY_ID");
  if (!apiKey || !propertyId) return [];

  const url = new URL("https://api.fyber.com/offers/v1/offers.json");
  url.searchParams.set("appid", propertyId);
  if (subid) url.searchParams.set("uid", subid);

  const payload = await getJson(url.toString(), { "X-Api-Key": apiKey });

  return rowsFrom(payload).map((row, i) => ({
    id: pickStr(row, ["offer_id", "id", "campaign_id"]) ?? `dt_${i}`,
    title: pickStr(row, ["title", "name", "teaser"]) ?? "Untitled offer",
    description: pickStr(row, ["offer_desc", "description", "teaser"]) ?? "",
    points: pickNum(row, ["payout", "points", "amount"]) ?? 0,
    meta: pickStr(row, ["store_id", "platform"]),
    url: pickStr(row, ["link", "click_url", "url"]),
    hot: false,
    network: "digital_turbine",
  }));
}

const adapters = [adscend, adgem, digitalTurbine];

/** Runs every configured network in parallel and merges the results. */
export async function loadFeed(kind: FeedKind, subid: string | null) {
  const settled = await Promise.allSettled(adapters.map((fn) => fn(kind, subid)));

  const tasks: NormalizedTask[] = [];
  const errors: string[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") tasks.push(...r.value);
    else errors.push(`${adapters[i]?.name ?? "network"}: ${String(r.reason)}`);
  });

  tasks.sort((a, b) => b.points - a.points);
  return { tasks, errors };
}
