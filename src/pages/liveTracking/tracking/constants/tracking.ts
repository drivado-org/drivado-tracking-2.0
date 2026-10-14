export const RECONNECT_BASE_DELAY_MS = 1000;

export const RECONNECT_MAX_DELAY_MS = 30_000;

/** Moves shorter than this from the last accepted point are GPS drift, not driving. */
export const MIN_MOVE_METERS = 3;

/** ~200 km/h. A point that implies a faster jump is a GPS spike. */
export const MAX_SPEED_MPS = 55;

/** After this many spikes in a row, trust the new points: the car really is there. */
export const MAX_REJECTED_IN_A_ROW = 3;

/** The car glides between points for as long as they were apart, within these limits. */
export const CAR_ANIMATION_MIN_MS = 300;

export const CAR_ANIMATION_MAX_MS = 2000;
