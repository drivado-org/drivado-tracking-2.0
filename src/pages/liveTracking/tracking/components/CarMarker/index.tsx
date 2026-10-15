import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
} from "@vis.gl/react-google-maps";
import vehicleIcon from "@/assets/svg/vehicle.svg";
import type { LatLng } from "@/types/geo";

type CarMarkerProps = {
  position: LatLng | null;
  /** Degrees clockwise from north; the icon's nose points north at 0. */
  heading?: number;
};

const CarMarker = ({ position, heading = 0 }: CarMarkerProps) => {
  if (!position) return null;

  return (
    <AdvancedMarker
      position={position}
      title="Car"
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
      zIndex={10}
    >
      <img
        src={vehicleIcon}
        alt=""
        width={36}
        height={64}
        draggable={false}
        style={{
          transform: `rotate(${heading}deg)`,
          transition: "transform 5000ms linear",
        }}
      />
    </AdvancedMarker>
  );
};

export default CarMarker;
