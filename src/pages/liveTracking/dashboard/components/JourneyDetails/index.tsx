import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface JourneyData {
  distance: string;
  pickup: {
    pickupLocation: string;
    address: string;
  };
  dropoff: {
    dropoffLocation: string;
    address: string;
  };
}

interface JourneyDetailsProps {
  journey: JourneyData;
}

const JourneyDetails = ({ journey }: JourneyDetailsProps) => {
  const { distance, pickup, dropoff } = journey;

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <section
      className={`mx-4 rounded-2xl bg-white px-4 shadow-sm transition-all duration-300 ${
        isExpanded ? "py-3" : "py-2.5"
      }`}
    >
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isExpanded}
        aria-label={
          isExpanded ? "Collapse journey details" : "Expand journey details"
        }
      >
        <h2 className="text-sm font-semibold text-slate-800">
          Journey details
        </h2>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">{distance}</span>

          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4">
          <div className="relative flex gap-3 text-left">
            <div className="relative flex w-2 shrink-0 justify-center">
              <span className="absolute left-1/2 top-2 h-[calc(100%+18px)] w-px -translate-x-1/2 border-l border-dashed border-slate-300" />
              <span className="relative z-10 mt-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-800 bg-white" />
            </div>

            <div className="pb-4">
              <p className="text-xs font-medium text-slate-500">Pickup</p>

              <p className="mt-1 text-sm font-semibold leading-5 text-slate-800">
                {pickup.pickupLocation}
              </p>

              <p className="text-xs leading-5 text-slate-500">
                {pickup.address}
              </p>
            </div>
          </div>

          <div className="relative flex gap-3 text-left">
            <div className="relative flex w-2 shrink-0 justify-center">
              <span className="relative z-10 mt-1 h-2.5 w-2.5 rounded-xs bg-slate-900" />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Drop-off</p>

              <p className="mt-1 text-sm font-semibold leading-5 text-slate-800">
                {dropoff.dropoffLocation}
              </p>

              <p className="text-xs leading-5 text-slate-500">
                {dropoff.address}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 py-2">
            <span className="text-xs font-medium text-slate-500">
              Est. duration
            </span>
            <p className="text-[13px] font-bold text-slate-800">55 min</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default JourneyDetails;
