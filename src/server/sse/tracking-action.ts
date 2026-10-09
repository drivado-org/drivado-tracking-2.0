import axios from "axios";
import { env } from "@/config/env";
import type { TrackingActionPayload } from "@/types/tracking";

export const trackingAction = async (
  payload: TrackingActionPayload,
  signal?: AbortSignal,
) => {
  const baseUrl = env.trackingApiBaseUrl ?? "";

  const response = await axios.get<ReadableStream<Uint8Array>>(
    `https://testapi.drivado.com/realtime/realtime/trips/${encodeURIComponent(payload.tripID)}/stream`,
    {
      headers: { Accept: "text/event-stream" },
      adapter: "fetch",
      responseType: "stream",
      signal,
    },
  );

  return response;
};
