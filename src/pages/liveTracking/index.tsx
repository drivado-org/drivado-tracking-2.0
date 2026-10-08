import Tracking from "@/pages/liveTracking/tracking/index";
import LiveTrackingDashboard from "./dashboard";

const LiveTracking = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-1/2 overflow-y-auto border-r">
        <LiveTrackingDashboard />
      </div>

      <div className="w-1/2 overflow-y-auto">
        <Tracking />
      </div>
    </div>
  );
};

export default LiveTracking;
