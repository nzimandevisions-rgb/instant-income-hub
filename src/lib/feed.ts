import { useEffect, useState } from "react";

/** Live backend that serves the production survey/offer inventory. */
export const FEED_BASE = "https://sydehustle.dpdns.org";

export const FEED_ENDPOINTS = {
  survey: "/api/surveys",
  offer: "/api/offers",
} as const;

export type FeedKind = keyof typeof FEED_ENDPOINTS;

export type LiveTask = {
  id: string;
  title: string;
  description: string;
  points: number;
  /** Minutes for surveys, download size for offers — whatever the row provides. */
  meta: string | null;
  url: string | null;
  hot: boolean;
};

type RawTask = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

function firstStr(row: RawTask, keys: string[]) {
  for (const k of keys) {
    const v = str(row[k]);
    if (v) return v;
  }
  return null;
}

function firstNum(row: RawTask, keys: string[]) {
  for (const k of keys) {
    const v = num(row[k]);
    if (v !== null) return v;
  }
  return null;
}

/** Maps a production database row onto the shape the UI cards render. */
export function mapTask(row: RawTask, kind: FeedKind, index: number): LiveTask {
  const minutes = firstNum(row, ["minutes", "duration", "loi", "length_of_interview"]);
  const size = firstStr(row, ["size", "file_size", "download_size"]);

  return {
    id:
      firstStr(row, ["id", "task_id", "survey_id", "offer_id", "campaign_id", "uuid"]) ??
      `${kind}_${index}`,
    title: firstStr(row, ["title", "name", "headline", "offer_name"]) ?? "Untitled task",
    description:
      firstStr(row, ["description", "task", "requirements", "instructions", "summary"]) ?? "",
    points: firstNum(row, ["points", "payout_points", "reward", "amount", "payout"]) ?? 0,
    meta: kind === "survey" ? (minutes ? `about ${minutes} min` : null) : size,
    url: firstStr(row, ["url", "link", "click_url", "tracking_url", "offer_url"]),
    hot: Boolean(row["hot"] ?? row["featured"] ?? row["is_hot"]),
  };
}

function extractRows(payload: unknown): RawTask[] {
  if (Array.isArray(payload)) return payload as RawTask[];
  if (payload && typeof payload === "object") {
    for (const key of ["data", "surveys", "offers", "tasks", "results", "items"]) {
      const v = (payload as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as RawTask[];
    }
  }
  return [];
}

export async function fetchFeed(kind: FeedKind, signal?: AbortSignal): Promise<LiveTask[]> {
  const res = await fetch(FEED_BASE + FEED_ENDPOINTS[kind], {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`Feed request failed (${res.status})`);
  const payload = await res.json();
  return extractRows(payload).map((row, i) => mapTask(row, kind, i));
}

/**
 * Live feed hook. Returns an empty list on any error so screens can render the
 * shared empty state instead of a crash.
 */
export function useFeed(kind: FeedKind) {
  const [tasks, setTasks] = useState<LiveTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);

    fetchFeed(kind, controller.signal)
      .then((rows) => {
        if (!active) return;
        setTasks(rows);
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setTasks([]);
        setError(err instanceof Error ? err.message : "Feed unavailable");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [kind]);

  return { tasks, loading, error, isEmpty: !loading && tasks.length === 0 };
}

/** Appends the signed-in user's id as the network sub-id and opens the task. */
export function launchTask(url: string, userId: string | null) {
  const target = new URL(url, FEED_BASE);
  if (userId) target.searchParams.set("subid", userId);
  window.open(target.toString(), "_blank", "noopener,noreferrer");
}
