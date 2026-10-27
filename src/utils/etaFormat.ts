/** Whole minutes left, rounded up so "30 s left" still reads 1 min. */
export const toEtaMinutes = (seconds: number): number => Math.ceil(seconds / 60);

/** 85 minutes → { hours: 1, minutes: 25 }. */
export const splitHours = (totalMinutes: number) => ({
  hours: Math.floor(totalMinutes / 60),
  minutes: totalMinutes % 60,
});

/** 85 → "1 hr 25 min", 45 → "45 min", 120 → "2 hr". */
export const formatDuration = (totalMinutes: number): string => {
  const { hours, minutes } = splitHours(totalMinutes);
  if (hours === 0) return `${minutes} min`;
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
};

/** Kilometres with one decimal. */
export const toKilometres = (meters: number): number => Math.round(meters / 100) / 10;

/** Local "HH:mm" of an ISO time; null when it doesn't parse. */
export const formatClockTime = (iso: string): string | null => {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
