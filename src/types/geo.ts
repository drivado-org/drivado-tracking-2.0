export type LatLng = {
  lat: number;
  lng: number;
};

/** A position with the time the device recorded it (ISO string). */
export type TrackPoint = LatLng & {
  timestamp: string;
};
