import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MapLabelProps = {
  children: ReactNode;
  /** A small arrow under the label, pointing at what it names. */
  pointer?: boolean;
  className?: string;
};

/**
 * Dark pill drawn centred above a map marker. Absolutely positioned, so it doesn't change
 * the marker's size and the marker stays anchored on its own centre.
 */
const MapLabel = ({ children, pointer = false, className }: MapLabelProps) => (
  <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
    <div
      className={cn(
        "whitespace-nowrap rounded-md bg-[#1d1e23] px-3 py-1 text-sm font-medium text-white shadow-md",
        className,
      )}
    >
      {children}
    </div>
    {pointer && (
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-[#1d1e23]" />
    )}
  </div>
);

export default MapLabel;
