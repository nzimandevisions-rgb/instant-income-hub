import { envString, type D1DatabaseLike } from "@/lib/d1";

export const SESSION_COOKIE = "syde_hustle_session";
const ONE_YEAR = 31536000;

export function getCookie(request: Request, name: string): string {
  const header = request.headers.get("Cookie") || "";
  const item = header
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(name + "="));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : "";
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ONE_YEAR}`;
}

export function clearCookie(name: string, path = "/"): string {
  return `${name}=; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export const OAUTH_STATE_COOKIE = "syde_hustle_oauth_state";

export function googleRedirectUri(request: Request, context: unknown): string {
  return (
    envString(context, "GOOGLE_REDIRECT_URI") ??
    new URL("/api/auth/google/callback", request.url).toString()
  );
}

export function newAccountId(): string {
  return "sh-" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export function newToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

export type SessionUser = {
  id: string;
  email: string;
  points: number;
  googleSub: string | null;
};

/** Returns the user behind the request's session cookie, or null. */
export async function getSessionUser(
  db: D1DatabaseLike,
  request: Request,
): Promise<{ token: string; user: SessionUser } | null> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const row = await db
    .prepare(
      "SELECT u.id AS id, u.email AS email, u.points AS points, u.google_sub AS google_sub FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?",
    )
    .bind(token)
    .first<Record<string, unknown>>();
  if (!row?.id) return null;
  return {
    token,
    user: {
      id: String(row.id),
      email: String(row.email ?? ""),
      points: Number(row.points ?? 0) || 0,
      googleSub: row.google_sub ? String(row.google_sub) : null,
    },
  };
}

export async function createSession(db: D1DatabaseLike, userId: string): Promise<string> {
  const token = newToken();
  await db
    .prepare("INSERT INTO user_sessions (token, user_id, created_at) VALUES (?, ?, ?)")
    .bind(token, userId, new Date().toISOString())
    .run();
  return token;
}

/** True when the account was created anonymously and never linked to Google. */
export function isAnonymous(user: SessionUser): boolean {
  return !user.googleSub && user.email.endsWith("@user.sydehustle.com");
}
