import { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/hooks";
import {
  selectBearing,
  selectEta,
  selectIsRerouting,
  selectRoutePath,
} from "@/store/route/routeSlice";
import {
  selectDriverStatus,
  selectTrackPoints,
} from "@/store/tracking/trackingSlice";
import useCarAnimation from "../../hooks/useCarAnimation";
import useRouteProgress from "../../hooks/useRouteProgress";
import useShownStatus from "../../hooks/useShownStatus";
import useTurningHeading from "../../hooks/useTurningHeading";
import { formatDuration, toEtaMinutes } from "@/utils/etaFormat";
import type { CameraMode } from "../../constants/map";
import {
  destinationLabel,
  destinationName,
  isDriving,
  isPickupLeg,
  statusNotice,
} from "../../utils/tripStage";
import CarMarker from "../CarMarker";
import DestinationMarker from "../DestinationMarker";
import MapCamera from "../MapCamera";
import type { MapNotice } from "../MapToast";
import RoutePolyline from "../RoutePolyline";

type LiveCarProps = {
  cameraMode?: CameraMode;
  /** Goes up on every camera button tap. */
  cameraTap?: number;
  topInset?: number;
  onCameraModeChange?: (mode: CameraMode) => void;
  onNotice?: (notice: MapNotice) => void;
};

const LiveCar = ({
  cameraMode = "journey",
  cameraTap = 0,
  topInset = 0,
  onCameraModeChange = () => {},
  onNotice,
}: LiveCarProps) => {
  const points = useAppSelector(selectTrackPoints);
  const bearing = useAppSelector(selectBearing);
  const routePath = useAppSelector(selectRoutePath);
  const rerouting = useAppSelector(selectIsRerouting);
  const eta = useAppSelector(selectEta);
  const status = useAppSelector(selectDriverStatus);

  // Once the passenger is on board, the pickup route is over: until route_change brings the
  // drop-off route, the car keeps driving on its GPS points with no route or marker.
  const [pickupRoute, setPickupRoute] = useState<typeof routePath>(null);
  if (isPickupLeg(status) && routePath && routePath !== pickupRoute) {
    setPickupRoute(routePath);
  }
  const route = !isPickupLeg(status) && routePath === pickupRoute ? null : routePath;

  const { position, heading } = useCarAnimation(points, bearing, route);
  const { remaining, carPosition, routeHeading } = useRouteProgress(
    route,
    position,
  );
  const carHeading = useTurningHeading(routeHeading ?? heading);

  // The pickup until the passenger is on board, then the drop-off.
  const destination = route?.at(-1) ?? null;
  // ARRIVED / COMPLETED wait for the drawn car to get there.
  const shownStatus = useShownStatus(status, carPosition, destination);

  useEffect(() => {
    const notice = statusNotice(shownStatus);
    if (notice) onNotice?.(notice);
  }, [shownStatus, onNotice]);

  return (
    <>
      <RoutePolyline points={remaining} rerouting={rerouting} />

      <DestinationMarker
        position={destination}
        label={destinationLabel(shownStatus)}
        pin={isPickupLeg(shownStatus)}
      />
      <CarMarker
        position={carPosition}
        heading={carHeading}
        label={
          eta && isDriving(shownStatus)
            ? formatDuration(toEtaMinutes(eta.etaSeconds))
            : null
        }
      />
      <MapCamera
        mode={cameraMode}
        tap={cameraTap}
        car={carPosition}
        ahead={remaining}
        route={route}
        dropOff={destination}
        destinationName={destinationName(shownStatus)}
        topInset={topInset}
        onModeChange={onCameraModeChange}
        onNotice={onNotice}
      />
    </>
  );
};

export default LiveCar;
