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
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);

  const { tripId } = useParams<{ tripId: string }>();

  return (
    <div className="relative flex h-dvh w-full overflow-hidden flex-col md:flex-row bg-slate-100">
      {/* TRACKING MAP */}
      <div className="relative order-1 h-[52%] min-h-0 w-full shrink-0 overflow-hidden md:order-2 md:h-full md:w-0 md:flex-1">
        <div className="absolute inset-0">
          {tripId && <Tracking tripId={tripId} />}
        </div>
        {showNotification && (
          <div className="absolute left-3 right-3 top-2 z-10 flex items-center gap-3 rounded-2xl bg-[#1d1e23] p-2.5 text-white shadow-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
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
      {/* TRACKING DASHBOARD */}
      <div
        className={`
        absolute bottom-0 left-0 z-20 w-full
        overflow-visible bg-[#f2eeef]
        transition-[height] duration-300 ease-in-out
        ${isDashboardExpanded ? "h-[85%]" : "h-[48%]"}
        md:relative md:bottom-auto md:left-auto
        md:order-1 md:h-full md:w-95 md:min-w-95
        md:shrink-0 md:overflow-hidden
      `}
      >
        <LiveTrackingDashboard onExpandedChange={setIsDashboardExpanded} />
      </div>
    </div>
  );
};

export default LiveTracking;
