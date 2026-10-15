import { useEffect, useRef, useState } from "react";
import type { LatLng, TrackPoint } from "@/types/geo";
import { MAX_TRACK_POINTS } from "../constants/tracking";
import { advancePlayback, sampleTrack } from "../utils/carPlayback";
import {
  applyPoint,
  EMPTY_TRACK,
  turnTowards,
  type CarTrack,
} from "../utils/locationFilter";

type FilterState = {
  track: CarTrack;
  accepted: TrackPoint[];
};

const EMPTY_FILTER: FilterState = { track: EMPTY_TRACK, accepted: [] };

const acceptPoint = (state: FilterState, point: TrackPoint): FilterState => {
  const track = applyPoint(state.track, point);
  if (track.current === state.track.current) return { ...state, track };
  return {
    track,
    accepted: [...state.accepted, track.current!].slice(-MAX_TRACK_POINTS),
  };
};

const useCarAnimation = (
  points: readonly TrackPoint[],
  bearing: number | null = null,
) => {
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [seenUntil, setSeenUntil] = useState<string | null>(null);
  const [position, setPosition] = useState<LatLng | null>(null);
  const [heading, setHeading] = useState(0);

  const newestTimestamp = points.at(-1)?.timestamp ?? null;
  if (newestTimestamp !== seenUntil) {
    setSeenUntil(newestTimestamp);
    if (newestTimestamp === null) {
      setFilter(EMPTY_FILTER);
    } else {
      const seenMs = seenUntil === null ? -Infinity : Date.parse(seenUntil);
      const fresh = points.filter(
        (point) => Date.parse(point.timestamp) > seenMs,
      );
      setFilter((prev) => fresh.reduce(acceptPoint, prev));
    }
  }

  const { accepted } = filter;
  const hasPoints = accepted.length > 0;
  if (!hasPoints && position !== null) setPosition(null);

  const acceptedRef = useRef(accepted);
  const arrivedAtRef = useRef(0);
  const bearingRef = useRef(bearing);

  useEffect(() => {
    acceptedRef.current = accepted;
    arrivedAtRef.current = performance.now();
  }, [accepted]);

  useEffect(() => {
    bearingRef.current = bearing;
  }, [bearing]);

  useEffect(() => {
    if (!hasPoints) return;

    let frame = 0;
    let lastFrameAt = performance.now();
    let clock: number | null = null;
    let drawn: LatLng | null = null;
    let headingTarget: number | null = null;

    const step = () => {
      const now = performance.now();
      const track = acceptedRef.current;
      const newest = track[track.length - 1];

      if (newest) {
        const liveTime =
          Date.parse(newest.timestamp) + (now - arrivedAtRef.current);
        clock = advancePlayback(clock, track, liveTime, now - lastFrameAt);
        const sample = clock === null ? null : sampleTrack(track, clock);

        if (sample) {
          if (
            drawn?.lat !== sample.position.lat ||
            drawn?.lng !== sample.position.lng
          ) {
            drawn = sample.position;
            setPosition(drawn);
          }

          const nextHeading = sample.movingHeading ?? bearingRef.current;
          if (nextHeading !== null && nextHeading !== headingTarget) {
            headingTarget = nextHeading;
            setHeading((prev) => turnTowards(prev, nextHeading));
          }
        }
      }

      lastFrameAt = now;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [hasPoints]);

  return { position, heading, target: accepted.at(-1) ?? null };
};

export default useCarAnimation;
