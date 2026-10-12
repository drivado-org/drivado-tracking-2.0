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
        {showNotification && (
          <div className="absolute left-3 right-3 top-2 z-10 flex items-center gap-3 rounded-2xl bg-[#1d1e23] p-2.5 text-white shadow-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ">
              <img src={DIcon} />
            </div>

            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-bold leading-5">Almost there!</p>

              <p className="truncate text-xs font-medium text-[#a2a3a7]">
                {dropoffLocation} - {timeLeft} away
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowNotification(false)}
              aria-label="Close journey notification"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2b2b2d] text-emerald-50 transition-colors hover:bg-emerald-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;
