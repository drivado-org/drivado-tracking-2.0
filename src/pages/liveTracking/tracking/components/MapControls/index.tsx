import { LocateFixed, Navigation2, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CameraMode } from "../../constants/map";

type MapControlsProps = {
  cameraMode: CameraMode;
  onShowRoute: () => void;
  /** First tap: back to the journey view. From there: lock on the car. */
  onRecenter: () => void;
};

const buttonClass = (on: boolean) =>
  cn(
    "flex size-11 items-center justify-center rounded-xl shadow-md ring-1 ring-black/5 transition-[transform,background-color,color] duration-150 active:scale-[0.94]",
    on ? "bg-[#1d1e23] text-white" : "bg-white text-[#1d1e23]",
  );

/**
 * Two buttons over the map's bottom-right corner, three views. The dark one is the view
 * in use; after the user moves the map, neither is.
 */
const MapControls = ({ cameraMode, onShowRoute, onRecenter }: MapControlsProps) => {
  const routeOn = cameraMode === "route";
  const recenterOn = cameraMode === "journey" || cameraMode === "follow";

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
      <button
        type="button"
        aria-label="Show the whole route"
        aria-pressed={routeOn}
        onClick={onShowRoute}
        className={buttonClass(routeOn)}
      >
        <Route className="size-[19px]" />
      </button>

      {/* The icon shows the view in use: the arrow while locked on the car. */}
      <button
        type="button"
        aria-label={
          cameraMode === "journey"
            ? "Lock the camera to the vehicle"
            : "Show the vehicle and its next stop"
        }
        aria-pressed={recenterOn}
        onClick={onRecenter}
        className={buttonClass(recenterOn)}
      >
        {cameraMode === "follow" ? (
          <Navigation2 className="size-[19px] fill-current" />
        ) : (
          <LocateFixed className="size-[19px]" />
        )}
      </button>
    </div>
  );
};

export default MapControls;
