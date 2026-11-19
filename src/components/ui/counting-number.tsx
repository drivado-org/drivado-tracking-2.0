import { useEffect, useRef } from "react";
import { animate, useMotionValue } from "framer-motion";

import { cn } from "@/lib/utils";

interface CountingNumberProps {
  value: number;
  /** Starting value for the first animation. */
  from?: number;
  decimals?: number;
  /** Left-pad the integer part with zeros, e.g. 2 renders 5 as "05". */
  padStart?: number;
  duration?: number;
  className?: string;
}

const format = (n: number, decimals: number, padStart: number) => {
  const fixed = n.toFixed(decimals);
  if (!padStart) return fixed;
  const [int, dec] = fixed.split(".");
  return dec === undefined
    ? int.padStart(padStart, "0")
    : `${int.padStart(padStart, "0")}.${dec}`;
};

export const CountingNumber = ({
  value,
  from = 0,
  decimals = 0,
  padStart = 0,
  duration = 0.8,
  className,
}: CountingNumberProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(from);

  useEffect(() => {
    return motionValue.on("change", (latest) => {
      if (ref.current) ref.current.textContent = format(latest, decimals, padStart);
    });
  }, [motionValue, decimals, padStart]);

  useEffect(() => {
    // Animates from wherever the number currently is, so API updates count smoothly.
    const controls = animate(motionValue, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [value, duration, motionValue]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {format(from, decimals, padStart)}
    </span>
  );
};
