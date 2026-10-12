import Tracking from "@/pages/liveTracking/tracking/index";
import LiveTrackingDashboard from "./dashboard";
import { useState } from "react";
import DIcon from "@/assets/images/d-icon.png";
import { X } from "lucide-react";
import { useParams } from "react-router-dom";

interface TrackingMapProps {
  isJourneyCompleted?: boolean;
  dropoffLocation?: string;
  timeLeft?: string;
}

const LiveTracking = ({
  isJourneyCompleted = true,
  dropoffLocation = "The Savoy",
  timeLeft = "1 min",
}: TrackingMapProps) => {
  const [showNotification, setShowNotification] = useState(isJourneyCompleted);

  const { tripId } = useParams<{ tripId: string }>();

  return (
    <div className="flex space-x-2 h-screen w-full flex-col md:flex-row bg-slate-100">
      <div className="overflow-y-auto bg-[#f2eeef] md:h-full md:w-95 md:min-w-95 md:shrink-0">
        <LiveTrackingDashboard />
      </div>

      <div className="relative h-full w-full overflow-hidden">
        <div className="absolute inset-0">
          <div className="flex h-full items-center justify-center bg-slate-100">
            {tripId && <Tracking tripId={tripId} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
