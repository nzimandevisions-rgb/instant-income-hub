import { useEffect, useState } from "react";
import { auth, hasToken } from "@/lib/api";

type SessionUser = { id?: string; user_id?: string; email?: string } | null;

/** Reads the signed-in account from /api/auth/me so tasks can carry a sub-id. */
export function useSession() {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!hasToken()) {
      setLoading(false);
      return;
    }
    auth
      .me()
      .then((res: unknown) => {
        if (!active) return;
        const payload = (res ?? null) as Record<string, unknown> | null;
        const nested = payload?.["user"] as SessionUser | undefined;
        setUser((nested ?? payload) as SessionUser);
      })
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const userId = user ? String(user.id ?? user.user_id ?? "") || null : null;

  return { user, userId, loading };
}
