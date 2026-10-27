import { useEffect, useState } from "react";
import { env } from "@/config/env";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectDriverStatus,
  startTracking,
  stopTracking,
} from "@/store/tracking/trackingSlice";
import LiveCar from "./components/LiveCar";
import MapControls from "./components/MapControls";
import MapToast, { type MapNotice } from "./components/MapToast";
import TrackingMap from "./components/TrackingMap";
import type { CameraMode } from "./constants/map";
import { destinationName } from "./utils/tripStage";

interface TrackingProps {
  tripId: string;
  /** Height covered at the top of the map (a notice): the camera and the toast stay below it. */
  topInset?: number;
}

const Tracking = ({ tripId, topInset = 0 }: TrackingProps) => {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectDriverStatus);
  // tap goes up on every button tap, even for the view already in use.
  const [camera, setCamera] = useState<{ mode: CameraMode; tap: number }>({
    mode: "journey",
    tap: 0,
  });
  const [notice, setNotice] = useState<MapNotice | null>(null);

  useEffect(() => {
    dispatch(startTracking({ tripID: tripId }));
    return () => {
      dispatch(stopTracking());
    };
  }, [dispatch, tripId]);

  const tapCamera = (mode: CameraMode) =>
    setCamera(({ tap }) => ({ mode, tap: tap + 1 }));

  const recenter = () => {
    if (camera.mode === "journey") {
      tapCamera("follow");
      setNotice({ text: "Locked on the vehicle", icon: "lock" });
    } else {
      tapCamera("journey");
      setNotice({ text: `Vehicle and ${destinationName(status)} in view`, icon: "view" });
    }
  };

  return (
    <div className="relative h-full w-full">
      <TrackingMap apiKey={env.googleMapsApiKey} mapId={env.googleMapsMapId}>
        <LiveCar
          cameraMode={camera.mode}
          cameraTap={camera.tap}
          topInset={topInset}
          onCameraModeChange={(mode) => setCamera(({ tap }) => ({ mode, tap }))}
          onNotice={setNotice}
        />
      </TrackingMap>
      <MapToast notice={notice} topInset={topInset} />
      <MapControls
        cameraMode={camera.mode}
        onShowRoute={() => tapCamera("route")}
        onRecenter={recenter}
      />
    </div>
  );
};

export default Tracking;
