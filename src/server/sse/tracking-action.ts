import axios from "axios";
import { env } from "@/config/env";
import type { TrackingActionPayload } from "@/types/tracking";

export const buildTripStreamUrl = (tripId: string): string => {
  const baseUrl = env.trackingApiBaseUrl ?? "";

  return `${baseUrl}/realtime/trips/${encodeURIComponent(tripId)}/stream`;
};

export const trackingAction = async (
  payload: TrackingActionPayload,
  signal?: AbortSignal,
) => {
  const url = buildTripStreamUrl(payload.tripID);

  return axios.get<ReadableStream<Uint8Array>>(url, {
    headers: { Accept: "text/event-stream" },
    adapter: "fetch",
    responseType: "stream",
    signal,
  });
};
