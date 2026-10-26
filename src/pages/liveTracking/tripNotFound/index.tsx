const TripNotFound = () => {
  return (
    <div className="flex h-svh w-full flex-col items-center justify-center gap-2 bg-white px-4 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Trip ID not found</h1>
      <p className="text-sm text-gray-500">
        Open a tracking link with a trip ID, e.g. /tracking/D101S
      </p>
    </div>
  );
};

export default TripNotFound;
