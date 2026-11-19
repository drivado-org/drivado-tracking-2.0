import type { TripMetricsData } from "@/types/liveBooking";
import { splitHours } from "@/utils/etaFormat";
import { CountingNumber } from "@/components/ui/counting-number";

interface TripMetricsProps {
  metrics: TripMetricsData;
}

const formatDistance = (distance: number | null) => {
  if (distance === null || !Number.isFinite(distance)) {
    return { value: "--", unit: "", decimals: 0 };
  }

  if (distance <= 0.5) {
    return {
      value: Math.round(distance * 1000),
      unit: "meters",
      decimals: 0,
    };
  }

  return {
    value: distance,
    unit: "km",
    decimals: 2,
  };
};

const valueClass = "text-sm xs:text-[22px] font-semibold leading-none text-slate-900";

const Value = ({
  value,
  unit,
  decimals = 0,
}: {
  value: number | string;
  unit: string;
  decimals?: number;
}) => (
  <>
    {typeof value === "number" ? (
      <CountingNumber className={valueClass} value={value} decimals={decimals} />
    ) : (
      <span className={valueClass}>{value}</span>
    )}

    <span className="text-xs font-medium text-slate-500">{unit}</span>
  </>
);

const Duration = ({ minutes }: { minutes: number | null }) => {
  if (minutes === null) return <Value value="--" unit="min" />;

  const split = splitHours(minutes);
  if (split.hours === 0) return <Value value={split.minutes} unit="mins" />;

  return (
    <>
      <Value value={split.hours} unit="hr" />
      {split.minutes > 0 && <Value value={split.minutes} unit="mins" />}
    </>
  );
};

/** Counts the hour and minute of an "HH:MM" time separately. */
const DropOff = ({ time }: { time: string | null }) => {
  const match = time?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return <span className={valueClass}>{time ?? "--"}</span>;

  return (
    <span className={valueClass}>
      <CountingNumber value={Number(match[1])} padStart={2} />:
      <CountingNumber value={Number(match[2])} padStart={2} />
    </span>
  );
};

const TripMetrics = ({ metrics }: TripMetricsProps) => {
  const { duration, distance, dropOffTime } = metrics;
  const formattedDistance = formatDistance(distance);

  return (
    <section className="relative rounded-t-[24px] bg-white px-5 pb-1 xs:pb-3 pt-7 md:pb-2 md:pt-1.5">
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
            <Value {...formattedDistance} />
          </div>
        </div>

        <div className="pl-4 text-left">
          <p className="text-xs font-medium text-slate-500">Drop-off</p>

          <div className="mt-1 flex items-baseline gap-1">
            <DropOff time={dropOffTime} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TripMetrics;
