export const RECONNECT_BASE_DELAY_MS = 1000;

/** Recent car points kept in redux (newest last); older ones are dropped. */
export const MAX_TRACK_POINTS = 20;

export const RECONNECT_MAX_DELAY_MS = 30_000;

/** Moves shorter than this from the last accepted point are GPS drift, not driving. Phone GPS drifts 5–15 m while parked. */
export const MIN_MOVE_METERS = 8;

/** A point this much behind the last accepted one along the route is noise, not driving. */
export const MAX_BACKWARD_METERS = 15;

/** ~200 km/h. A point that implies a faster jump is a GPS spike. */
export const MAX_SPEED_MPS = 55;

/** After this many rejected points in a row, trust the new points: the car really is there. */
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

// ---- Camera (see components/MapCamera) ----
// Ease rates are the share of the gap still left after one second, so the glide is the
// same at any frame rate.

/** Locked on the car: the camera keeps up closely. */
export const FOLLOW_EASE_PER_SECOND = 0.002;

/** Journey view: the framing changes more gently than the lock. */
export const JOURNEY_EASE_PER_SECOND = 0.05;

/** Farther than this, the camera jumps to the car instead of gliding (first fix, long trips). */
export const CAMERA_JUMP_METERS = 5000;

/** Zoom of the lock on the car. */
export const FOLLOW_ZOOM = 17;

/** The journey view never zooms in further than this: labels near the drop-off don't pile up. */
export const JOURNEY_MAX_ZOOM = 16;

export const ROUTE_MAX_ZOOM = 17;

/**
 * Room kept clear around the framed points (the ETA label above the car, the buttons).
 * Even on opposite sides, so what is framed sits in the middle of the map.
 */
export const JOURNEY_PADDING_PX = { top: 64, right: 72, bottom: 64, left: 72 };

export const ROUTE_PADDING_PX = { top: 56, right: 64, bottom: 56, left: 64 };

/** On a small map no side's padding takes more than this share of the map's width / height. */
export const MAX_PADDING_SHARE = 0.18;

/** In the whole-route view, this close to the drop-off (along the route) the camera locks on the car. */
export const AUTO_FOLLOW_METERS = 900;

/** How long the glide onto the whole route takes. */
export const ROUTE_FLY_MS = 700;

/** How long the automatic move onto the car takes. */
export const AUTO_FOLLOW_MS = 2400;

/** How long a camera toast stays up. */
export const MAP_TOAST_MS = 1800;

/** A car farther than this from the route is off it: the route is drawn whole, not trimmed. */
export const OFF_ROUTE_METERS = 50;

/** How long a trip status toast (arrived, on board…) stays up. */
export const STATUS_TOAST_MS = 4500;

// ---- Trip status (see hooks/useShownStatus.ts) ----

/** The drawn car this close to the end of the route has reached it. */
export const ARRIVED_METERS = 30;

/** ARRIVED / COMPLETED show after this long even if the drawn car isn't at the end of the route. */
export const ARRIVAL_MAX_WAIT_MS = 6000;

// ---- Geofence (see hooks/useGeofence.ts) ----

/** Radius of the area drawn around the pickup / drop-off. */
export const GEOFENCE_RADIUS_METERS = 100;

/** The car leaves the area only this far past its edge: GPS drift at the edge doesn't flicker it. */
export const GEOFENCE_EXIT_MARGIN_METERS = 15;

/** The area is drawn, and the camera zooms in further, only once the car is this close. */
export const GEOFENCE_SHOW_METERS = 300;

/** Near the pickup / drop-off the journey view may zoom in this far, and the lock zooms in to it. */
export const APPROACH_ZOOM = 18;
