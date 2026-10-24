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

const LiveCar = () => {
  const points = useAppSelector(selectTrackPoints);
  const bearing = useAppSelector(selectBearing);
  const routePath = useAppSelector(selectRoutePath);
  const rerouting = useAppSelector(selectIsRerouting);
  const { position, heading } = useCarAnimation(points, bearing);

  return (
    <>
      <RoutePolyline
        path={routePath}
        carPosition={position}
        rerouting={rerouting}
      />
      <CarMarker position={position} heading={heading} />
      <FollowDriver position={position} />
    </>
  );
};

export default LiveCar;
