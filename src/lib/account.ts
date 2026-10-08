export const ACCOUNT_STORAGE_KEY = "syde_hustle_account_id";
export const REFERRAL_STORAGE_KEY = "syde_hustle_ref";

/** Remembers an invite code from ?ref= so it survives until the account is created. */
function pendingReferral(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    if (fromUrl && /^sh-[a-z0-9]{6,32}$/i.test(fromUrl)) window.localStorage.setItem(REFERRAL_STORAGE_KEY, fromUrl);
    return window.localStorage.getItem(REFERRAL_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export type WalletSession = { accountId: string; signedIn: boolean; email: string | null };

let sessionPromise: Promise<WalletSession> | null = null;

/**
 * Asks the server which account this browser is signed in to. The server
 * decides the account ID from the session cookie; the browser never picks it.
 */
export function ensureSession(force = false): Promise<WalletSession> {
  if (typeof window === "undefined") return Promise.resolve({ accountId: "", signedIn: false, email: null });
  if (!sessionPromise || force) {
    sessionPromise = fetch("/api/user/session", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: pendingReferral() }),
    })
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
