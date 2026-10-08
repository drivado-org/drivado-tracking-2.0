import { useEffect } from "react";
import { env } from "@/config/env";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectDriverPosition,
  startTracking,
  stopTracking,
} from "@/redux/tracking/trackingSlice";
import { getAuthToken } from "@/utils/authToken";
import CarMarker from "./components/CarMarker";
import FollowDriver from "./components/FollowDriver";
import TrackingMap from "./components/TrackingMap";
import { TEST_TRIP_ID } from "./constants/tracking";

const Tracking = () => {
  const dispatch = useAppDispatch();
  const position = useAppSelector(selectDriverPosition);

  useEffect(() => {
    const token = getAuthToken();
    dispatch(startTracking({ tripID: TEST_TRIP_ID, ...(token ? { token } : {}) }));
    return () => {
      dispatch(stopTracking());
    };
  }, [dispatch]);

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
