export const ACCOUNT_STORAGE_KEY = "syde_hustle_account_id";
export function getOrCreateAccountId() {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
  if (!id) {
    id = "sh-" + Math.random().toString(36).slice(2, 9).toLowerCase();
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, id);
  }
  return id;
}
