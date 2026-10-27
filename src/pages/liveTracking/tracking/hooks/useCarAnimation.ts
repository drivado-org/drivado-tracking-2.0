import { useEffect, useRef, useState } from "react";
import type { LatLng, TrackPoint } from "@/types/geo";
import { MAX_TRACK_POINTS } from "../constants/tracking";
import { advancePlayback, sampleTrack, type TrackSample } from "../utils/carPlayback";
import {
  applyPoint,
  EMPTY_TRACK,
  turnTowards,
  type CarTrack,
} from "../utils/locationFilter";
import { alongRoute, pointAtMeters, routeLengths } from "../utils/routeProgress";

type RoadTrack = {
  track: readonly TrackPoint[];
  path: LatLng[];
  lengths: number[];
  along: (number | null)[];
};

/** The sample moved onto the road: between two points on the route it drives the road's bends. */
const onRoad = (road: RoadTrack, sample: TrackSample): LatLng | null => {
  const from = road.along[sample.index];
  if (from == null) return null;
  const to = sample.t > 0 ? road.along[sample.index + 1] : from;
  if (to == null) return null;
  return pointAtMeters(road.path, road.lengths, from + (to - from) * sample.t);
};

type FilterState = {
  track: CarTrack;
  accepted: TrackPoint[];
};

const EMPTY_FILTER: FilterState = { track: EMPTY_TRACK, accepted: [] };

const acceptPoint = (
  state: FilterState,
  point: TrackPoint,
  routePath: LatLng[] | null,
): FilterState => {
  const track = applyPoint(state.track, point, routePath);
  if (track.current === state.track.current) return { ...state, track };
  return {
    track,
    accepted: [...state.accepted, track.current!].slice(-MAX_TRACK_POINTS),
  };
};

const useCarAnimation = (
  points: readonly TrackPoint[],
  bearing: number | null = null,
  routePath: LatLng[] | null = null,
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
      setFilter((prev) =>
        fresh.reduce(
          (state, point) => acceptPoint(state, point, routePath),
          prev,
        ),
      );
    }
  }

  const { accepted } = filter;
  const hasPoints = accepted.length > 0;
  if (!hasPoints && position !== null) setPosition(null);

  const acceptedRef = useRef(accepted);
  const arrivedAtRef = useRef(0);
  const bearingRef = useRef(bearing);
  const routeRef = useRef(routePath);

  useEffect(() => {
    acceptedRef.current = accepted;
    arrivedAtRef.current = performance.now();
  }, [accepted]);

  useEffect(() => {
    bearingRef.current = bearing;
  }, [bearing]);

  useEffect(() => {
    routeRef.current = routePath;
  }, [routePath]);

  useEffect(() => {
    if (!hasPoints) return;

    let frame = 0;
    let lastFrameAt = performance.now();
    let clock: number | null = null;
    let drawn: LatLng | null = null;
    let headingTarget: number | null = null;
    // Where the points are along the route; worked out again only for new points or a new route.
    let road: RoadTrack | null = null;

    const step = () => {
      const now = performance.now();
      const track = acceptedRef.current;
      const newest = track[track.length - 1];

      if (newest) {
        const liveTime =
          Date.parse(newest.timestamp) + (now - arrivedAtRef.current);
        clock = advancePlayback(clock, track, liveTime, now - lastFrameAt);
        const sample = clock === null ? null : sampleTrack(track, clock);

        const path = routeRef.current;
        if (path && path.length >= 2) {
          if (road?.track !== track || road.path !== path) {
            road = { track, path, lengths: routeLengths(path), along: alongRoute(path, track) };
          }
        } else {
          road = null;
        }

        if (sample) {
          const position = (road && onRoad(road, sample)) ?? sample.position;
          if (drawn?.lat !== position.lat || drawn?.lng !== position.lng) {
            drawn = position;
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
