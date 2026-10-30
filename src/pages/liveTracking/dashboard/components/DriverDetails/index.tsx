import { Button } from "@/components/ui/button";
import type { DriverData } from "@/types/liveBooking";
import { Dot, MessageCircle } from "lucide-react";

interface DriverDetailsProps {
  driver: DriverData;
}

const DriverDetails = ({ driver }: DriverDetailsProps) => {
  const { driverName, rating, trips, vehicleRegNo } = driver;

  // Calculate driver initials
  const name = driverName.trim();

  const initials =
    name.split(/\s+/).length > 1
      ? (name.split(/\s+/)[0][0] + name.split(/\s+/).at(-1)![0]).toUpperCase()
      : (name[0]?.toUpperCase() ?? "");

  return (
    <section className="mx-4 mb-4 rounded-2xl bg-[#f7f4f5] px-3 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900">
            <span className="text-sm font-semibold text-white">{initials}</span>
          </div>

          <div className="text-left">
            <p className="w-40 truncate text-sm font-semibold leading-5 text-slate-800">
              {driverName}
            </p>

            {(rating !== undefined || trips !== undefined) && (
              <div className="mt-0.5 flex items-center gap-0.5 text-xs">
                {rating !== undefined && (
                  <div className="flex items-center font-medium text-slate-700">
                    <p className="pr-1 text-amber-500">★</p>
                    {rating}
                  </div>
                )}

                {rating !== undefined && trips !== undefined && (
                  <Dot className="text-slate-300" />
                )}

                {trips !== undefined && (
                  <span className="text-slate-500">
                    {trips.toLocaleString()} trips
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            aria-label="Message driver"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="my-3 border-t border-slate-200" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          Vehicle registration
        </span>

        <span className="rounded-md border-2 border-slate-700 bg-white px-2 py-0.5 text-xs font-semibold tracking-wide text-slate-800">
          {vehicleRegNo}
        </span>
      </div>
    </section>
  );
};

export default DriverDetails;
