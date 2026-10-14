import { useEffect } from "react";
import { env } from "@/config/env";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectDriverPoint,
  startTracking,
  stopTracking,
} from "@/store/tracking/trackingSlice";
import CarMarker from "./components/CarMarker";
import FollowDriver from "./components/FollowDriver";
import TrackingMap from "./components/TrackingMap";
import useCarAnimation from "./hooks/useCarAnimation";

interface TrackingProps {
  tripId: string;
}

const Tracking = ({ tripId }: TrackingProps) => {
  const dispatch = useAppDispatch();
  const rawPoint = useAppSelector(selectDriverPoint);
  const { position, heading, target } = useCarAnimation(rawPoint);

  useEffect(() => {
    dispatch(startTracking({ tripID: tripId }));
    return () => {
      dispatch(stopTracking());
    };
  }, [dispatch, tripId]);

  return (
    <div className="h-svh w-full">
      <TrackingMap apiKey={env.googleMapsApiKey} mapId={env.googleMapsMapId}>
        <CarMarker position={position} heading={heading} />
        {/* Pans once per accepted point, not every animation frame. */}
        <FollowDriver position={target} />
      </TrackingMap>
    </div>
  );
};

export default Tracking;
