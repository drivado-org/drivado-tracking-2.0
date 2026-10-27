import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
} from "@vis.gl/react-google-maps";
import vehicleIcon from "@/assets/svg/vehicle.svg";
import type { LatLng } from "@/types/geo";
import MapLabel from "../MapLabel";

type CarMarkerProps = {
  position: LatLng | null;
  /** Degrees clockwise from north; the icon's nose points north at 0. */
  heading?: number;
  /** Shown above the car, e.g. the time left. Not rotated with the car. */
  label?: string | null;
};

const CarMarker = ({ position, heading = 0, label = null }: CarMarkerProps) => {
  if (!position) return null;

  return (
    <AdvancedMarker
      position={position}
      title="Car"
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
      zIndex={10}
    >
      <div className="relative">
        {label && <MapLabel pointer>{label}</MapLabel>}
        <img
          src={vehicleIcon}
          alt=""
          width={36}
          height={64}
          draggable={false}
          style={{
            transform: `rotate(${heading}deg)`,
            transition: "transform 500ms linear",
          }}
        />
      </div>
    </AdvancedMarker>
  );
};

export default CarMarker;
