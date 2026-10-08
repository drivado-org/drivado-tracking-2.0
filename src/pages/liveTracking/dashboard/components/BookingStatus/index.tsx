import { Check } from "lucide-react";

export interface BookingStatusData {
  label: string;
  time?: string;
  completed: boolean;
}

interface BookingStatusProps {
  statuses: BookingStatusData[];
}

const BookingStatus = ({ statuses }: BookingStatusProps) => {
  return (
    <div className="mx-4 px-3 py-4">
      <div className="flex w-full items-start">
        {statuses.map((status, index) => {
          const isLast = index === statuses.length - 1;

          return (
            <div
              key={status.label}
              className={`flex items-start ${isLast ? "flex-none" : "flex-1"}`}
            >
              <div className="flex min-w-0 flex-col items-center space-y-2">
                <div
                  className={`flex h-4.5 w-4.5 items-center justify-center rounded-full ${
                    status.completed ? "bg-[#159447]" : "bg-[#d9dcdf]"
                  }`}
                >
                  {status.completed && (
                    <Check size={11} strokeWidth={3} className="text-white" />
                  )}
                </div>

                <p className="mt-2 whitespace-nowrap text-[13px] font-medium leading-4 text-[#17191d]">
                  {status.label}
                </p>

                {status.time && (
                  <p className="mt-1 text-[12px] text-[#747887]">
                    {status.time}
                  </p>
                )}
              </div>

              {!isLast && (
                <div className="-mx-2 mt-2 h-0.5 flex-1 bg-[#159447]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingStatus;
