import { useEffect } from "react";
import { env } from "@/config/env";
import { useAppDispatch } from "@/redux/hooks";
import { startTracking, stopTracking } from "@/store/tracking/trackingSlice";
import LiveCar from "./components/LiveCar";
import TrackingMap from "./components/TrackingMap";

interface TrackingProps {
  tripId: string;
}

const Tracking = ({ tripId }: TrackingProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(startTracking({ tripID: tripId }));
    return () => {
      dispatch(stopTracking());
    };
  }, [dispatch, tripId]);

  return (
    <div className="h-svh w-full">
      <TrackingMap apiKey={env.googleMapsApiKey} mapId={env.googleMapsMapId}>
        <LiveCar />
      </TrackingMap>
    </div>
  );
};

export default Tracking;
