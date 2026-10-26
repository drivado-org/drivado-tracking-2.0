import {
  easeFactor,
  easeInOutCubic,
  fitCamera,
  lerpCamera,
} from "@/pages/liveTracking/tracking/utils/camera";

const SIZE = { width: 400, height: 400 };
const NO_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };
const A = { lat: 22.57, lng: 88.4 };
const B = { lat: 22.58, lng: 88.42 };

describe("fitCamera", () => {
  it("centres on the middle of the points", () => {
    const camera = fitCamera([A, B], SIZE, NO_PADDING, 20)!;
    expect(camera.center.lat).toBeCloseTo(22.575, 3);
    expect(camera.center.lng).toBeCloseTo(88.41, 6);
  });

  it("zooms so the wider side just fits", () => {
    // 0.02° of longitude across 400 px: 400 / (0.02 / 360 * 256) = 2^z
    const camera = fitCamera([A, B], SIZE, NO_PADDING, 20)!;
    expect(camera.zoom).toBeCloseTo(Math.log2(400 / ((0.02 / 360) * 256)), 2);
  });

  it("never zooms in past the limit", () => {
    expect(fitCamera([A], SIZE, NO_PADDING, 16)!.zoom).toBe(16);
  });

  it("shifts the centre so the points sit in the padded area", () => {
    const even = fitCamera([A, B], SIZE, NO_PADDING, 20)!;
    const topHeavy = fitCamera([A, B], SIZE, { ...NO_PADDING, top: 100 }, 20)!;
    // Room taken at the top pushes the content down: the camera looks further north.
    expect(topHeavy.center.lat).toBeGreaterThan(even.center.lat);
  });

  it("returns null without points or before the map has a size", () => {
    expect(fitCamera([], SIZE, NO_PADDING, 16)).toBeNull();
    expect(fitCamera([A], { width: 0, height: 0 }, NO_PADDING, 16)).toBeNull();
  });
});

describe("easing", () => {
  it("closes the same share per second at any frame rate", () => {
    const left = (frames: number) => (1 - easeFactor(0.05, 1 / frames)) ** frames;
    expect(left(30)).toBeCloseTo(0.05, 6);
    expect(left(120)).toBeCloseTo(0.05, 6);
  });

  it("moves the camera part of the way", () => {
    const from = { center: A, zoom: 14 };
    const to = { center: B, zoom: 16 };
    expect(lerpCamera(from, to, 0.5)).toEqual({
      center: { lat: 22.575, lng: 88.41 },
      zoom: 15,
    });
  });

  it("starts and ends slowly", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1);
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9);
  });
});
