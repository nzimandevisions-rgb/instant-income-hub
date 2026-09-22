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

  let url: URL;
  if (kind === "survey") {
    if (!subid) return [];
    url = new URL(`https://adscendmedia.com/market-research/api/publisher/${publisherId}/profile/${profileId}/user/${encodeURIComponent(subid)}/surveys.json`);
  } else {
    url = new URL(`https://api.adscendmedia.com/v1/publisher/${publisherId}/offers.json`);
    if (subid) url.searchParams.set("sub1", subid);
  }

  const payload = await getJson(url.toString(), { Authorization: "Basic " + btoa(`${publisherId}:${apiKey}`) });

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
  if (kind !== "offer" || !subid) return [];
  const refreshToken = env("ADGEM_REFRESH_TOKEN");
  if (!refreshToken) return [];

  const tokenRes = await fetch("https://prism.adgem.com/v1/users/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!tokenRes.ok) throw new Error(`AdGem token ${tokenRes.status}`);
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("AdGem access token missing");

  const response = await fetch("https://prism.adgem.com/v1/offers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: "query GetOffers(\$playerId: String!) { offers(player_id: \$playerId) { id name total_payout_usd creatives { name description short_description instructions disclaimer } links { click_url } goals { name description payout_usd } is_featured_campaign } }",
      variables: { playerId: subid },
    }),
  });
  if (!response.ok) throw new Error(`AdGem offers ${response.status}`);
  const payload = await response.json();

  return rowsFrom(payload).map((row, i) => ({
    id: pickStr(row, ["id", "campaign_id", "offer_id"]) ?? `adgem_${i}`,
    title: pickStr(row, ["name", "title", "short_name"]) ?? "Untitled offer",
    description: pickStr(row, ["description", "short_description", "instructions"]) ?? "",
    points: pickNum(row, ["amount", "points"]) ?? payoutToPoints(pickNum(row, ["total_payout_usd", "payout", "revenue"])),
    meta: pickStr(row, ["tracking_type", "campaign_vertical"]),
    url: pickStr(row, ["click_url", "tracking_url", "url"]),
    hot: Boolean(row["is_featured_campaign"] ?? row["featured"]),
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


/* ---------------------------------- CPAlead --------------------------------- */

async function cpalead(kind: FeedKind, subid: string | null): Promise<NormalizedTask[]> {
  if (kind !== "offer" || !subid) return [];

  // The publisher ID is public configuration, not a secret. Keep it overrideable
  // so the same build can be moved to a different approved publisher account.
  const publisherId = env("CPALEAD_PUBLISHER_ID") ?? "3359608";
  const url = new URL("https://www.cpalead.com/api/offers");
  url.searchParams.set("id", publisherId);
  url.searchParams.set("country", "ZA");
  url.searchParams.set("device", "user");
  url.searchParams.set("limit", "100");
  url.searchParams.set("subid", subid);
  url.searchParams.set(
    "fields",
    "id,title,description,conversion,link,amount,payout_currency,offer_rank,device,events",
  );

  const payload = await getJson(url.toString());
  const offers = rowsFrom(payload);

  return offers
    .map((row, i) => {
      const events = Array.isArray(row["events"])
        ? (row["events"] as Record<string, unknown>[])
        : [];
      const eventPayouts = events
        .map((event) => num(event["amount"]))
        .filter((value): value is number => value !== null && value > 0);
      const basePayout = pickNum(row, ["amount"]);
      const publisherPayout =
        eventPayouts.length > 0 ? Math.max(basePayout ?? 0, ...eventPayouts) : basePayout;
      const rewardPoints = payoutToPoints(publisherPayout);
      if (rewardPoints <= 0) return null;

      const conversion = pickStr(row, ["conversion", "instructions"]);
      return {
        id: pickStr(row, ["id", "offer_id", "campaign_id"]) ?? `cpalead_${i}`,
        title: pickStr(row, ["title", "name"]) ?? "Available task",
        description: conversion
          ? (pickStr(row, ["description"]) ?? "") + (pickStr(row, ["description"]) ? " " : "") + conversion
          : pickStr(row, ["description"]) ?? "",
        points: rewardPoints,
        meta: pickStr(row, ["device", "payout_type"]) ?? "Offer",
        url: pickStr(row, ["link", "url", "click_url"]),
        hot: Number(pickNum(row, ["offer_rank"]) ?? 9999) <= 10,
        network: "rewards",
      } satisfies NormalizedTask;
    })
    .filter((task): task is NormalizedTask => task !== null);
}

/* --------------------------------- CPAGrip --------------------------------- */

async function cpagrip(kind: FeedKind, subid: string | null): Promise<NormalizedTask[]> {
  if (kind !== "offer" || !subid) return [];

  // CPAGrip's documented hosted offer wall is the reliable inventory surface.
  // Pass the Syde Hustle account as tracking_id so completed offers can be
  // credited back to the correct user through the global postback.
  const publisherId = env("CPAGRIP_AFFILIATE_ID") ?? "2554086";
  const wallUrl = new URL("https://www.cpagrip.com/showoffer.php");
  wallUrl.searchParams.set("u", publisherId);
  wallUrl.searchParams.set("tracking_id", subid);

  return [{
    id: "cpagrip_wall",
    title: "Available Offers",
    description: "Browse eligible tasks and offers available for your account.",
    points: 0,
    meta: "Offers",
    url: wallUrl.toString(),
    hot: true,
    network: "rewards",
  }];
}

const adapters = [cpalead, cpagrip, adscend, adgem, digitalTurbine];

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
