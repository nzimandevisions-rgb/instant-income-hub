import { useCallback, useEffect, useState } from "react";

export type LedgerEntry = {
  id: string;
  label: string;
  points: number;
  source: "survey" | "offer" | "video" | "withdrawal";
  at: string;
};

export type WalletState = {
  balance: number;
  lifetime: number;
  completed: string[];
  ledger: LedgerEntry[];
};

const STORAGE_KEY = "syde-hustle-wallet-v1";

const initialState: WalletState = {
  balance: 0,
  lifetime: 0,
  completed: [],
  ledger: [],
};

let state: WalletState = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit() {
  listeners.forEach((fn) => fn());
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...initialState, ...(JSON.parse(raw) as WalletState) };
  } catch {
    state = initialState;
  }
  emit();
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Client-side points ledger. This is the single write path for earnings, so it
 * can be swapped for a Cloud-backed ledger (points table + /api/public/postback)
 * without touching any screen.
 */
export function useWallet() {
  const [snapshot, setSnapshot] = useState<WalletState>(state);

  useEffect(() => {
    const update = () => setSnapshot({ ...state });
    listeners.add(update);
    load();
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  const credit = useCallback(
    (opts: { label: string; points: number; source: LedgerEntry["source"]; taskId?: string }) => {
      if (opts.taskId && state.completed.includes(opts.taskId)) return false;
      state = {
        balance: state.balance + opts.points,
        lifetime: state.lifetime + Math.max(opts.points, 0),
        completed: opts.taskId ? [...state.completed, opts.taskId] : state.completed,
        ledger: [
          { id: makeId(), label: opts.label, points: opts.points, source: opts.source, at: new Date().toISOString() },
          ...state.ledger,
        ].slice(0, 50),
      };
      persist();
      emit();
      return true;
    },
    [],
  );

  const withdraw = useCallback((opts: { label: string; points: number }) => {
    if (opts.points > state.balance) return false;
    state = {
      ...state,
      balance: state.balance - opts.points,
      ledger: [
        {
          id: makeId(),
          label: opts.label,
          points: -opts.points,
          source: "withdrawal",
          at: new Date().toISOString(),
        },
        ...state.ledger,
      ].slice(0, 50),
    };
    persist();
    emit();
    return true;
  }, []);

  return { ...snapshot, credit, withdraw };
}
