import Tracking from "@/pages/liveTracking/tracking/index";
import { useParams } from "react-router-dom";
import LiveTrackingDashboard from "./dashboard";

const LiveTracking = () => {
  const { tripId } = useParams<{ tripId: string }>();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-1/2 overflow-y-auto border-r">
        <LiveTrackingDashboard />
      </div>

      <div className="w-1/2 overflow-y-auto">
        {tripId && <Tracking tripId={tripId} />}
      </div>
    </div>
  );
};

export default LiveTracking;
