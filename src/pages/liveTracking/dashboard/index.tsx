import BookingStatus from "./components/BookingStatus";
import DriverDetails from "./components/DriverDetails";
import TripMetrics from "./components/TripMetrics";
import JourneyDetails, { type JourneyData } from "./components/JourneyDetails";
import BookingDetails, { type BookingData } from "./components/BookingDetails";
import BookingId from "./components/BookingId";
import { useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
// import { getDriverDetailsRequest } from "@/store/liveBooking/liveBookingSlice";
import { selectEta } from "@/store/route/routeSlice";
import { selectDriverStatus } from "@/store/tracking/trackingSlice";
import { formatClockTime, toEtaMinutes, toKilometres } from "@/utils/etaFormat";
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

  const handleToggle = () => {
    setIsDetailsExpanded((prev) => {
      const next = !prev;
      onExpandedChange(next);
      return next;
    });
  };

  // const dispatch = useDispatch();
  const eta = useSelector(selectEta);

  const { driver, sseConnected, bookingDetails, bookingMetrics } = useSelector(
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

  console.log("SSE connected:", sseConnected);
  // console.log("ETA event:", etaEvent);
  // console.log("Route change event:", routeEvent);
  console.log("Driver status:", driverStatus);
  console.log("Booking statuses:", statuses);
  console.log("Current driver status:", driverStatus);

  // useEffect(() => {
  //   dispatch(getDriverDetailsRequest());
  // }, [dispatch]);

  const bookingData: BookingData = {
    passengerName: bookingDetails?.passengerName ?? "",
    companyName: "",
    passengers: bookingDetails?.passengers ?? 0,
    luggage: bookingDetails?.luggage ?? 0,
    flightNo: bookingDetails?.flightNo ?? "",
  };

  const journeyData: JourneyData = {
    distance: bookingMetrics ? `${bookingMetrics.distance} km` : "--",
    duration: bookingMetrics ? `${bookingMetrics.duration} min` : "--",
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
    duration: eta ? toEtaMinutes(eta.etaSeconds) : null,
    distance: eta ? toKilometres(eta.distanceMeters) : null,
    dropOffTime: eta ? formatClockTime(eta.arrivalTime) : null,
  };

  // const bookingStatuses: BookingStatusData[] = [
  //   {
  //     label: "Enroute",
  //     time: "16:44",
  //     completed: true,
  //   },
  //   {
  //     label: "Arrived",
  //     time: "17:02",
  //     completed: true,
  //   },
  //   {
  //     label: "On board",
  //     time: "17:08",
  //     completed: true,
  //   },
  //   {
  //     label: "Complete",
  //     completed: true,
  //   },
  // ];

  // const statuses: BookingStatusData[] = [
  //   { label: "Enroute", completed: false },
  //   { label: "Arrived", completed: false },
  //   { label: "On Board", completed: false },
  //   { label: "Completed", completed: false },
  // ];

  return (
    <div className="relative flex h-95 md:h-full min-h-0 w-full flex-col bg-white">
      {/* Mobile Header */}
      <DashboardHeader
        isExpanded={isDetailsExpanded}
        // handleToggle={() => setIsDetailsExpanded((prev) => !prev)}
        handleToggle={handleToggle}
      />

      {/* Dashboard Content */}
      <div
        className={`
          order-2 flex min-h-0 w-full flex-col md:order-1 md:h-full md:w-95 md:min-w-95 md:shrink-0
          ${isDetailsExpanded ? "h-[85%]" : "h-[48%]"}
        `}
      >
        <TripMetrics metrics={tripMetricsData} />
        <BookingId booking={bookingIdData} />
        <BookingStatus statuses={statuses} />
        {driver && <DriverDetails driver={driver} />}
        <div
          className={`
            min-h-0 shrink-0 overflow-y-auto bg-[#f2eeef] py-3 shadow-sm
            ${isDetailsExpanded ? "block max-h-85" : "hidden"}
            md:block md:max-h-85 overflow-auto
          `}
        >
          <JourneyDetails journey={journeyData} />
          <BookingDetails booking={bookingData} />
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingDashboard;
