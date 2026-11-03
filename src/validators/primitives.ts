export const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/** Accepts finite numbers and numeric strings ("25.2"). Everything else → null. */
export const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/** Accepts non-empty strings (trimmed) and finite numbers. Everything else → null. */
export const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

const DATE_TIME =
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)(?:[.,](\d+))?\s*(Z|UTC|GMT|[+-]\d{2}:?\d{2})?$/i;

/**
 * Rewrites an ISO-like date as strict ISO 8601, which every browser parses the same way.
 * Safari returns NaN for "2026-10-08 12:32:55", "+0000" offsets and " UTC" that Chrome accepts.
 * No zone stays no zone (local time), as Date.parse reads it. Anything else is left as is.
 */
const toStrictIso = (value: string): string => {
  const match = DATE_TIME.exec(value);
  if (!match) return value;
  const [, date, time, fraction, zone] = match;
  const ms = fraction ? `.${fraction.slice(0, 3).padEnd(3, "0")}` : "";
  const upper = zone?.toUpperCase();
  const offset =
    upper === undefined
      ? ""
      : upper === "Z" || upper === "UTC" || upper === "GMT"
        ? "Z"
        : upper.includes(":")
          ? upper
          : `${upper.slice(0, 3)}:${upper.slice(3)}`;
  return `${date}T${time}${ms}${offset}`;
};

/** Accepts milliseconds (number or numeric string) or a date string. Must be > 0. */
export const toTimestampMs = (value: unknown): number | null => {
  const numeric = toFiniteNumber(value);
  if (numeric !== null) {
    return numeric > 0 ? numeric : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Date.parse(toStrictIso(value.trim()));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
};
