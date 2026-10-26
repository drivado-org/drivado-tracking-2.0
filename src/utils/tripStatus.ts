import type { DriverStatus } from "@/types/tracking";

/** Step of each status in the trip. A trip only moves forward. */
const STEP: Record<DriverStatus, number> = {
  ENROUTE: 0,
  ARRIVED: 1,
  POB: 2,
  COMPLETED: 3,
  NOSHOW: 3,
};

/** A status from a late or older event would move the trip back a step. */
export const isStepBack = (next: DriverStatus, current: DriverStatus | null) =>
  current !== null && STEP[next] < STEP[current];

export const isTripFinished = (status: DriverStatus | null) =>
  status === "COMPLETED" || status === "NOSHOW";

/** The car is at the end of its route: at the pickup (ARRIVED) or the drop-off (COMPLETED). */
export const isArrivalStatus = (status: DriverStatus | null) =>
  status === "ARRIVED" || status === "COMPLETED";
