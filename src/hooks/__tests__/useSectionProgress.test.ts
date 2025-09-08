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
});
