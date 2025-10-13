import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { useSectionProgress } from "../useSectionProgress";
import { useAuthStore } from "../../stores/authStore";
import { useProgressActions } from "../../stores/progressStore";
import * as localStorageUtils from "../../lib/localStorageUtils";
import { ANONYMOUS_USER_ID_PLACEHOLDER } from "../../lib/localStorageUtils";
import type { UnitId, LessonId, SectionId } from "../../types/data";

// --- Mocks Setup ---
vi.mock("../../stores/authStore");
vi.mock("../../stores/progressStore");
vi.mock("../../lib/localStorageUtils");

const mockedUseAuthStore = vi.mocked(useAuthStore);
const mockedUseProgressActions = vi.mocked(useProgressActions);
const mockedLoadFromStorage = vi.mocked(localStorageUtils.loadProgress);
const mockedSaveToStorage = vi.mocked(localStorageUtils.saveProgress);

// --- Mock Data & Props ---
interface MockState {
  completed: boolean;
}
const initialMockState: MockState = { completed: false };
const checkCompletionMock = vi.fn((state: MockState) => state.completed);
const hookArgs = {
  unitId: "u1" as UnitId,
  lessonId: "l1" as LessonId,
  sectionId: "s1" as SectionId,
  storageSubKey: "test_storage_key",
  initialState: initialMockState,
  checkCompletion: checkCompletionMock,
};

describe("useSectionProgress", () => {
  const completeSectionMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseProgressActions.mockReturnValue({
      completeSection: completeSectionMock,
    });
    // FIX: Mock the implementation of the auth store to handle selectors
    mockedUseAuthStore.mockImplementation((selector: any) => {
      const state = {
        isAuthenticated: true,
        user: { userId: "user-123" },
      };
      return selector(state);
    });
    checkCompletionMock.mockReturnValue(false);
  });

  it("should initialize with default state if nothing is in storage", () => {
    mockedLoadFromStorage.mockReturnValue(null);

    const { result } = renderHook(() =>
      useSectionProgress(...Object.values(hookArgs))
    );

    const [state, , isComplete] = result.current;
    expect(state).toEqual(initialMockState);
    expect(isComplete).toBe(false);
    expect(mockedLoadFromStorage).toHaveBeenCalledWith(
      "user-123",
      "test_storage_key"
    );
  });

  it("should initialize with state from storage, merging with initial state", () => {
    const savedState = { completed: true };
    mockedLoadFromStorage.mockReturnValue(savedState);
    checkCompletionMock.mockReturnValue(true);

    const { result } = renderHook(() =>
      useSectionProgress(...Object.values(hookArgs))
    );

    const [state, , isComplete] = result.current;
    expect(state).toEqual(savedState);
    expect(isComplete).toBe(true);
  });

  it("should save state to storage when the setter is called", () => {
    const { result } = renderHook(() =>
      useSectionProgress(...Object.values(hookArgs))
    );
    const [, setPersistedState] = result.current;

    const newState = { completed: true };
    act(() => {
      setPersistedState(newState);
    });

    expect(result.current[0]).toEqual(newState);
    expect(mockedSaveToStorage).toHaveBeenCalledTimes(1);
    expect(mockedSaveToStorage).toHaveBeenCalledWith(
      "user-123",
      "test_storage_key",
      newState
    );
  });

  it("should call completeSection when the state becomes complete", () => {
    const { result } = renderHook(() =>
      useSectionProgress(...Object.values(hookArgs))
    );
    const [, setPersistedState] = result.current;

    expect(result.current[2]).toBe(false);
    expect(completeSectionMock).not.toHaveBeenCalled();

    checkCompletionMock.mockReturnValue(true);
    act(() => {
      setPersistedState({ completed: true });
    });

    expect(result.current[2]).toBe(true);
    expect(completeSectionMock).toHaveBeenCalledTimes(1);
    expect(completeSectionMock).toHaveBeenCalledWith(
      hookArgs.unitId,
      hookArgs.lessonId,
      hookArgs.sectionId
    );
  });

  it("should reload state from storage when the user logs in", () => {
    // ARRANGE 1: Start as anonymous
    mockedUseAuthStore.mockImplementation((selector: any) => {
      const state = { isAuthenticated: false, user: null };
      return selector(state);
    });
    mockedLoadFromStorage.mockReturnValue({ completed: false });
    const { result, rerender } = renderHook(() =>
      useSectionProgress(...Object.values(hookArgs))
    );

    expect(mockedLoadFromStorage).toHaveBeenCalledWith(
      ANONYMOUS_USER_ID_PLACEHOLDER,
      "test_storage_key"
    );

    // ARRANGE 2: Simulate login
    mockedUseAuthStore.mockImplementation((selector: any) => {
      const state = { isAuthenticated: true, user: { userId: "user-456" } };
      return selector(state);
    });
    mockedLoadFromStorage.mockReturnValue({ completed: true });

    rerender();

    expect(mockedLoadFromStorage).toHaveBeenCalledWith(
      "user-456",
      "test_storage_key"
    );
    expect(mockedLoadFromStorage).toHaveBeenCalledTimes(3);
    const [state] = result.current;
    expect(state.completed).toBe(true);
  });

  describe("edge cases", () => {
    it("should handle storage returning null and use initial state", () => {
      mockedLoadFromStorage.mockReturnValue(null);

      const { result } = renderHook(() =>
        useSectionProgress(...Object.values(hookArgs))
      );

      const [state] = result.current;
      expect(state).toEqual(initialMockState);
    });

    it("should merge saved state with initial state", () => {
      const partialSavedState = { completed: true };
      const extendedInitialState = { completed: false, extra: "value" };
      mockedLoadFromStorage.mockReturnValue(partialSavedState);

      const { result } = renderHook(() =>
        useSectionProgress(
          hookArgs.unitId,
          hookArgs.lessonId,
          hookArgs.sectionId,
          hookArgs.storageSubKey,
          extendedInitialState as any,
          checkCompletionMock
        )
      );

      const [state] = result.current;
      expect(state).toEqual({ completed: true, extra: "value" });
    });

    it("should call completeSection on mount and each setState when complete", () => {
      checkCompletionMock.mockReturnValue(true);
      mockedLoadFromStorage.mockReturnValue({ completed: true });

      const { result } = renderHook(() =>
        useSectionProgress(...Object.values(hookArgs))
      );

      const [, setPersistedState] = result.current;

      // Called once on mount
      expect(completeSectionMock).toHaveBeenCalledTimes(1);

      // Set to same completed state multiple times
      act(() => {
        setPersistedState({ completed: true });
      });
      act(() => {
        setPersistedState({ completed: true });
      });

      // Gets called each time state changes while complete
      expect(completeSectionMock).toHaveBeenCalledTimes(3);
    });

    it("should handle function updater pattern for setState", () => {
      mockedLoadFromStorage.mockReturnValue({ completed: false });

      const { result } = renderHook(() =>
        useSectionProgress(...Object.values(hookArgs))
      );

      const [, setPersistedState] = result.current;

      act(() => {
        setPersistedState((prev: MockState) => ({
          ...prev,
          completed: true,
        }));
      });

      expect(result.current[0].completed).toBe(true);
      expect(mockedSaveToStorage).toHaveBeenCalledWith(
        "user-123",
        "test_storage_key",
        { completed: true }
      );
    });

    it("should use anonymous placeholder when user is not authenticated", () => {
      mockedUseAuthStore.mockImplementation((selector: any) => {
        const state = { isAuthenticated: false, user: null };
        return selector(state);
      });
      mockedLoadFromStorage.mockReturnValue(null);

      renderHook(() => useSectionProgress(...Object.values(hookArgs)));

      expect(mockedLoadFromStorage).toHaveBeenCalledWith(
        ANONYMOUS_USER_ID_PLACEHOLDER,
        "test_storage_key"
      );
    });

    it("should not call completeSection if already completed on mount", () => {
      checkCompletionMock.mockReturnValue(true);
      mockedLoadFromStorage.mockReturnValue({ completed: true });

      renderHook(() => useSectionProgress(...Object.values(hookArgs)));

      // Should be called once for initial complete state
      expect(completeSectionMock).toHaveBeenCalledTimes(1);
    });

    it("should handle checkCompletion returning false after being true", () => {
      checkCompletionMock.mockReturnValue(false);
      mockedLoadFromStorage.mockReturnValue({ completed: false });

      const { result } = renderHook(() =>
        useSectionProgress(...Object.values(hookArgs))
      );

      const [, setPersistedState] = result.current;

      // First make it complete
      checkCompletionMock.mockReturnValue(true);
      act(() => {
        setPersistedState({ completed: true });
      });

      expect(result.current[2]).toBe(true);
      expect(completeSectionMock).toHaveBeenCalledTimes(1);

      // Then make it incomplete again
      checkCompletionMock.mockReturnValue(false);
      act(() => {
        setPersistedState({ completed: false });
      });

      expect(result.current[2]).toBe(false);
      // Should not call completeSection again
      expect(completeSectionMock).toHaveBeenCalledTimes(1);
    });

    it("should save state every time setter is called", () => {
      mockedLoadFromStorage.mockReturnValue({ completed: false });

      const { result } = renderHook(() =>
        useSectionProgress(...Object.values(hookArgs))
      );

      const [, setPersistedState] = result.current;

      act(() => {
        setPersistedState({ completed: false });
      });
      act(() => {
        setPersistedState({ completed: false });
      });
      act(() => {
        setPersistedState({ completed: false });
      });

      // Should save every time, even with same value
      expect(mockedSaveToStorage).toHaveBeenCalledTimes(3);
    });
  });
});
