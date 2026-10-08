import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  Headphones,
  User,
} from "lucide-react";
import { useState } from "react";

export interface BookingData {
  passengerName: string;
  companyName: string;
  passengers: number;
  luggage: number;
  flight: string;
}

interface BookingDetailsProps {
  booking: BookingData;
}

const BookingDetails = ({ booking }: BookingDetailsProps) => {
  const { passengerName, companyName, passengers, luggage, flight } = booking;

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const initials = passengerName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section
      className={`mt-2 mx-4 rounded-2xl bg-white px-4 shadow-sm transition-all duration-300 ${
        isExpanded ? "py-3" : "py-2.5"
      }`}
    >
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isExpanded}
        aria-label={
          isExpanded ? "Collapse booking details" : "Expand booking details"
        }
      >
        <h2 className="text-sm font-semibold text-slate-800">Your booking</h2>

        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e4e1e4] bg-[#f8f6f7] text-[13px] font-medium text-[#25262b]">
              {initials}
            </div>

            <div className="text-left">
              <p className="text-[14px] font-semibold leading-5 text-[#22242a]">
                {passengerName}
              </p>
              <p className="text-[13px] leading-5 text-[#737887]">
                {companyName}
              </p>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 text-left">
            <div className="rounded-xl bg-[#f7f4f5] px-3 py-2">
              <div className="flex items-center gap-1">
                <User className="text-[#72757e] size-3.5" />
                <p className="mb-1 text-[12px] text-[#747887]">Passengers</p>
              </div>
              <p className="text-[13px] font-medium text-[#202127]">
                {passengers}
              </p>
            </div>

            <div className="rounded-xl bg-[#f7f4f5] px-3 py-2">
              <div className="flex items-center gap-1">
                <BriefcaseBusiness className="text-[#72757e] size-3.5" />
                <p className="mb-1 text-[12px] text-[#747887]">Luggage</p>
              </div>
              <p className="text-[13px] font-medium text-[#202127]">
                {luggage} {luggage === 1 ? "piece" : "pieces"}{" "}
                {luggage === 3 ? (
                  <span className="text-[10px] text-[#747887]">
                    (Standard size)
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="mb-2 border-t border-[#e8e5e6]" />

          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13px] text-[#707583]">Flight</span>
            <span className="text-[13px] font-medium text-[#25262b]">
              {flight}
            </span>
          </div>

          <button
            type="button"
            className="flex h-11.25 w-full items-center justify-center gap-2 rounded-xl bg-[#101216] text-[14px] font-semibold text-white transition hover:bg-[#1d1f24]"
          >
            <Headphones size={16} strokeWidth={2} />
            <span>Contact support</span>
          </button>
        </div>
      )}
    </section>
  );
};

export default BookingDetails;
