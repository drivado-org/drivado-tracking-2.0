import { Check } from "lucide-react";

export interface BookingStatusData {
  label: string;
  time?: string;
  completed: boolean;
  active: boolean;
}

interface BookingStatusProps {
  statuses: BookingStatusData[];
}

const BookingStatus = ({ statuses }: BookingStatusProps) => {
  return (
    <div className="mx-4 shrink-0 px-3 py-4">
      <div className="flex w-full items-start">
        {statuses.map((status, index) => {
          const isLast = index === statuses.length - 1;

          return (
            <div
              key={status.label}
              className={`flex items-start ${isLast ? "flex-none" : "flex-1"}`}
            >
              <div className="flex min-w-0 flex-col items-center space-y-2">
                {/* Status circle */}
                <div
                  className={`flex h-4.5 w-4.5 items-center justify-center
                    rounded-full transition-colors duration-500 ease-in-out
                    ${
                      status.completed
                        ? "bg-[#159447]"
                        : status.active
                          ? "bg-green-100"
                          : "border-2 border-[#d9dcdf]"
                    }`}
                >
                  {status.completed ? (
                    <Check
                      size={11}
                      strokeWidth={3}
                      className="text-white animate-in zoom-in duration-300"
                    />
                  ) : status.active ? (
                    <span className="h-2 w-2 rounded-full bg-[#159447] animate-pulse" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-gray-400 transition-colors duration-500 ease-in-out" />
                  )}
                </div>

                {/* Status label */}
                <p className="mt-2 whitespace-nowrap text-[13px] font-medium leading-4 text-[#17191d]">
                  {status.label}
                </p>

                {status.time && (
                  <p className="mt-1 text-[12px] text-[#747887]">
                    {status.time}
                  </p>
                )}
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="relative mx-1 mt-2 h-0.5 flex-1 overflow-hidden rounded-full bg-[#d9dcdf]">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full bg-[#159447] transition-[width] duration-1000 ease-in-out ${
                      status.completed
                        ? "w-full"
                        : status.active
                          ? "w-1/2"
                          : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingStatus;
