import { vi } from "vitest";
import { act } from "@testing-library/react";

import { useAuthStore, UserProfile } from "../authStore";
import { useProgressStore } from "../progressStore";
import * as apiService from "../../lib/apiService";
import * as localStorageUtils from "../../lib/localStorageUtils";
import { ANONYMOUS_USER_ID_PLACEHOLDER } from "../../lib/localStorageUtils";
import { BASE_PROGRESS_STORE_KEY } from "../progressStore";

// Mock all external dependencies of the auth store
vi.mock("../../lib/apiService");
vi.mock("../progressStore");
vi.mock("../../lib/localStorageUtils");

// Mock window.location.reload
Object.defineProperty(window, "location", {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

// A helper to create a mock JWT for testing
const createMockJwt = (payload: object): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const signature = "mockSignature";
  return `${header}.${body}.${signature}`;
};

// --- Mock Data ---
const mockUserProfile: UserProfile = {
  userId: "user-123",
  name: "Test User",
  email: "test@example.com",
  picture: "http://example.com/pic.jpg",
};

const mockAccessToken = createMockJwt({
  sub: mockUserProfile.userId,
  name: mockUserProfile.name,
  email: mockUserProfile.email,
  picture: mockUserProfile.picture,
});

const mockTokens = {
  accessToken: mockAccessToken,
  refreshToken: "mockRefreshToken",
};

describe("authStore", () => {
  // Mock functions for the progress store actions
  const setServerProgressMock = vi.fn();
  const resetAllProgressMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the auth store to its initial state before each test
    act(() => {
      useAuthStore.setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isSyncingProgress: false,
        sessionHasExpired: false,
      });
    });

    // Mock the progress store's actions
    vi.mocked(useProgressStore.getState).mockReturnValue({
      actions: {
        setServerProgress: setServerProgressMock,
        resetAllProgress: resetAllProgressMock,
      },
    } as any);

    // Mock localStorage
    Storage.prototype.getItem = vi.fn();
    Storage.prototype.setItem = vi.fn();
  });

  it("should log in a user, set the state, and fetch their progress", async () => {
    // ARRANGE: Mock the API calls
    vi.mocked(apiService.loginWithGoogle).mockResolvedValue(mockTokens);
    vi.mocked(apiService.getUserProgress).mockResolvedValue({
      completions: [],
    });

    // ACT: Call the login action
    await act(async () => {
      await useAuthStore.getState().actions.login("test-google-token");
    });

    // ASSERT
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUserProfile);
    expect(state.accessToken).toBe(mockAccessToken);
    expect(apiService.getUserProgress).toHaveBeenCalledTimes(1);
    expect(setServerProgressMock).toHaveBeenCalledWith({ completions: [] });
    expect(state.isSyncingProgress).toBe(false); // Should be false at the end
  });

  it("should migrate anonymous progress when logging in", async () => {
    // ARRANGE:
    // 1. Mock localStorage to return anonymous progress
    const anonymousProgress = {
      state: {
        completion: {
          "unit-1": { "lesson-1": { "sec-1": "timestamp" } },
        },
      },
    };
    const anonymousKey = `${ANONYMOUS_USER_ID_PLACEHOLDER}_${BASE_PROGRESS_STORE_KEY}`;
    vi.mocked(localStorage.getItem).mockReturnValue(
      JSON.stringify(anonymousProgress)
    );

    // 2. Mock the API calls
    vi.mocked(apiService.loginWithGoogle).mockResolvedValue(mockTokens);
    vi.mocked(apiService.updateUserProgress).mockResolvedValue({
      completions: [
        { unitId: "unit-1", lessonId: "lesson-1", sectionId: "sec-1" },
      ],
    });

    // ACT
    await act(async () => {
      await useAuthStore.getState().actions.login("test-google-token");
    });

    // ASSERT
    // Check that the update (migration) endpoint was called, not the get endpoint
    expect(apiService.updateUserProgress).toHaveBeenCalledTimes(1);
    expect(apiService.updateUserProgress).toHaveBeenCalledWith(
      expect.any(String),
      {
        completions: [
          { unitId: "unit-1", lessonId: "lesson-1", sectionId: "sec-1" },
        ],
      }
    );
    expect(apiService.getUserProgress).not.toHaveBeenCalled();

    // Check that anonymous data was cleared
    expect(localStorageUtils.clearAllAnonymousData).toHaveBeenCalledTimes(1);
  });

  it("should log out a user, reset state, and reload the page", async () => {
    // ARRANGE: Set the store to a logged-in state first
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: mockUserProfile,
        accessToken: mockAccessToken,
        refreshToken: "mockRefreshToken",
      });
    });

    // ACT
    await act(async () => {
      await useAuthStore.getState().actions.logout();
    });

    // ASSERT
    expect(apiService.logoutUser).toHaveBeenCalledWith(
      expect.any(String),
      "mockRefreshToken"
    );
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(resetAllProgressMock).toHaveBeenCalledTimes(1);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
