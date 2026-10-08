import axios, { type AxiosResponse } from "axios";
import { trackingAction } from "@/server/sse/tracking-action";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));

const getMock = vi.mocked(axios.get);
const okResponse = {
  status: 200,
  data: new ReadableStream(),
} as unknown as AxiosResponse;

beforeEach(() => {
  getMock.mockResolvedValue(okResponse);
});

describe("trackingAction", () => {
  it("calls the trip stream api with the token, as a live stream", async () => {
    const controller = new AbortController();
    await trackingAction(
      { tripID: "T123", token: "Bearer abc" },
      controller.signal,
    );

    expect(getMock).toHaveBeenCalledWith(
      "https://testapi.drivado.com/api/v2/realtime/trips/T123/stream",
      {
        headers: { Authorization: "Bearer abc" },
        adapter: "fetch",
        responseType: "stream",
        signal: controller.signal,
      },
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
