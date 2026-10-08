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

/** Accepts milliseconds (number or numeric string) or a date string. Must be > 0. */
export const toTimestampMs = (value: unknown): number | null => {
  const numeric = toFiniteNumber(value);
  if (numeric !== null) {
    return numeric > 0 ? numeric : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
};
