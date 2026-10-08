import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
} from "@vis.gl/react-google-maps";
import vehicleIcon from "@/assets/svg/vehicle.svg";
import type { LatLng } from "@/types/geo";

type CarMarkerProps = {
  position: LatLng | null;
};

/** The car, centered on its live position. */
const CarMarker = ({ position }: CarMarkerProps) => {
  if (!position) return null;

  return (
    <AdvancedMarker
      position={position}
      title="Car"
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
      zIndex={10}
    >
      <img src={vehicleIcon} alt="" width={36} height={64} draggable={false} />
    </AdvancedMarker>
  );
};

export default CarMarker;
