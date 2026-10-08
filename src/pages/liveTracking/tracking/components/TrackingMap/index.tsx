import type { ReactNode } from "react";
import { APIProvider, Map, RenderingType } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/types/geo";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ID,
  DEFAULT_MAP_ZOOM,
} from "../../constants/map";

type TrackingMapProps = {
  apiKey: string | null;
  mapId?: string | null;
  center?: LatLng;
  zoom?: number;
  /** Map layers such as the route and the car. */
  children?: ReactNode;
};

const TrackingMap = ({
  apiKey,
  mapId,
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  children,
}: TrackingMapProps) => {
  if (!apiKey) {
    return (
      <div
        role="alert"
        className="flex h-full w-full items-center justify-center bg-muted p-4 text-sm text-muted-foreground"
      >
        Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to
        .env.local and restart the dev server.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        className="h-full w-full"
        mapId={mapId ?? DEFAULT_MAP_ID}
        renderingType={RenderingType.VECTOR}
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {children}
      </Map>
    </APIProvider>
  );
};

export default TrackingMap;
