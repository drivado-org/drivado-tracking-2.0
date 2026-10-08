import { AUTH_TOKEN_STORAGE_KEY, getAuthToken } from "@/utils/authToken";

afterEach(() => {
  localStorage.clear();
});

describe("getAuthToken", () => {
  it("reads the token from localStorage", () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "Bearer abc");
    expect(getAuthToken()).toBe("Bearer abc");
  });

  it("trims spaces", () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "  Bearer abc  ");
    expect(getAuthToken()).toBe("Bearer abc");
  });

  it("returns null when there is no token", () => {
    expect(getAuthToken()).toBeNull();
  });

  it.each(["", "   ", "null", "undefined"])("returns null for stored value %p", (value) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, value);
    expect(getAuthToken()).toBeNull();
  });

  it("returns null when localStorage throws (private mode / blocked storage)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(getAuthToken()).toBeNull();
  });
});
