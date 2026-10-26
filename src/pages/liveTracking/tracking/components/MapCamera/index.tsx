import { useEffect, useMemo, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";
import type { CameraMode } from "../../constants/map";
import {
  AUTO_FOLLOW_METERS,
  AUTO_FOLLOW_MS,
  CAMERA_JUMP_METERS,
  FOLLOW_EASE_PER_SECOND,
  FOLLOW_ZOOM,
  JOURNEY_EASE_PER_SECOND,
  JOURNEY_MAX_ZOOM,
  JOURNEY_PADDING_PX,
  ROUTE_MAX_ZOOM,
  ROUTE_PADDING_PX,
} from "../../constants/tracking";
import {
  type Camera,
  easeFactor,
  easeInOutCubic,
  fitCamera,
  lerpCamera,
} from "../../utils/camera";
import { distanceMeters } from "../../utils/locationFilter";
import type { MapNotice } from "../MapToast";

const SETTLED_METERS = 0.05;
const SETTLED_ZOOM = 0.001;
/** A frame after a long pause (hidden tab) moves no further than one this long. */
const MAX_FRAME_SECONDS = 0.1;

type MapCameraProps = {
  mode: CameraMode;
  /** Goes up on every button tap: the whole route and the lock jump into place at once. */
  tap: number;
  car: LatLng | null;
  /** The road still to drive. */
  ahead: LatLng[];
  route: LatLng[] | null;
  dropOff: LatLng | null;
  /** What the route ends at, for the toasts ("pickup", "drop-off"). */
  destinationName?: string;
  /** Height covered at the top of the map (a notice): framed points stay below it. */
  topInset?: number;
  onModeChange: (mode: CameraMode) => void;
  onNotice?: (notice: MapNotice) => void;
};

type AutoFollow = { start: number; from: Camera };

const readCamera = (map: google.maps.Map): Camera | null => {
  const center = map.getCenter();
  const zoom = map.getZoom();
  return center && zoom !== undefined
    ? { center: { lat: center.lat(), lng: center.lng() }, zoom }
    : null;
};

const sizeOf = (map: google.maps.Map) => {
  const div = map.getDiv();
  return { width: div.clientWidth, height: div.clientHeight };
};

const pathMeters = (path: LatLng[]) =>
  path.reduce((sum, p, i) => (i === 0 ? 0 : sum + distanceMeters(path[i - 1], p)), 0);

/**
 * Moves the camera for the map buttons. Renders no DOM of its own.
 * - journey (default): frames the car, the road left and the drop-off, and keeps re-framing
 *   as the car drives, so the view tightens by itself near the drop-off.
 * - follow: locked on the car. The user can still pinch the zoom.
 * - route: the whole route, fitted once. Near the drop-off it glides onto the car and
 *   switches to follow, once per trip.
 * - free: a drag from any view, or a pinch in the journey view, leaves the map to the user.
 */
const MapCamera = ({
  mode,
  tap,
  car,
  ahead,
  route,
  dropOff,
  destinationName = "drop-off",
  topInset = 0,
  onModeChange,
  onNotice,
}: MapCameraProps) => {
  const map = useMap();
  const metersLeft = useMemo(() => (dropOff ? pathMeters(ahead) : Infinity), [ahead, dropOff]);
  const latestRef = useRef({
    mode,
    car,
    ahead,
    route,
    dropOff,
    destinationName,
    topInset,
    metersLeft,
  });
  const callbacksRef = useRef({ onModeChange, onNotice });
  const autoRef = useRef<AutoFollow | null>(null);
  const autoArmedRef = useRef(false);

  useEffect(() => {
    latestRef.current = {
      mode,
      car,
      ahead,
      route,
      dropOff,
      destinationName,
      topInset,
      metersLeft,
    };
    callbacksRef.current = { onModeChange, onNotice };
  });

  const setMode = (next: CameraMode) => {
    latestRef.current.mode = next; // before the parent re-renders: the next frame already obeys
    callbacksRef.current.onModeChange(next);
  };

  const fitRoute = (map: google.maps.Map) => {
    const { route, car, topInset } = latestRef.current;
    const points = [...(route ?? []), ...(car ? [car] : [])];
    const camera = fitCamera(
      points,
      sizeOf(map),
      { ...ROUTE_PADDING_PX, top: ROUTE_PADDING_PX.top + topInset },
      ROUTE_MAX_ZOOM,
    );
    if (camera) map.moveCamera(camera);
  };

  // A tap jumps the route and the lock into place; the journey view glides in the frame loop.
  useEffect(() => {
    if (!map || tap === 0) return;
    autoRef.current = null;
    const { mode, car } = latestRef.current;
    if (mode === "route") fitRoute(map);
    if (mode === "follow" && car) map.moveCamera({ center: car, zoom: FOLLOW_ZOOM });
  }, [map, tap]);

  // The whole route stays fitted through a new route and a resized window.
  useEffect(() => {
    if (!map || mode !== "route") return;
    fitRoute(map);
    const onResize = () => fitRoute(map);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [map, mode, route]);

  // The user taking over.
  useEffect(() => {
    if (!map) return;

    const dragListener = map.addListener("dragstart", () => {
      autoRef.current = null;
      if (latestRef.current.mode !== "free") setMode("free");
    });

    const div = map.getDiv();
    const onZoomByHand = (event: Event) => {
      if (event instanceof TouchEvent && event.touches.length < 2) return;
      if (latestRef.current.mode === "journey") setMode("free");
    };
    const options = { capture: true, passive: true };
    div.addEventListener("wheel", onZoomByHand, options);
    div.addEventListener("touchstart", onZoomByHand, options);

    return () => {
      dragListener.remove();
      div.removeEventListener("wheel", onZoomByHand, options);
      div.removeEventListener("touchstart", onZoomByHand, options);
    };
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const glide = (from: Camera, to: Camera, k: number) => {
      if (distanceMeters(from.center, to.center) > CAMERA_JUMP_METERS) {
        map.moveCamera(to);
        return;
      }
      if (
        distanceMeters(from.center, to.center) > SETTLED_METERS ||
        Math.abs(to.zoom - from.zoom) > SETTLED_ZOOM
      ) {
        map.moveCamera(lerpCamera(from, to, k));
      }
    };

    let frame = 0;
    let last: number | null = null;
    const step = (now: number) => {
      const dt = last === null ? 0 : Math.min(MAX_FRAME_SECONDS, (now - last) / 1000);
      last = now;
      const { mode, car, ahead, dropOff, destinationName, topInset, metersLeft } =
        latestRef.current;
      const current = readCamera(map);

      if (car && current) {
        if (mode === "route" && !autoArmedRef.current && metersLeft <= AUTO_FOLLOW_METERS) {
          autoArmedRef.current = true;
          autoRef.current = { start: now, from: current };
          setMode("follow");
          callbacksRef.current.onNotice?.({
            text: `Approaching ${destinationName} — following the vehicle`,
            icon: "lock",
          });
        }

        const auto = autoRef.current;
        if (auto) {
          const k = Math.min(1, (now - auto.start) / AUTO_FOLLOW_MS);
          map.moveCamera(
            lerpCamera(auto.from, { center: car, zoom: FOLLOW_ZOOM }, easeInOutCubic(k)),
          );
          if (k >= 1) autoRef.current = null;
        } else if (mode === "follow") {
          glide(
            current,
            { center: car, zoom: current.zoom },
            easeFactor(FOLLOW_EASE_PER_SECOND, dt),
          );
        } else if (mode === "journey") {
          const target = fitCamera(
            [car, ...ahead, ...(dropOff ? [dropOff] : [])],
            sizeOf(map),
            { ...JOURNEY_PADDING_PX, top: JOURNEY_PADDING_PX.top + topInset },
            JOURNEY_MAX_ZOOM,
          );
          if (target) glide(current, target, easeFactor(JOURNEY_EASE_PER_SECOND, dt));
        }
      }

      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [map]);

  return null;
};

export default MapCamera;
