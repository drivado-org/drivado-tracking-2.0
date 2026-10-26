import type { TrackingEvent, TrackingEventType } from "@/types/liveBooking";

export const createLiveTrackingConnection = (
  tripID: string,
  onEvent: (event: TrackingEvent) => void,
  onError?: () => void,
): (() => void) => {
  const baseUrl = (import.meta.env.VITE_TRACKING_API_BASE_URL ?? "").replace(
    /\/+$/,
    "",
  );

  const url = `${baseUrl}/realtime/realtime/trips/${encodeURIComponent(tripID)}/stream`;

  const eventSource = new EventSource(url);

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
