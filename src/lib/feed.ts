import { useEffect, useState } from "react";
export const FEED_ENDPOINTS = {
  survey: "/api/public/feed/survey",
  offer: "/api/public/feed/offer",
} as const;
export type FeedKind = keyof typeof FEED_ENDPOINTS;
export type LiveTask = {
  id: string;
  title: string;
  description: string;
  points: number;
  meta: string | null;
  url: string | null;
  imageUrl: string | null;
  hot: boolean;
  network?: string;
};
type RawTask = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};
function pickStr(row: RawTask, keys: string[]) {
  for (const key of keys) {
    const value = str(row[key]);
    if (value) return value;
  }
  return null;
}
function pickNum(row: RawTask, keys: string[]) {
  for (const key of keys) {
    const value = num(row[key]);
    if (value !== null) return value;
  }
  return null;
}
export function mapTask(row: RawTask, kind: FeedKind, index: number): LiveTask {
  const minutes = pickNum(row, ["minutes", "duration", "loi", "length_of_interview"]);
  const size = pickStr(row, ["size", "file_size", "download_size"]);
  return {
    id:
      pickStr(row, ["id", "task_id", "survey_id", "offer_id", "campaign_id", "uuid"]) ??
      kind + "_" + index,
    title: pickStr(row, ["title", "name", "headline", "offer_name"]) ?? "Untitled task",
    description:
      pickStr(row, ["description", "task", "requirements", "instructions", "summary"]) ?? "",
    points: pickNum(row, ["points", "payout_points", "reward", "amount", "payout"]) ?? 0,
    meta: kind === "survey" ? (minutes ? "about " + minutes + " min" : null) : size,
    url: pickStr(row, ["url", "link", "click_url", "tracking_url", "offer_url"]),
    imageUrl: pickStr(row, ["image", "image_url", "imageUrl", "thumbnail", "thumbnail_url", "icon", "icon_url", "creative", "creative_url"]),
    hot: Boolean(row["hot"] ?? row["featured"] ?? row["is_hot"]),
    ...(pickStr(row, ["network", "source"])
      ? { network: pickStr(row, ["network", "source"])! }
      : {}),
  };
}
function rows(payload: unknown): RawTask[] {
  if (Array.isArray(payload)) return payload as RawTask[];
  if (payload && typeof payload === "object")
    for (const key of ["data", "surveys", "offers", "tasks", "results", "items"]) {
      const value = (payload as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as RawTask[];
    }
  return [];
}
export async function fetchFeed(kind: FeedKind, userId: string | null, signal?: AbortSignal) {
  const query = userId ? "?subid=" + encodeURIComponent(userId) : "";
  const response = await fetch(FEED_ENDPOINTS[kind] + query, {
    headers: { Accept: "application/json" },
    signal: signal ?? null,
  });
  if (!response.ok) throw new Error("Feed request failed (" + response.status + ")");
  return rows(await response.json()).map((row, index) => mapTask(row, kind, index));
}
export function useFeed(kind: FeedKind, userId: string | null = null) {
  const [tasks, setTasks] = useState<LiveTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);
    fetchFeed(kind, userId, controller.signal)
      .then((items) => {
        if (active) setTasks(items);
      })
      .catch((error: unknown) => {
        if (active && !controller.signal.aborted) {
          setTasks([]);
          setError(error instanceof Error ? error.message : "Feed unavailable");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [kind, userId]);
  return { tasks, loading, error, isEmpty: !loading && tasks.length === 0 };
}
export function launchTask(url: string, userId: string | null) {
  const target = new URL(url, window.location.origin);
  if (userId) {
    const encoded = encodeURIComponent(userId);
    target.href = target.href
      .replaceAll("{playerid}", encoded)
      .replaceAll("{player_id}", encoded)
      .replaceAll("[PLAYER_ID]", encoded)
      .replaceAll("[SUBID]", encoded);
    for (const key of ["subid", "subid1", "subId", "playerid", "uid"])
      target.searchParams.set(key, userId);
  }
  window.open(target.toString(), "_blank", "noopener,noreferrer");
}
