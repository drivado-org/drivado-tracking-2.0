export const RECONNECT_BASE_DELAY_MS = 1000;

/** Recent car points kept in redux (newest last); older ones are dropped. */
export const MAX_TRACK_POINTS = 20;

export const RECONNECT_MAX_DELAY_MS = 30_000;

/** Moves shorter than this from the last accepted point are GPS drift, not driving. */
export const MIN_MOVE_METERS = 3;

/** ~200 km/h. A point that implies a faster jump is a GPS spike. */
export const MAX_SPEED_MPS = 55;

/** After this many spikes in a row, trust the new points: the car really is there. */
export const MAX_REJECTED_IN_A_ROW = 3;

// ---- Car playback (see utils/carPlayback.ts) ----
// The car replays the recent points a little behind live, so the next point is already
// there when it needs it: steady speed, no stop-and-go when a point arrives late.

/** Delay before any point spacing is known. */
export const PLAYBACK_DEFAULT_DELAY_MS = 2500;

/** Delay = the longest recent gap between points plus this margin for network jitter. */
export const PLAYBACK_JITTER_MARGIN_MS = 700;

export const PLAYBACK_MIN_DELAY_MS = 1200;

export const PLAYBACK_MAX_DELAY_MS = 5000;

/** A gap longer than this is mostly standing still: the car only moves for its last part. */
export const MAX_SEGMENT_MS = 4000;

/** Behind or ahead by this much, the playback speed changes by 100% (within the limits below). */
export const PLAYBACK_CATCH_UP_MS = 4000;

export const PLAYBACK_MIN_RATE = 0.7;

export const PLAYBACK_MAX_RATE = 1.6;

/** Further behind than this (e.g. the tab was hidden), skip ahead instead of catching up. */
export const PLAYBACK_MAX_LAG_MS = 15_000;

// ---- Camera follow ----

/** Share of the remaining distance the camera moves each frame toward the car. */
export const CAMERA_EASE_PER_FRAME = 0.2;

/** Farther than this, the camera jumps to the car instead of gliding (first fix, long trips). */
export const CAMERA_JUMP_METERS = 5000;

/** After the user drags the map, stop following the car for this long. */
export const FOLLOW_PAUSE_AFTER_DRAG_MS = 10_000;

/** A car farther than this from the route is off it: the route is drawn whole, not trimmed. */
export const OFF_ROUTE_METERS = 50;
