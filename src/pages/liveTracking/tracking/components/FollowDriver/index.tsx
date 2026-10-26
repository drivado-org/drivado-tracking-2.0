import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";
import {
  CAMERA_EASE_PER_FRAME,
  CAMERA_JUMP_METERS,
  FOLLOW_PAUSE_AFTER_DRAG_MS,
  FOLLOW_ZOOM,
} from "../../constants/tracking";
import { distanceMeters } from "../../utils/locationFilter";
const SETTLED_METERS = 0.05;

type FollowDriverProps = {
  position: LatLng | null;
  /** false while the overview shows the whole trip: the camera is left alone. */
  enabled?: boolean;
};

const FollowDriver = ({ position, enabled = true }: FollowDriverProps) => {
  const map = useMap();
  const positionRef = useRef(position);
  const pausedUntilRef = useRef(0);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    // Back from the overview: zoom in and follow the car right away, even after a drag.
    if (enabled && !enabledRef.current && map) {
      pausedUntilRef.current = 0;
      map.setZoom(FOLLOW_ZOOM);
    }
    enabledRef.current = enabled;
  }, [enabled, map]);

  useEffect(() => {
    if (!map) return;

    const dragListener = map.addListener("dragstart", () => {
      pausedUntilRef.current = Date.now() + FOLLOW_PAUSE_AFTER_DRAG_MS;
    });

    let frame = 0;
    const step = () => {
      const car = positionRef.current;
      const center = map.getCenter();

      if (car && enabledRef.current && Date.now() >= pausedUntilRef.current) {
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
