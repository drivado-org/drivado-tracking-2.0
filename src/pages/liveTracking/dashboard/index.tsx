import BookingStatus, {
  type BookingStatusData,
} from "./components/BookingStatus";
import DriverDetails from "./components/DriverDetails";
import TripMetrics, { type TripMetricsData } from "./components/TripMetrics";
import JourneyDetails, { type JourneyData } from "./components/JourneyDetails";
import BookingDetails, { type BookingData } from "./components/BookingDetails";
import BookingId, { type BookingIdData } from "./components/BookingId";
import { useEffect, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import { getDriverDetailsRequest } from "@/store/liveBooking/liveBookingSlice";

interface LiveTrackingDashboardProps {
  onExpandedChange: (expanded: boolean) => void;
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

  const dispatch = useDispatch();

  const { driver } = useSelector((state: RootState) => state.liveBooking);

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
      label: "Enroute",
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
    <div className="relative flex h-full min-h-0 w-full flex-col bg-white">
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
        <BookingStatus statuses={bookingStatuses} />
        {driver && <DriverDetails driver={driver} />}
        <div
          className={`
            shrink-0 overflow-y-auto bg-[#f2eeef] py-3 shadow-sm
            ${isDetailsExpanded ? "block max-h-85" : "hidden"}
            md:block md:max-h-85
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
