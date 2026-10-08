import { toNonEmptyString } from "@/validators/primitives";

/** Where the login flow stores the token. Sent as the Authorization header as-is. */
export const AUTH_TOKEN_STORAGE_KEY = "token";

/** Reads the auth token from localStorage. null when missing, empty or storage is blocked. */
export const getAuthToken = (): string | null => {
  try {
    const token = toNonEmptyString(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
    // A bad write like setItem(key, undefined) stores the string "undefined".
    return token === null || token === "null" || token === "undefined" ? null : token;
  } catch {
    return null;
  }
};
