import Tracking from "@/pages/liveTracking/tracking/index";
import LiveTrackingDashboard from "./dashboard";
import { useEffect, useState } from "react";
import DIcon from "@/assets/images/d-icon.png";
// import { X } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import { selectEta } from "@/store/route/routeSlice";
import { selectDriverStatus } from "@/store/tracking/trackingSlice";
import type { DriverStatus } from "@/types/tracking";
import { toEtaMinutes } from "@/utils/etaFormat";
// import { Button } from "@/components/ui/button";
import JourneyComplete from "./journeyComplete";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import { getBookingDetailsRequest } from "@/store/liveBooking/liveBookingSlice";

const bannerText = (
  status: DriverStatus | null,
  dropoffLocation: string,
  timeLeft: string,
): { title: string; detail: string; left?: string } => {
  switch (status) {
    case "ENROUTE":
      return { title: "Driver on the way", detail: `Pickup ${timeLeft} away` };
    case "ARRIVED":
      return {
        title: "Your driver has arrived",
        detail: "Waiting at the pickup",
      };
    case "COMPLETED":
      return { title: "You've arrived", detail: dropoffLocation };
    case "NOSHOW":
      return { title: "Trip ended", detail: "Passenger no show" };
    default:
      return {
        title: "Almost there!",
        detail: `${dropoffLocation}`,
        left: `${timeLeft} away`,
      };
  }
};

interface TrackingMapProps {
  isJourneyCompleted?: boolean;
  dropoffLocation?: string;
  timeLeft?: string;
}

const LiveTracking = ({ isJourneyCompleted = true }: TrackingMapProps) => {
  const [showNotification, setShowNotification] = useState(isJourneyCompleted);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  const [showJourneyComplete, setShowJourneyComplete] = useState(false);

  const { tripId } = useParams<{ tripId: string }>();

  const dispatch = useDispatch();

  useEffect(() => {
    if (tripId) {
      console.log("Fetching booking details for tripId:", tripId);
      dispatch(getBookingDetailsRequest(tripId));
    }
  }, [dispatch, tripId]);
  const { driver, bookingDetails } = useSelector(
    (state: RootState) => state.liveBooking,
  );

  const eta = useAppSelector(selectEta);
  const etaTimeLeft = eta ? `${toEtaMinutes(eta.etaSeconds)} min` : "";
  const status = useAppSelector(selectDriverStatus);
  const banner = bannerText(
    status,
    bookingDetails?.dropOffName ?? "",
    etaTimeLeft,
  );

  const completedTrip = {
    duration: eta ? toEtaMinutes(eta.etaSeconds) : 0,
    distance: eta ? eta.distanceMeters / 1000 : 0,
    // dropoffLocation,
    dropoffLocation: bookingDetails?.dropOffName ?? "",
    vehicleType: bookingDetails?.vehicleType ?? "",
    bookingId: bookingDetails?.bookingId ?? "",
    // bookingLabel: "Booking",
  };

  useEffect(() => {
    if (status === "COMPLETED") {
      setShowJourneyComplete(true);
    }
  }, [status]);

  useEffect(() => {
    if (!showNotification) return;

    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [showNotification]);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden flex-col md:flex-row bg-slate-100">
      <div className="relative order-1 h-[52%] min-h-0 w-full shrink-0 overflow-hidden md:order-2 md:h-full md:w-0 md:flex-1">
        <div className="absolute inset-0">
          {tripId && (
            <Tracking tripId={tripId} topInset={showNotification ? 68 : 0} />
          )}
        </div>
        {showNotification && (
          <div className="absolute left-3 right-3 top-2 z-10 flex items-center gap-3 rounded-2xl bg-[#1d1e23] p-2.5 text-white shadow-md sm:left-auto sm:right-3 sm:w-[50%] md:left-3 md:right-3 md:w-auto lg:left-auto lg:right-3 lg:w-[40%] xl:w-[30%]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <img src={DIcon} />
            </div>

            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-bold leading-5">{banner.title}</p>

              <div className="flex items-center">
                <p className="w-60 truncate text-xs font-medium text-[#a2a3a7] pr-2">
                  {banner.detail}
                </p>
                <p className="text-xs font-medium text-[#a2a3a7]">
                  {banner.left}
                </p>
              </div>
            </div>

            {/* <Button
              type="button"
              onClick={() => setShowNotification(false)}
              aria-label="Close journey notification"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2b2b2d] text-emerald-50 transition-colors hover:bg-[#39393a] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </div>
        )}

        {showJourneyComplete && driver && (
          <JourneyComplete
            trip={completedTrip}
            driver={driver}
            onSubmitFeedback={(feedback) => {
              console.log("Feedback:", feedback);
            }}
            onSkip={() => setShowJourneyComplete(false)}
          />
        )}
      </div>

      <div
        className={`absolute bottom-0 left-0 z-20 w-full overflow-visible bg-white transition-[height] duration-300 ease-in-out ${isDashboardExpanded ? "h-[85%]" : "h-[48%]"} md:relative md:bottom-auto md:left-auto md:order-1 md:h-full md:w-95 md:min-w-95 md:shrink-0 md:overflow-hidden`}
      >
        <LiveTrackingDashboard
          onExpandedChange={setIsDashboardExpanded}
          // tripId={tripId ?? ""}
        />
      </div>
      {/* TEMPORARY TEST BUTTON */}
      {/* <button
        type="button"
        onClick={() => setShowJourneyComplete(true)}
        className="absolute bottom-4 right-20 z-60 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-emerald-800"
      >
        Test Completed Modal
      </button> */}
    </div>
  );
};

export default LiveTracking;
