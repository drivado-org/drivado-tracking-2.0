import { useEffect } from "react";
import { env } from "@/config/env";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectDriverPosition,
  startTracking,
  stopTracking,
} from "@/store/tracking/trackingSlice";
import CarMarker from "./components/CarMarker";
import FollowDriver from "./components/FollowDriver";
import TrackingMap from "./components/TrackingMap";

interface TrackingProps {
  tripId: string;
}

const Tracking = ({ tripId }: TrackingProps) => {
  const dispatch = useAppDispatch();
  const position = useAppSelector(selectDriverPosition);

  useEffect(() => {
    dispatch(startTracking({ tripID: tripId }));
    return () => {
      dispatch(stopTracking());
    };
  }, [dispatch, tripId]);

  return (
    <div className="h-svh w-full">
      <TrackingMap apiKey={env.googleMapsApiKey} mapId={env.googleMapsMapId}>
        <CarMarker position={position} />
        <FollowDriver position={position} />
      </TrackingMap>
    </div>
  );
};

export default Tracking;
