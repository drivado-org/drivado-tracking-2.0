interface FeedbackNoteProps {
  note: string;
  driverName: string;
  onChange: (note: string) => void;
}

const FeedbackNote = ({ note, onChange, driverName }: FeedbackNoteProps) => {
  return (
    <div className="mt-3">
      <label htmlFor="feedback-note" className="sr-only">
        Additional feedback
      </label>

      <textarea
        id="feedback-note"
        value={note}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Add a note for the ${driverName} (optional)`}
        rows={2}
        maxLength={1000}
        className="min-h-16 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
      />
    </div>
  );
};

export default FeedbackNote;
