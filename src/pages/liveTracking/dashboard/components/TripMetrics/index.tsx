export interface TripMetricsData {
  duration: number;
  distance: number;
  dropOffTime: string;
}

interface TripMetricsProps {
  metrics: TripMetricsData;
}

const TripMetrics = ({ metrics }: TripMetricsProps) => {
  const { duration, distance, dropOffTime } = metrics;

  return (
    <section className="relative rounded-t-[24px] bg-white px-5 pb-5 pt-7">
      <div className="grid grid-cols-3 divide-x divide-slate-200">
        <div className="pr-4 text-left">
          <p className="text-xs font-medium text-slate-500">Duration</p>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[22px] font-semibold leading-none text-slate-900">
              {duration}
            </span>

            <span className="text-xs font-medium text-slate-500">min</span>
          </div>
        </div>

        <div className="px-4 text-left">
          <p className="text-xs font-medium text-slate-500">Distance</p>

          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[22px] font-semibold leading-none text-slate-900">
              {distance}
            </span>

            <span className="text-xs font-medium text-slate-500">km</span>
          </div>
        </div>

        <div className="pl-4 text-left">
          <p className="text-xs font-medium text-slate-500">Drop-off</p>

          <div className="mt-1">
            <span className="text-[22px] font-semibold leading-none text-slate-900">
              {dropOffTime}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TripMetrics;
