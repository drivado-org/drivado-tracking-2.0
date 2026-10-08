const loadEnv = async () => {
  vi.resetModules();
  return (await import("@/config/env")).env;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env.googleMapsApiKey", () => {
  it("returns the trimmed key when set", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "  test-key-123  ");
    expect((await loadEnv()).googleMapsApiKey).toBe("test-key-123");
  });

  it.each(["", "   "])("returns null for empty value %p", async (value) => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", value);
    expect((await loadEnv()).googleMapsApiKey).toBeNull();
  });

  it("returns null when the variable is missing", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", undefined);
    expect((await loadEnv()).googleMapsApiKey).toBeNull();
  });
});

describe("env.googleMapsMapId", () => {
  it("returns the trimmed map id when set", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_MAP_ID", " abc123 ");
    expect((await loadEnv()).googleMapsMapId).toBe("abc123");
  });

  it.each(["", "   ", undefined])("returns null for %p", async (value) => {
    vi.stubEnv("VITE_GOOGLE_MAPS_MAP_ID", value);
    expect((await loadEnv()).googleMapsMapId).toBeNull();
  });
});
