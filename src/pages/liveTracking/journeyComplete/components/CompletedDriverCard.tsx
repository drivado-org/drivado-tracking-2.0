import type { CompletedTripData, DriverData } from "@/types/liveBooking";

interface CompletedDriverCardProps {
  trip: CompletedTripData;
  driver: DriverData;
}

const CompletedDriverCard = ({ trip, driver }: CompletedDriverCardProps) => {
  const name = driver.driverName.trim();

  const initials =
    name.split(/\s+/).length > 1
      ? (name.split(/\s+/)[0][0] + name.split(/\s+/).at(-1)![0]).toUpperCase()
      : (name[0]?.toUpperCase() ?? "");

  return (
    <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-[#f6f4f5] px-3.5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-950 text-sm font-semibold text-white">
          {initials}
        </div>

        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold text-gray-900">
            {driver.driverName}
          </p>
          <p className="truncate text-xs text-gray-500">{trip.vehicleType}</p>
        </div>
      </div>

      <div className="min-w-0 text-right">
        <p className="text-xs text-gray-500">Booking Id</p>
        <p className="break-all text-xs font-medium text-gray-900">
          {trip.bookingId}
        </p>
      </div>
    </div>
  );
};

export default CompletedDriverCard;
