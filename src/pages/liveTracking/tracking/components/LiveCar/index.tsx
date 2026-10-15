import { useAppSelector } from "@/redux/hooks";
import {
  selectBearing,
  selectIsRerouting,
  selectRoutePath,
} from "@/store/route/routeSlice";
import { selectTrackPoints } from "@/store/tracking/trackingSlice";
import useCarAnimation from "../../hooks/useCarAnimation";
import CarMarker from "../CarMarker";
import FollowDriver from "../FollowDriver";
import RoutePolyline from "../RoutePolyline";

/**
 * Everything that moves with the car: the car, the route ahead of it and the camera.
 * Its own component so the 60 fps animation re-renders only these layers, not the map.
 */
const LiveCar = () => {
  const points = useAppSelector(selectTrackPoints);
  const bearing = useAppSelector(selectBearing);
  const routePath = useAppSelector(selectRoutePath);
  const rerouting = useAppSelector(selectIsRerouting);
  const { position, heading } = useCarAnimation(points, bearing);

  return (
    <>
      <RoutePolyline path={routePath} carPosition={position} rerouting={rerouting} />
      <CarMarker position={position} heading={heading} />
      <FollowDriver position={position} />
    </>
  );
};

export default LiveCar;
