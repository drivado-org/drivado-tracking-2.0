interface FeedbackActionsProps {
  canSubmit: boolean;
  onSubmit: () => void;
  onSkip: () => void;
}

const FeedbackActions = ({
  canSubmit,
  onSubmit,
  onSkip,
}: FeedbackActionsProps) => {
  return (
    <div className="mt-2 space-y-2 border-t border-gray-200 pt-3.5">
      <button
        type="button"
        disabled={!canSubmit}
        onClick={onSubmit}
        className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-[#e6e6eb] disabled:text-[#9999a7] cursor-pointer"
      >
        Submit feedback
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="w-full rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
      >
        Skip
      </button>
    </div>
  );
};

export default FeedbackActions;
