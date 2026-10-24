import { Star } from "lucide-react";

interface JourneyRatingProps {
  rating: number;
  onChange: (rating: number) => void;
}

const JourneyRating = ({ rating, onChange }: JourneyRatingProps) => {
  const ratingLabels = ["", "Poor", "Below par", "Fine", "Good", "Exceptional"];

  return (
    <section className="mt-6 text-center">
      <h2 className="text-base font-semibold text-gray-900">
        How was your journey?
      </h2>

      <div className="mt-3 flex justify-center gap-3">
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;
          const selected = value <= rating;

          return (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} out of 5 stars`}
              aria-pressed={rating === value}
              onClick={() => onChange(value)}
              className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              <Star
                size={24}
                strokeWidth={1}
                className={
                  selected
                    ? "fill-amber-400 text-amber-400"
                    : "fill-gray-300 text-gray-300"
                }
              />
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 text-sm text-gray-500">
        {rating > 0 ? (
          <>
            You rated {rating} out of 5
            <p className="font-semibold text-gray-700">
              ({ratingLabels[rating]})
            </p>
          </>
        ) : (
          "Tap a star to rate"
        )}
      </div>
    </section>
  );
};

export default JourneyRating;
