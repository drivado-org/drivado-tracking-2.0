import axios, { type AxiosResponse } from "axios";
import { trackingAction } from "@/server/sse/tracking-action";

const env = vi.hoisted(() => ({ trackingApiBaseUrl: null as string | null }));

vi.mock("axios", () => ({ default: { get: vi.fn() } }));
vi.mock("@/config/env", () => ({ env }));

const getMock = vi.mocked(axios.get);
const okResponse = {
  status: 200,
  data: new ReadableStream(),
} as unknown as AxiosResponse;

beforeEach(() => {
  env.trackingApiBaseUrl = null;
  getMock.mockResolvedValue(okResponse);
});

describe("trackingAction", () => {
  it("calls the relative trip stream path (dev proxy) as a live stream", async () => {
    const controller = new AbortController();
    await trackingAction({ tripID: "T123" }, controller.signal);

    expect(getMock).toHaveBeenCalledWith(
      "/realtime/realtime/trips/T123/stream",
      {
        // No Authorization: the endpoint is public and a custom header makes
        // the browser send a CORS preflight, which the server rejects (405).
        headers: { Accept: "text/event-stream" },
        adapter: "fetch",
        responseType: "stream",
        signal: controller.signal,
      },
    );
  });

  it("prefixes the configured base url", async () => {
    env.trackingApiBaseUrl = "https://testapi.drivado.com";
    await trackingAction({ tripID: "T123" });
    expect(getMock.mock.lastCall?.[0]).toBe(
      "https://testapi.drivado.com/realtime/realtime/trips/T123/stream",
    );
  });

  it("encodes the trip id", async () => {
    await trackingAction({ tripID: "T 1/2" });
    expect(getMock.mock.lastCall?.[0]).toBe(
      "/realtime/realtime/trips/T%201%2F2/stream",
    );
  });

  it("returns the response", async () => {
    await expect(trackingAction({ tripID: "T123" })).resolves.toBe(okResponse);
  });

  it("lets errors reach the saga", async () => {
    getMock.mockRejectedValue(new Error("Network Error"));
    await expect(trackingAction({ tripID: "T123" })).rejects.toThrow(
      "Network Error",
    );
  });
});
