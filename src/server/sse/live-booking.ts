import type { TrackingEvent, TrackingEventType } from "@/types/liveBooking";
import { buildTripStreamUrl } from "./tracking-action";

export const createLiveTrackingConnection = (
  tripId: string,
  onEvent: (event: TrackingEvent) => void,
  onError?: () => void,
): (() => void) => {
  const eventSource = new EventSource(buildTripStreamUrl(tripId));

  const eventTypes: TrackingEventType[] = [
    "snapshot",
    "location",
    "eta",
    "route_change",
    "trip_stage",
    "vehicle_meta",
    "status",
  ];

  eventTypes.forEach((type) => {
    eventSource.addEventListener(type, (event: Event) => {
      const message = event as MessageEvent<string>;

      try {
        const data = JSON.parse(message.data);

        onEvent({ type, data });
      } catch (error) {
        console.error(`Invalid SSE JSON for ${type}:`, error);
      }
    });
  });

  eventSource.onerror = () => {
    // EventSource automatically retries most connection failures.
    onError?.();
  };

  // Call this when the trip changes or the component unmounts.
  return () => {
    eventSource.close();
  };
};
