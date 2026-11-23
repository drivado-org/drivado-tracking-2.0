import BookingStatus from "./components/BookingStatus";
import DriverDetails from "./components/DriverDetails";
import TripMetrics from "./components/TripMetrics";
import JourneyDetails, { type JourneyData } from "./components/JourneyDetails";
import BookingDetails, { type BookingData } from "./components/BookingDetails";
import BookingId from "./components/BookingId";
import { useRef, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
// import { getDriverDetailsRequest } from "@/store/liveBooking/liveBookingSlice";
import { selectEta } from "@/store/route/routeSlice";
import { selectDriverStatus } from "@/store/tracking/trackingSlice";
import { formatClockTime, toEtaMinutes, toKilometres } from "@/utils/etaFormat";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  BookingIdData,
  BookingStatusData,
  TripMetricsData,
} from "@/types/liveBooking";

const statusSteps = [
  { label: "Enroute", value: "ENROUTE" },
  { label: "Arrived", value: "ARRIVED" },
  { label: "POB", value: "POB" },
  { label: "Completed", value: "COMPLETED" },
];

const getBookingStatuses = (driverStatus?: string): BookingStatusData[] => {
  const currentIndex = statusSteps.findIndex(
    (step) => step.value === driverStatus,
  );

  return statusSteps.map((step, index) => ({
    label: step.label,
    completed: currentIndex >= 0 && index <= currentIndex,
    active: currentIndex >= 0 && index === currentIndex + 1,
  }));
};

interface LiveTrackingDashboardProps {
  onExpandedChange: (expanded: boolean) => void;
  // tripId: string;
}

const LiveTrackingDashboard = ({
  onExpandedChange,
}: LiveTrackingDashboardProps) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // ----------- START MOBILE SWIPE HANDLING -------------

  const pointerStart = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);

  const didDrag = useRef(false);

  const handleToggle = () => {
    setIsDetailsExpanded((prev) => {
      const next = !prev;
      onExpandedChange(next);
      return next;
    });
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;

    pointerStart.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;

    if (!start || start.pointerId !== e.pointerId) return;

    const deltaY = e.clientY - start.y;
    const deltaX = e.clientX - start.x;

    pointerStart.current = null;

    if (Math.abs(deltaY) < 50 || Math.abs(deltaY) < Math.abs(deltaX)) {
      return;
    }

    // Swipe up - Expand
    if (deltaY < -50 && !isDetailsExpanded) {
      didDrag.current = true;
      handleToggle();
    }

    // Swipe down - Collapse
    else if (deltaY > 50 && isDetailsExpanded) {
      didDrag.current = true;
      handleToggle();
    }
  };

  const handlePointerCancel = () => {
    pointerStart.current = null;
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      didDrag.current = false;
    }
  };

  // -------END MOBILE SWIPE HANDLING------------------

  // const handleToggle = () => {
  //   setIsDetailsExpanded((prev) => {
  //     const next = !prev;
  //     onExpandedChange(next);
  //     return next;
  //   });
  // };

  // const dispatch = useDispatch();
  const eta = useSelector(selectEta);

  const { driver, bookingDetails, bookingMetrics } = useSelector(
    (state: RootState) => state.liveBooking,
  );

  // const etaEvent =
  //   (sseEvents.eta as {
  //     driverStatus?: DriverStatus;
  //     eta?: number;
  //     distance?: number;
  //   }) || undefined;

  // const routeEvent =
  //   (sseEvents.route_change as { driverStatus?: DriverStatus }) || undefined;

  // const driverStatus = eta?.driverStatus || routeEvent?.driverStatus;

  // const routeChange = sseEvents.route_change as
  //   | { driverStatus?: DriverStatus }
  //   | undefined;

  // From every stream event (eta, route_change, vehicle_meta, snapshot), not only eta.
  const driverStatus = useSelector(selectDriverStatus);

  // const bookingStatuses = getBookingStatuses(driverStatus ?? undefined);

  const statuses = getBookingStatuses(driverStatus ?? undefined);

  const bookingData: BookingData = {
    passengerName: bookingDetails?.passengerName ?? "",
    companyName: "",
    passengers: bookingDetails?.passengers ?? 0,
    luggage: bookingDetails?.luggage ?? 0,
    flightNo: bookingDetails?.flightNo ?? "",
  };

  const journeyData: JourneyData = {
    distance: bookingMetrics ? `${bookingMetrics.distance} km` : "--",
    duration: bookingMetrics ? `${bookingMetrics.duration}` : "--",
    pickup: {
      pickupLocation: bookingDetails?.pickUpName ?? "--",
      address: "",
    },
    dropoff: {
      dropoffLocation: bookingDetails?.dropOffName ?? "--",
      address: "",
    },
  };

  const bookingIdData: BookingIdData = {
    bookingId: bookingDetails?.bookingId ?? "",
    vehicleType: bookingDetails?.vehicleType ?? "",
  };

  // From the stream's `eta` events; "--" until the first one.
  const tripMetricsData: TripMetricsData = {
    duration: eta ? toEtaMinutes(eta?.etaSeconds) : null,
    distance: eta ? toKilometres(eta?.distanceMeters) : null,
    dropOffTime: eta ? formatClockTime(eta?.arrivalTime) : null,
  };

  return (
    <div
      className="tracking-dashboard relative flex h-95 min-h-0 w-full flex-col bg-white touch-none md:touch-auto md:h-full"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
      // onTouchCancel={() => {
      //   touchStart.current = null;
      // }}
    >
      {/* Mobile Header */}
      <DashboardHeader
        isExpanded={isDetailsExpanded}
        // handleToggle={() => setIsDetailsExpanded((prev) => !prev)}
        handleToggle={handleToggle}
      />

      {/* Dashboard Content */}
      <div
        className={`
          order-2 flex min-h-0 w-full flex-col
    md:order-1 md:h-full md:min-h-0 md:w-95 md:min-w-95 md:shrink-0
          ${isDetailsExpanded ? "h-[85%]" : "h-[48%]"}
        `}
      >
        <TripMetrics metrics={tripMetricsData} />
        <BookingId booking={bookingIdData} />
        <BookingStatus statuses={statuses} />
        {driver && <DriverDetails driver={driver} />}

        <div
          data-sheet-scroll
          className={`custom-scrollbar min-h-0 shrink-0 overflow-y-auto bg-[#f2eeef] py-3 shadow-sm
    ${isDetailsExpanded ? "block max-h-65 xxs:max-h-none xs:max-h-90 sm:max-h-75" : "hidden"}
    md:block md:max-h-none md:flex-1 md:overflow-y-auto
                    `}
          style={{
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
            overscrollBehaviorY: "contain",
          }}
        >
          <JourneyDetails journey={journeyData} />
          <BookingDetails booking={bookingData} />
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingDashboard;
