import { vi } from "vitest";
import { useAuthStore } from "../../stores/authStore";
import * as apiService from "../apiService";
import { ApiError } from "../apiService";

// Mock the authStore to control token state
vi.mock("../../stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

// FIX: Mock the config module to control the API_GATEWAY_BASE_URL
vi.mock("../../config", () => ({
  API_GATEWAY_BASE_URL: "http://api.test",
}));

// Mock the global fetch API
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("apiService", () => {
  // Mock implementations for authStore actions
  const getAccessTokenMock = vi.fn();
  const getRefreshTokenMock = vi.fn();
  const setTokensMock = vi.fn();
  const logoutMock = vi.fn();
  const setSessionExpiredMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a default implementation for the authStore mock
    vi.mocked(useAuthStore.getState).mockReturnValue({
      actions: {
        getAccessToken: getAccessTokenMock,
        getRefreshToken: getRefreshTokenMock,
        setTokens: setTokensMock,
        logout: logoutMock,
        setSessionExpired: setSessionExpiredMock,
      },
    } as any);
  });

  describe("getUserProgress", () => {
    it("should fetch user progress with the correct auth headers", async () => {
      // ARRANGE
      const mockProgress = { completions: { "unit-1": {} } };
      getAccessTokenMock.mockReturnValue("fake-access-token");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProgress),
      });

      // ACT
      const result = await apiService.getUserProgress("http://api.test");

      // ASSERT
      expect(result).toEqual(mockProgress);
      expect(mockFetch).toHaveBeenCalledWith("http://api.test/progress", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer fake-access-token",
        },
      });
    });

    it("should throw an ApiError on a failed request", async () => {
      // ARRANGE
      getAccessTokenMock.mockReturnValue("fake-access-token");
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
        json: () => Promise.resolve({ message: "Internal Server Error" }),
      });

      // ACT & ASSERT
      await expect(
        apiService.getUserProgress("http://api.test")
      ).rejects.toThrow(ApiError);
      await expect(
        apiService.getUserProgress("http://api.test")
      ).rejects.toThrow("Internal Server Error");
    });
  });

  describe("Token Refresh Logic (via fetchWithAuth)", () => {
    it("should refresh the token and retry the request on a 401 error", async () => {
      // ARRANGE
      const newTokens = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      };
      getAccessTokenMock.mockReturnValue("old-access-token");
      getRefreshTokenMock.mockReturnValue("old-refresh-token");

      // First call (original request) fails with 401
      mockFetch.mockResolvedValueOnce({ status: 401, ok: false });
      // Second call (token refresh) succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newTokens),
      });
      // Third call (retried original request) succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: "success" }),
      });

      // ACT
      const result = await apiService.getUserProgress("http://api.test");

      // ASSERT
      expect(result).toEqual({ data: "success" });
      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Check the refresh call
      expect(mockFetch).toHaveBeenCalledWith("http://api.test/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: "old-refresh-token" }),
      });

      // Check that tokens were updated in the store
      expect(setTokensMock).toHaveBeenCalledWith(newTokens);

      // Check that the original request was retried with the NEW token
      expect(mockFetch).toHaveBeenCalledWith("http://api.test/progress", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer new-access-token",
        },
      });
    });

    it("should set session as expired if token refresh fails", async () => {
      // ARRANGE
      getAccessTokenMock.mockReturnValue("old-access-token");
      getRefreshTokenMock.mockReturnValue("old-refresh-token");

      // First call fails with 401
      mockFetch.mockResolvedValueOnce({ status: 401, ok: false });
      // Second call (token refresh) also fails
      mockFetch.mockResolvedValueOnce({ status: 401, ok: false });

      // ACT & ASSERT
      await expect(
        apiService.getUserProgress("http://api.test")
      ).rejects.toThrow("Session expired. Please log in again.");

      // Check that the session expired flag was set
      expect(setSessionExpiredMock).toHaveBeenCalledWith(true);
    });
  });
});
