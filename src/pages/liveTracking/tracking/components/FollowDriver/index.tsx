import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";
import {
  CAMERA_EASE_PER_FRAME,
  CAMERA_JUMP_METERS,
  FOLLOW_PAUSE_AFTER_DRAG_MS,
} from "../../constants/tracking";
import { distanceMeters } from "../../utils/locationFilter";

/** Closer than this, the camera is on the car: no more camera moves until it drives on. */
const SETTLED_METERS = 0.05;

type FollowDriverProps = {
  /** Where the car is drawn this frame. */
  position: LatLng | null;
};

/**
 * Keeps the car in the middle of the map. Renders nothing.
 * Glides the camera a share of the way to the car every frame, so the map scrolls as smoothly
 * as the car moves (panTo per GPS point would jerk the view ahead of the car).
 * A drag by the user pauses following for FOLLOW_PAUSE_AFTER_DRAG_MS; then it glides back.
 */
const FollowDriver = ({ position }: FollowDriverProps) => {
  const map = useMap();
  const positionRef = useRef(position);
  const pausedUntilRef = useRef(0);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!map) return;

    const dragListener = map.addListener("dragstart", () => {
      pausedUntilRef.current = Date.now() + FOLLOW_PAUSE_AFTER_DRAG_MS;
    });

    let frame = 0;
    const step = () => {
      const car = positionRef.current;
      (globalThis as any).__dbg = { car, paused: pausedUntilRef.current, now: Date.now(), hasCenter: !!map.getCenter() };
      const center = map.getCenter();

      if (car && Date.now() >= pausedUntilRef.current) {
        const camera = center ? { lat: center.lat(), lng: center.lng() } : null;
        const gap = camera ? distanceMeters(camera, car) : Infinity;

        if (gap > CAMERA_JUMP_METERS) {
          map.moveCamera({ center: car });
        } else if (camera && gap > SETTLED_METERS) {
          map.moveCamera({
            center: {
              lat: camera.lat + (car.lat - camera.lat) * CAMERA_EASE_PER_FRAME,
              lng: camera.lng + (car.lng - camera.lng) * CAMERA_EASE_PER_FRAME,
            },
          });
        }
      }

      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      dragListener.remove();
    };
  }, [map]);

  return null;
};

export default FollowDriver;
