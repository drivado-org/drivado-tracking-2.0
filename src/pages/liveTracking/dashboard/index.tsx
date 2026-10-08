import BookingStatus, {
  type BookingStatusData,
} from "./components/BookingStatus";
import DriverDetails from "./components/DriverDetails";
import LiveTrackingMap from "../tracking/index";
import TripMetrics, { type TripMetricsData } from "./components/TripMetrics";
import JourneyDetails, { type JourneyData } from "./components/JourneyDetails";
import BookingDetails, { type BookingData } from "./components/BookingDetails";
import BookingId, { type BookingIdData } from "./components/BookingId";
import { useEffect, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import { getDriverDetailsRequest } from "@/store/liveBooking/liveBookingSlice";

const LiveTrackingDashboard = () => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const dispatch = useDispatch();

  const { driver, loading, error } = useSelector(
    (state: RootState) => state.liveBooking,
  );

  useEffect(() => {
    dispatch(getDriverDetailsRequest());
  }, [dispatch]);

  const bookingData: BookingData = {
    passengerName: "Priya Sharma",
    companyName: "Meridian Capital",
    passengers: 2,
    luggage: 3,
    flight: "BA 142",
  };

  const journeyData: JourneyData = {
    distance: "12.5 km",
    pickup: {
      pickupLocation: "Heathrow T5 · Arrivals",
      address: "123 Main Street, New York, NY 10001",
    },
    dropoff: {
      dropoffLocation: "The Savoy",
      address: "456 Oak Avenue, Los Angeles, CA 90001",
    },
  };

  const bookingIdData: BookingIdData = {
    bookingId: "D0923-L-QRTKVM",
    vehicleType: "Standard Sedan",
  };

  const tripMetricsData: TripMetricsData = {
    duration: 68,
    distance: 12.5,
    dropOffTime: "17:53",
  };

  const bookingStatuses: BookingStatusData[] = [
    {
      label: "En route",
      time: "16:44",
      completed: true,
    },
    {
      label: "Arrived",
      time: "17:02",
      completed: true,
    },
    {
      label: "On board",
      time: "17:08",
      completed: true,
    },
    {
      label: "Complete",
      completed: true,
    },
  ];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white md:flex-row">
      <div
        className={`
          order-2 flex w-full flex-col md:order-1 md:h-full md:w-95 md:min-w-95 md:shrink-0
          ${isDetailsExpanded ? "h-[85%]" : "h-[48%]"}
        `}
      >
        {/* Mobile Header */}
        <DashboardHeader
          isExpanded={isDetailsExpanded}
          onToggle={() => setIsDetailsExpanded((prev) => !prev)}
        />
        <TripMetrics metrics={tripMetricsData} />
        <BookingId booking={bookingIdData} />
        <BookingStatus statuses={bookingStatuses} />
        {driver && <DriverDetails driver={driver} />}
        <div
          className={`
            overflow-y-auto bg-[#f2eeef] py-3 shadow-sm
            ${isDetailsExpanded ? "block" : "hidden"}
            md:block md:max-h-85
          `}
        >
          <JourneyDetails journey={journeyData} />
          <BookingDetails booking={bookingData} />
        </div>
      </div>

      {/* Tracking Map */}
      <div className="order-1 h-full w-full md:order-2 md:h-full md:flex-1">
        <LiveTrackingMap />
      </div>
    </div>
  );
};

export default LiveTrackingDashboard;
