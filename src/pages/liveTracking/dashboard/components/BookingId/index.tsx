import { CarFront, Share2 } from "lucide-react";

export interface BookingIdData {
  bookingId: string;
  vehicleType: string;
}

interface BookingIdProps {
  booking: BookingIdData;
  onShare?: () => void;
}

const BookingId = ({ booking, onShare }: BookingIdProps) => {
  const { bookingId, vehicleType } = booking;
  return (
    <div className="flex items-center justify-between border-b border-t border-[#eee9ea] py-4 mx-4">
      <div className="text-left">
        <h2 className="text-sm font-semibold leading-5 text-[#111318]">
          {bookingId}
        </h2>

        <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
          <CarFront className="h-3 w-3 text-slate-500" />

          <span className="text-xs font-medium text-[#62667a]">
            {vehicleType}
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label="View live tracking"
        onClick={onShare}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#f7f4f5] text-[#111318]"
      >
        <Share2 className="size-4.25" />
      </button>
    </div>
  );
};

export default BookingId;
