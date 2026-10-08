import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";

type FollowDriverProps = {
  position: LatLng | null;
};

/** Keeps the driver in view: pans the map whenever the position changes. Renders nothing. */
const FollowDriver = ({ position }: FollowDriverProps) => {
  const map = useMap();
  const lat = position?.lat;
  const lng = position?.lng;

  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return;
    map.panTo({ lat, lng });
  }, [map, lat, lng]);

  return null;
};

export default FollowDriver;
