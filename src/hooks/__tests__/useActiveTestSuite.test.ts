import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useActiveTestSuite, ActiveTest } from "../useActiveTestSuite";
import { usePyodide } from "../../contexts/PyodideContext";
import * as localStorageUtils from "../../lib/localStorageUtils";
import type { UserId } from "../../types/data";

// --- Mocks Setup ---
vi.mock("../../contexts/PyodideContext");
vi.mock("../../lib/localStorageUtils");
vi.mock("uuid", () => ({
  v4: () => "mock-uuid-123", // Use a static ID for predictable tests
}));

const mockedUsePyodide = vi.mocked(usePyodide);
const mockedLoadProgress = vi.mocked(localStorageUtils.loadProgress);
const mockedSaveProgress = vi.mocked(localStorageUtils.saveProgress);

describe("useActiveTestSuite", () => {
  const runPythonCodeMock = vi.fn();
  const userId = "test-user" as UserId;

  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a default mock for usePyodide
    mockedUsePyodide.mockReturnValue({
      runPythonCode: runPythonCodeMock,
      isLoading: false,
      error: null,
    });
    // Default mock for localStorage
    mockedLoadProgress.mockReturnValue([]);
  });

  it("should load initial tests from localStorage on mount", () => {
    const initialTests: ActiveTest[] = [
      {
        id: "1",
        name: "test_one",
        code: "def test_one(): pass",
        status: "pending",
      },
    ];
    mockedLoadProgress.mockReturnValue(initialTests);

    const { result } = renderHook(() => useActiveTestSuite(userId));

    expect(mockedLoadProgress).toHaveBeenCalledWith(userId, expect.any(String));
    expect(result.current.activeTests).toEqual(initialTests);
  });

  it("should add a new test to the suite via addTestToSuite", () => {
    const { result } = renderHook(() => useActiveTestSuite(userId));

    act(() => {
      result.current.addTestToSuite("def test_new():\n  assert 1 == 1");
    });

    expect(result.current.activeTests).toHaveLength(1);
    expect(result.current.activeTests[0]).toEqual({
      id: "mock-uuid-123",
      name: "test_new",
      code: "def test_new():\n  assert 1 == 1",
      status: "pending",
      output: "",
    });
  });

  it("should delete a test from the suite via deleteTestFromSuite", () => {
    const initialTests: ActiveTest[] = [
      { id: "1", name: "test_one", code: "code1", status: "pending" },
      { id: "2", name: "test_two", code: "code2", status: "pending" },
    ];
    mockedLoadProgress.mockReturnValue(initialTests);

    const { result } = renderHook(() => useActiveTestSuite(userId));

    act(() => {
      result.current.deleteTestFromSuite("1");
    });

    expect(result.current.activeTests).toHaveLength(1);
    expect(result.current.activeTests[0].id).toBe("2");
  });

  it("should save tests to localStorage whenever they change", () => {
    const { result } = renderHook(() => useActiveTestSuite(userId));

    act(() => {
      result.current.addTestToSuite("def test_save(): pass");
    });

    expect(mockedSaveProgress).toHaveBeenCalledWith(
      userId,
      expect.any(String), // The storage key
      expect.any(Array) // The array of tests
    );
  });

  describe("runActiveTests", () => {
    it("should execute all active tests and update their status to passed", async () => {
      const { result } = renderHook(() => useActiveTestSuite(userId));
      act(() => {
        result.current.addTestToSuite("def test_passing(): pass");
      });

      // Mock a successful main code run
      runPythonCodeMock.mockResolvedValueOnce({
        success: true,
        stdout: "",
        stderr: "",
        result: null,
        error: null,
      });
      // Mock a successful test run
      runPythonCodeMock.mockResolvedValueOnce({
        success: true,
        stdout: `===PYTEST_SINGLE_RESULT_JSON===\n${JSON.stringify({
          name: "test_passing",
          status: "PASSED",
          output: "",
        })}\n===END_PYTEST_SINGLE_RESULT_JSON===`,
        stderr: "",
        result: null,
        error: null,
      });

      await act(async () => {
        await result.current.runActiveTests("main_code = True");
      });

      await waitFor(() => {
        expect(result.current.isRunningTests).toBe(false);
      });

      expect(result.current.activeTests[0].status).toBe("passed");
      expect(result.current.activeTests[0].output).toBe("");
    });

    it("should mark a test as failed if it returns a FAILED status", async () => {
      const { result } = renderHook(() => useActiveTestSuite(userId));
      act(() => {
        result.current.addTestToSuite("def test_failing(): assert False");
      });

      runPythonCodeMock.mockResolvedValueOnce({
        success: true,
        stdout: "",
        stderr: "",
        result: null,
        error: null,
      }); // Main code
      runPythonCodeMock.mockResolvedValueOnce({
        success: true,
        stdout: `===PYTEST_SINGLE_RESULT_JSON===\n${JSON.stringify({
          name: "test_failing",
          status: "FAILED",
          output: "AssertionError: assert False",
        })}\n===END_PYTEST_SINGLE_RESULT_JSON===`,
        stderr: "",
        result: null,
        error: null,
      });

      await act(async () => {
        await result.current.runActiveTests("main_code = True");
      });

      await waitFor(() => {
        expect(result.current.activeTests[0].status).toBe("failed");
      });
      expect(result.current.activeTests[0].output).toContain("AssertionError");
    });

    it("should mark all tests as error if the main code fails to execute", async () => {
      const { result } = renderHook(() => useActiveTestSuite(userId));
      act(() => {
        result.current.addTestToSuite("def test_one(): pass");
      });

      // Mock a failed main code run
      runPythonCodeMock.mockResolvedValueOnce({
        success: false,
        stdout: "",
        stderr: "",
        result: null,
        error: {
          type: "SyntaxError",
          message: "invalid syntax",
        },
      });

      await act(async () => {
        await result.current.runActiveTests("invalid main code");
      });

      await waitFor(() => {
        expect(result.current.isRunningTests).toBe(false);
      });

      expect(result.current.activeTests[0].status).toBe("error");
      expect(result.current.activeTests[0].output).toContain(
        "Error in main code: SyntaxError"
      );
    });
  });
});
