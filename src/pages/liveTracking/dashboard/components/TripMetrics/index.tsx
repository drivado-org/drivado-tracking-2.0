import type { TripMetricsData } from "@/types/liveBooking";
import { splitHours } from "@/utils/etaFormat";

interface TripMetricsProps {
  metrics: TripMetricsData;
}

const Value = ({ value, unit }: { value: number | string; unit: string }) => (
  <>
    <span className="text-[22px] font-semibold leading-none text-slate-900">
      {value}
    </span>

    <span className="text-xs font-medium text-slate-500">{unit}</span>
  </>
);

const Duration = ({ minutes }: { minutes: number | null }) => {
  if (minutes === null) return <Value value="--" unit="min" />;

  const split = splitHours(minutes);
  if (split.hours === 0) return <Value value={split.minutes} unit="min" />;

  return (
    <>
      <Value value={split.hours} unit="hr" />
      {split.minutes > 0 && <Value value={split.minutes} unit="min" />}
    </>
  );
};

const TripMetrics = ({ metrics }: TripMetricsProps) => {
  const { duration, distance, dropOffTime } = metrics;

  return (
    <section className="relative rounded-t-[24px] bg-white px-5 pb-5 pt-7">
      <div className="grid grid-cols-3 divide-x divide-slate-200">
        <div className="pr-4 text-left">
          <p className="text-xs font-medium text-slate-500">Duration</p>

          <div className="mt-1 flex items-baseline gap-1">
            <Duration minutes={duration} />
          </div>
        </div>

        <div className="px-4 text-left">
          <p className="text-xs font-medium text-slate-500">Distance</p>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[22px] font-semibold leading-none text-slate-900">
              {distance ?? "--"}
            </span>

            <span className="text-xs font-medium text-slate-500">km</span>
          </div>
        </div>

        <div className="pl-4 text-left">
          <p className="text-xs font-medium text-slate-500">Drop-off</p>

          <div className="mt-1">
            <span className="text-[22px] font-semibold leading-none text-slate-900">
              {dropOffTime ?? "--"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TripMetrics;
