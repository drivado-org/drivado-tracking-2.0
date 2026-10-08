import axios from "axios";
import type { TrackingActionPayload } from "@/types/tracking";

export const trackingAction = async (payload: TrackingActionPayload, signal?: AbortSignal) => {
  const response = await axios.get<ReadableStream<Uint8Array>>(
    `https://testapi.drivado.com/api/v2/realtime/trips/${payload.tripID}/stream`,
    {
      headers: {
        Authorization: payload.token,
      },
      // SSE never ends: "fetch" + "stream" gives us the data while it arrives.
      adapter: "fetch",
      responseType: "stream",
      signal,
    },
  );

  return response;
};
