export const ACCOUNT_STORAGE_KEY = "syde_hustle_account_id";

export type WalletSession = { accountId: string; signedIn: boolean; email: string | null };

let sessionPromise: Promise<WalletSession> | null = null;

/**
 * Asks the server which account this browser is signed in to. The server
 * decides the account ID from the session cookie; the browser never picks it.
 */
export function ensureSession(force = false): Promise<WalletSession> {
  if (typeof window === "undefined") return Promise.resolve({ accountId: "", signedIn: false, email: null });
  if (!sessionPromise || force) {
    sessionPromise = fetch("/api/user/session", { method: "POST", credentials: "same-origin" })
      .then(async (res) => {
        const data = (await res.json()) as Partial<WalletSession> & { error?: string };
        if (!res.ok || !data.accountId) throw new Error(data.error || "Session failed");
        window.localStorage.setItem(ACCOUNT_STORAGE_KEY, data.accountId);
        return { accountId: data.accountId, signedIn: Boolean(data.signedIn), email: data.email ?? null };
      })
      .catch((error) => {
        sessionPromise = null;
        throw error;
      });
  }
  return sessionPromise;
}

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
  window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  sessionPromise = null;
}
