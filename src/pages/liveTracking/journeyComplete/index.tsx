import { useState } from "react";

import type {
  CompletedTripData,
  DriverData,
  //   FeedbackTag,
  JourneyFeedback,
} from "@/types/liveBooking";

interface JourneyCompleteProps {
  trip: CompletedTripData;
  driver: DriverData;
  onSubmitFeedback: (feedback: JourneyFeedback) => void;
  onSkip: () => void;
}

import JourneyCompleteHeader from "@/pages/liveTracking/journeyComplete/components/JourneyCompleteHeader";
import CompletedTripSummary from "@/pages/liveTracking/journeyComplete/components/CompletedTripSummary";
import CompletedDriverCard from "@/pages/liveTracking/journeyComplete/components/CompletedDriverCard";
import JourneyRating from "@/pages/liveTracking/journeyComplete/components/JourneyRating";
// import FeedbackTags from "./FeedbackTags";
import FeedbackNote from "@/pages/liveTracking/journeyComplete/components/FeedbackNote";
import FeedbackActions from "@/pages/liveTracking/journeyComplete/components/FeedbackActions";

const JourneyComplete = ({
  trip,
  driver,
  onSubmitFeedback,
  onSkip,
}: JourneyCompleteProps) => {
  const [rating, setRating] = useState(0);
  //   const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [note, setNote] = useState("");

  const canSubmit = rating > 0;

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
      <div className="my-auto max-h-[95vh] w-full max-w-125 overflow-y-auto rounded-3xl bg-white shadow-2xl px-5 py-6">
        <JourneyCompleteHeader dropoffLocation={trip.dropoffLocation} />

        <CompletedTripSummary
          distance={trip.distance}
          duration={trip.duration}
        />

        <CompletedDriverCard trip={trip} driver={driver} />

        <JourneyRating rating={rating} onChange={setRating} />

        {/* <FeedbackTags selectedTags={selectedTags} onChange={setSelectedTags} /> */}

        <FeedbackNote
          note={note}
          onChange={setNote}
          driverName={driver.driverName}
        />

        <FeedbackActions
          canSubmit={canSubmit}
          onSubmit={handleSubmit}
          onSkip={onSkip}
        />
      </div>
    </main>
  );
};

export default JourneyComplete;
