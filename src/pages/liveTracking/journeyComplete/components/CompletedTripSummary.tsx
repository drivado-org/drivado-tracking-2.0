interface CompletedTripSummaryProps {
  distance: number;
  duration: number;
}

const CompletedTripSummary = ({
  distance,
  duration,
}: CompletedTripSummaryProps) => {
  return (
    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-900">
      <span>{distance.toFixed(1)} km</span>
      <span className="text-gray-400">·</span>
      <span>{duration} min</span>
    </div>
  );
};

export default CompletedTripSummary;
