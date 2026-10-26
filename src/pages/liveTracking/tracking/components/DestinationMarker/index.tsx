import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
} from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";
import MapLabel from "../MapLabel";

type DestinationMarkerProps = {
  /** Where the route ends; nothing is drawn without it. */
  position: LatLng | null;
  /** Text above the marker ("PICKUP", "ARRIVED", "DROP-OFF"…); none when null. */
  label?: string | null;
  /** Location pin standing on the point (the pickup) instead of the dot. */
  pin?: boolean;
};

/** Dark location pin, its tip on the pickup. */
const PickupPin = () => (
  <svg
    data-testid="pickup-pin"
    aria-hidden
    width="30"
    height="40"
    viewBox="0 0 30 40"
    className="block drop-shadow-md"
  >
    <path
      d="M15 1.5C7.54 1.5 1.5 7.4 1.5 14.7c0 9.6 11.6 22.3 12.5 23.3a1.35 1.35 0 0 0 2 0c.9-1 12.5-13.7 12.5-23.3C28.5 7.4 22.46 1.5 15 1.5Z"
      fill="#1d1e23"
      stroke="white"
      strokeWidth="2"
    />
    <circle cx="15" cy="14.5" r="5" fill="white" />
  </svg>
);

/**
 * Where the route ends, with the trip step above it: a location pin at the pickup,
 * a black dot with a white square at the drop-off.
 */
const DestinationMarker = ({
  position,
  label = null,
  pin = false,
}: DestinationMarkerProps) => {
  if (!position) return null;

  return (
    <AdvancedMarker
      position={position}
      title={label ?? "Destination"}
      anchorPoint={
        pin
          ? AdvancedMarkerAnchorPoint.BOTTOM_CENTER
          : AdvancedMarkerAnchorPoint.CENTER
      }
      zIndex={5}
    >
      <div className="relative">
        {label && <MapLabel className="tracking-wider">{label}</MapLabel>}
        {pin ? (
          <PickupPin />
        ) : (
          <div className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#1d1e23] shadow-md">
            <div className="size-2.5 rounded-[2px] bg-white" />
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
};

export default DestinationMarker;
