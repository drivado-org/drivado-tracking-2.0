import { useEffect, useState } from "react";
import {
  CarFront,
  CircleCheck,
  CircleDot,
  MapPin,
  Navigation2,
  Scan,
  UserCheck,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAP_TOAST_MS, STATUS_TOAST_MS } from "../../constants/tracking";

const ICONS = {
  /** The camera is on the car. */
  lock: Navigation2,
  /** The car and the destination are framed. */
  view: Scan,
  // Trip steps.
  enroute: CarFront,
  /** The car entered the geofence around the pickup / drop-off. */
  nearby: CircleDot,
  arrived: MapPin,
  onboard: UserCheck,
  completed: CircleCheck,
  noshow: UserX,
} satisfies Record<string, LucideIcon>;

export type MapNotice = {
  text: string;
  icon: keyof typeof ICONS;
  /** Stays up for STATUS_TOAST_MS instead of MAP_TOAST_MS (trip steps). */
  long?: boolean;
};

type MapToastProps = {
  /** A new object shows the toast again, even with the same text. */
  notice: MapNotice | null;
  /** Height covered at the top of the map (a notice): the toast sits below it. */
  topInset?: number;
};

/** Short dark pill at the top of the map saying what the camera did or which trip step was reached. */
const MapToast = ({ notice, topInset = 0 }: MapToastProps) => {
  const [shown, setShown] = useState<MapNotice | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notice) return;
    setShown(notice);
    setVisible(true);
    const timer = setTimeout(
      () => setVisible(false),
      notice.long ? STATUS_TOAST_MS : MAP_TOAST_MS,
    );
    return () => clearTimeout(timer);
  }, [notice]);

  // Keeps the last text while it fades out.
  const Icon = ICONS[shown?.icon ?? "view"];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ top: topInset + 10 }}
      className={cn(
        "pointer-events-none absolute left-1/2 z-10 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#1d1e23]/92 py-2 pl-3 pr-3.5 text-[12.5px] font-medium whitespace-nowrap text-white shadow-md transition-[opacity,translate,top] duration-200 ease-out",
        visible ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0",
      )}
    >
      {shown && (
        <>
          <Icon
            aria-hidden
            className={cn("size-3.5 shrink-0 opacity-90", shown.icon === "lock" && "fill-current")}
          />
          <span className="min-w-0 truncate">{shown.text}</span>
        </>
      )}
    </div>
  );
};

export default MapToast;
