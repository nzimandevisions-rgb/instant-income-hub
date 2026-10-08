/** CPX Research survey wall helpers (server only). */
export const CPX_APP_ID = "37029";

/** MD5 hex digest. Cloudflare Workers support MD5 in crypto.subtle. */
export async function md5Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("MD5", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
