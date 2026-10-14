import { useEffect, useRef, useState } from "react";
import type { LatLng, TrackPoint } from "@/types/geo";
import {
  CAR_ANIMATION_MAX_MS,
  CAR_ANIMATION_MIN_MS,
} from "../constants/tracking";
import { applyPoint, EMPTY_TRACK, type CarTrack } from "../utils/locationFilter";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Filters GPS noise out of the raw points and glides the car between the ones that pass.
 * Returns where to draw the car this frame, which way it faces, and the point it is heading to.
 */
const useCarAnimation = (rawPoint: TrackPoint | null) => {
  // previous and current live in one state so they always change together.
  const [track, setTrack] = useState<CarTrack>(EMPTY_TRACK);
  // The last raw point seen, so each new one is filtered exactly once.
  const [seenPoint, setSeenPoint] = useState<TrackPoint | null>(null);
  const [position, setPosition] = useState<LatLng | null>(null);
  // Where the car is drawn right now; a new point starts its animation from here.
  const drawnRef = useRef<LatLng | null>(null);

  // Updating state during render when a prop changes (React's pattern, no extra effect pass).
  if (rawPoint !== seenPoint) {
    setSeenPoint(rawPoint);
    // The updater reads the latest track, never a stale one from an earlier render.
    setTrack((prev) => (rawPoint ? applyPoint(prev, rawPoint) : EMPTY_TRACK));
  }

  const { previous, current } = track;

  useEffect(() => {
    const draw = (point: LatLng | null) => {
      drawnRef.current = point;
      setPosition(point);
    };

    const from = drawnRef.current;
    if (!current || !previous || !from) {
      draw(current && { lat: current.lat, lng: current.lng });
      return;
    }

    const duration = clamp(
      Date.parse(current.timestamp) - Date.parse(previous.timestamp),
      CAR_ANIMATION_MIN_MS,
      CAR_ANIMATION_MAX_MS,
    );
    let start: number | null = null;
    let frame = 0;

    // Linear, not eased: points arrive back to back, so easing would stop the car every second.
    const step = (now: number) => {
      start ??= now;
      const t = Math.min((now - start) / duration, 1);
      draw({
        lat: from.lat + (current.lat - from.lat) * t,
        lng: from.lng + (current.lng - from.lng) * t,
      });
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [previous, current]);

  return { position, heading: track.heading, target: current };
};

export default useCarAnimation;
