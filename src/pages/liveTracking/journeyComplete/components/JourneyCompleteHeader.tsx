import { Check } from "lucide-react";

interface JourneyCompleteHeaderProps {
  dropoffLocation: string;
}

const JourneyCompleteHeader = ({
  dropoffLocation,
}: JourneyCompleteHeaderProps) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-[5px] border-emerald-100 bg-emerald-700">
        <Check size={24} strokeWidth={3} className="text-white" />
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-gray-900">
        Journey complete
      </h1>

      <p className="mt-1 text-sm text-gray-500">
        You've arrived at {dropoffLocation}
      </p>
    </div>
  );
};

export default JourneyCompleteHeader;
