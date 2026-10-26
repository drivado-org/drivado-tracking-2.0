import axios from "axios";
// import { env } from "@/config/env";
import type { TrackingActionPayload } from "@/types/tracking";

export const trackingAction = async (
  payload: TrackingActionPayload,
  signal?: AbortSignal,
) => {
  // const baseUrl = env.trackingApiBaseUrl ?? "";

  const trackingApi = axios.create({
    baseURL: import.meta.env.VITE_TRACKING_API_BASE_URL,
  });

  const response = await trackingApi.get<ReadableStream<Uint8Array>>(
    `/realtime/realtime/trips/${encodeURIComponent(payload.tripID)}/stream`,
    {
      headers: { Accept: "text/event-stream" },
      adapter: "fetch",
      responseType: "stream",
      signal,
    },
  );

  return response;
};
