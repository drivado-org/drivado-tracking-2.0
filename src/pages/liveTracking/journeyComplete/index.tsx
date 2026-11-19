import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import JourneyCompleteHeader from "@/pages/liveTracking/journeyComplete/components/JourneyCompleteHeader";
// import CompletedTripSummary from "@/pages/liveTracking/journeyComplete/components/CompletedTripSummary";
import CompletedDriverCard from "@/pages/liveTracking/journeyComplete/components/CompletedDriverCard";
import JourneyRating from "@/pages/liveTracking/journeyComplete/components/JourneyRating";
// import FeedbackTags from "./FeedbackTags";
import FeedbackNote from "@/pages/liveTracking/journeyComplete/components/FeedbackNote";
import FeedbackActions from "@/pages/liveTracking/journeyComplete/components/FeedbackActions";

import type {
  CompletedTripData,
  DriverData,
  //   FeedbackTag,
  JourneyFeedback,
} from "@/types/liveBooking";

interface JourneyCompleteProps {
  trip: CompletedTripData;
  driver: DriverData;
  isNoShow?: boolean;
  isSubmitting?: boolean;
  submitError?: string | null;
  isSubmitted?: boolean;
  onSubmitFeedback: (feedback: JourneyFeedback) => void;
  onSkip: () => void;
}

const JourneyComplete = ({
  trip,
  driver,
  isSubmitting = false,
  submitError,
  isSubmitted,
  onSubmitFeedback,
  onSkip,
  isNoShow = false,
}: JourneyCompleteProps) => {
  const [rating, setRating] = useState(0);
  //   const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [note, setNote] = useState("");

  const canSubmit = rating > 0 && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const feedback: JourneyFeedback = {
      rating,
      //   tags: selectedTags,
      note: note.trim(),
    };

    onSubmitFeedback(feedback);
  };

  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-3">
      <div className="custom-scrollbar my-auto max-h-[95vh] w-full max-w-125 overflow-y-auto rounded-3xl bg-white shadow-2xl px-5 py-6">
        {isNoShow ? (
          <div className="flex flex-col items-center py-10 text-center">
            <CheckCircle2
              size={64}
              strokeWidth={1.5}
              className="text-emerald-600"
            />

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              This trip has ended.
            </h2>

            <p className="pt-2.5 max-w-md text-sm leading-5 text-gray-500">
              Your chauffeur waited for you but was unable to meet you, so your
              trip was marked as a no-show. If this is a mistake, please contact
              Drivado support. Thank you.
            </p>

            <button
              type="button"
              onClick={onSkip}
              className="mt-7 w-full cursor-pointer rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              Done
            </button>
          </div>
        ) : isSubmitted ? (
          <div
            className="flex flex-col items-center py-10 text-center"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2
              size={64}
              strokeWidth={1.5}
              className="text-emerald-600"
            />

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Thank you for your feedback!
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Your feedback has been submitted successfully. We appreciate you
              taking the time to rate your driver.
            </p>

            <button
              type="button"
              onClick={onSkip}
              className="mt-7 w-full cursor-pointer rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <JourneyCompleteHeader dropoffLocation={trip.dropoffLocation} />

            <CompletedDriverCard trip={trip} driver={driver} />

            <JourneyRating rating={rating} onChange={setRating} />

            <FeedbackNote
              note={note}
              onChange={setNote}
              driverName={driver.driverName}
            />

            {submitError && (
              <p
                className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <FeedbackActions
              canSubmit={canSubmit}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onSkip={onSkip}
            />
          </>
        )}
      </div>
    </main>
  );
};

export default JourneyComplete;
