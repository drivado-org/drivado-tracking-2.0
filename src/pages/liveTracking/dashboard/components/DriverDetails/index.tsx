import type { DriverData } from "@/types/liveBooking";
import { Dot, MessageCircle, Phone } from "lucide-react";

interface DriverDetailsProps {
  driver: DriverData;
}

const DriverDetails = ({ driver }: DriverDetailsProps) => {
  const { name, rating, trips, vehicleRegistration } = driver;
  return (
    <section className="rounded-2xl bg-[#f7f4f5] px-3 py-3 mx-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900">
            <span className="text-sm font-semibold text-white">AM</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-5 text-slate-800">
              {name}
            </p>

            <div className="mt-0.5 flex items-center gap-0.5 text-xs">
              <div className="flex items-center font-medium text-slate-700">
                <p className="text-amber-500 pr-1">★</p> {rating}
              </div>

              <div className="flex items-center">
                <Dot className="text-slate-300" />
              </div>

              <span className="text-slate-500">
                {trips.toLocaleString()} trips
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Message driver"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
          >
            <MessageCircle className="h-4 w-4" />
          </button>

          <button
            type="button"
            aria-label="Call driver"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Phone className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="my-3 border-t border-slate-200" />
      <div className="flex items-center justify-between ">
        <span className="text-xs font-medium text-slate-500">
          Vehicle registration
        </span>

        <span className="rounded-md border-2 border-slate-700 bg-white px-2 py-0.5 text-xs font-semibold tracking-wide text-slate-800">
          {vehicleRegistration}
        </span>
      </div>
    </section>
  );
};

export default DriverDetails;
