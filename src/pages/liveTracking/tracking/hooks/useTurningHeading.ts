import { useState } from "react";
import { turnTowards } from "../utils/locationFilter";

/**
 * `target` (degrees, any range) as a heading that always turns the short way from the last
 * one: CSS rotate animates 350° → 370°, not 350° → 10° the long way round.
 */
const useTurningHeading = (target: number): number => {
  const [heading, setHeading] = useState(target);

  const next = turnTowards(heading, target);
  // Ignore float rounding, or this would re-render forever.
  if (Math.abs(next - heading) > 0.01) setHeading(next);

  return heading;
};

export default useTurningHeading;
