import type { BookingStatusData } from "@/types/liveBooking";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

interface BookingStatusProps {
  statuses: BookingStatusData[];
}

const BookingStatus = ({ statuses }: BookingStatusProps) => {
  const [progress, setProgress] = useState(0);

  const activeIndex = statuses.findIndex(
    (status) => status.active && !status.completed,
  );

  useEffect(() => {
    setProgress(0);

    if (activeIndex === -1) return;

    const interval = window.setInterval(() => {
      setProgress((previous) => {
        if (previous >= 90) {
          window.clearInterval(interval);
          return 90;
        }

        return Math.min(previous + 1, 90);
      });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [activeIndex]);

  return (
    <div className="mx-2 shrink-0 px-1 py-4">
      <div
        className="relative grid w-full"
        style={{
          gridTemplateColumns: `repeat(${statuses.length}, minmax(0, 1fr))`,
        }}
      >
        {/* Connecting lines */}
        {statuses.map((status, index) => {
          if (index === statuses.length - 1) return null;

          return (
            <div
              key={`line-${status.label}`}
              className="absolute h-0.5 rounded-full bg-[#d9dcdf]"
              style={{
                top: "8px",
                left: `${((index + 0.5) / statuses.length) * 100}%`,
                width: `${100 / statuses.length}%`,
              }}
            >
              <div
                className="h-full rounded-full bg-[#159447] transition-[width] duration-700 ease-linear"
                style={{
                  width:
                    status.completed || statuses[index + 1]?.completed
                      ? "100%"
                      : index === activeIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          );
        })}

        {/* Status circles and labels */}
        {statuses.map((status) => (
          <div
            key={status.label}
            className="relative z-10 flex min-w-0 flex-col items-center"
          >
            <div
              className={`flex h-4.5 w-4.5 items-center justify-center rounded-full transition-colors duration-500 ${
                status.completed
                  ? "bg-[#159447]"
                  : status.active
                    ? "bg-green-100"
                    : "border-2 border-[#d9dcdf] bg-white"
              }`}
            >
              {status.completed ? (
                <Check
                  size={11}
                  strokeWidth={3}
                  className="animate-in zoom-in text-white duration-300"
                />
              ) : status.active ? (
                <span className="h-2 w-2 rounded-full bg-[#159447] animate-pulse" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-gray-400" />
              )}
            </div>

            <p className="mt-2 whitespace-nowrap text-[13px] font-medium leading-8 text-[#17191d]">
              {status.label}
            </p>

            {status.time && (
              <p className="mt-1 text-[12px] text-[#747887]">{status.time}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingStatus;
