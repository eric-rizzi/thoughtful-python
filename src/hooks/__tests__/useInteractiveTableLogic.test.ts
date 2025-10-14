import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { useInteractiveTableLogic } from "../useInteractiveTableLogic";
import { usePyodide } from "../../contexts/PyodideContext";
import type {
  UnitId,
  LessonId,
  SectionId,
  InputParam,
  CoverageTableRow,
  PredictionTableRow,
} from "../../types/data";

// Mock dependencies
vi.mock("../../contexts/PyodideContext");

const mockRunPythonCode = vi.fn();
const mockedUsePyodide = vi.mocked(usePyodide);

describe("useInteractiveTableLogic", () => {
  const defaultColumns: InputParam[] = [
    { variableName: "a", variableType: "number" },
    { variableName: "b", variableType: "number" },
  ];

  const coverageRows: CoverageTableRow[] = [
    { expectedOutput: "5", id: "row-1" },
    { expectedOutput: "10", id: "row-2" },
  ];

  const predictionRows: PredictionTableRow[] = [
    { inputs: [2, 3], id: "row-1" },
    { inputs: [5, 5], id: "row-2" },
  ];

  const coverageProps = {
    unitId: "unit-1" as UnitId,
    lessonId: "lesson-1" as LessonId,
    sectionId: "section-1" as SectionId,
    mode: "coverage" as const,
    testMode: "function" as const,
    functionCode: "def add(a, b):\n  return a + b",
    functionToTest: "add",
    columns: defaultColumns,
    rows: coverageRows,
  };

  const predictionProps = {
    unitId: "unit-1" as UnitId,
    lessonId: "lesson-1" as LessonId,
    sectionId: "section-1" as SectionId,
    mode: "prediction" as const,
    testMode: "function" as const,
    functionCode: "def add(a, b):\n  return a + b",
    functionToTest: "add",
    columns: defaultColumns,
    rows: predictionRows,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUsePyodide.mockReturnValue({
      runPythonCode: mockRunPythonCode,
      isLoading: false,
      error: null,
      loadPackages: vi.fn(),
    });
  });

  describe("coverage mode", () => {
    it("should initialize with empty coverage state", () => {
      const { result } = renderHook(() =>
        useInteractiveTableLogic(coverageProps)
      );

      expect(result.current.savedState).toEqual({
        challengeStates: {
          0: { inputs: { a: "", b: "" }, actualOutput: null, isCorrect: null },
          1: { inputs: { a: "", b: "" }, actualOutput: null, isCorrect: null },
        },
      });
    });

    it("should handle input change for coverage mode", () => {
      const { result } = renderHook(() =>
        useInteractiveTableLogic(coverageProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "2", "a");
      });

      const state = result.current.savedState as any;
      expect(state.challengeStates[0].inputs.a).toBe("2");
    });

    it("should run coverage row and check correctness", async () => {
      mockRunPythonCode.mockResolvedValue({
        output: "5",
        error: null,
        result: null,
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(coverageProps)
      );

      // Set inputs first
      act(() => {
        result.current.handleUserInputChange(0, "2", "a");
        result.current.handleUserInputChange(0, "3", "b");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      expect(mockRunPythonCode).toHaveBeenCalledWith(
        "def add(a, b):\n  return a + b\n\nprint(add(2, 3))"
      );

      const state = result.current.savedState as any;
      expect(state.challengeStates[0].actualOutput).toBe("5");
      expect(state.challengeStates[0].isCorrect).toBe(true);
    });

    it("should mark coverage row as incorrect when output doesn't match", async () => {
      mockRunPythonCode.mockResolvedValue({
        output: "6",
        error: null,
        result: null,
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(coverageProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "2", "a");
        result.current.handleUserInputChange(0, "3", "b");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      const state = result.current.savedState as any;
      expect(state.challengeStates[0].actualOutput).toBe("6");
      expect(state.challengeStates[0].isCorrect).toBe(false);
    });

    it("should handle Python errors in coverage mode", async () => {
      mockRunPythonCode.mockResolvedValue({
        output: null,
        error: "NameError: name 'x' is not defined",
        result: null,
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(coverageProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "2", "a");
        result.current.handleUserInputChange(0, "3", "b");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      const state = result.current.savedState as any;
      expect(state.challengeStates[0].actualOutput).toContain("Error:");
      expect(state.challengeStates[0].isCorrect).toBe(false);
    });

    it("should reset correctness when input changes", () => {
      const { result } = renderHook(() =>
        useInteractiveTableLogic(coverageProps)
      );

      // Manually set a previous state with correctness
      act(() => {
        result.current.handleUserInputChange(0, "2", "a");
        result.current.handleUserInputChange(0, "3", "b");
      });

      const state = result.current.savedState as any;
      expect(state.challengeStates[0].isCorrect).toBe(null);
      expect(state.challengeStates[0].actualOutput).toBe(null);
    });

    it("should parse number inputs correctly", async () => {
      mockRunPythonCode.mockResolvedValue({
        output: "7",
        error: null,
        result: null,
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(coverageProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "3.5", "a");
        result.current.handleUserInputChange(0, "3.5", "b");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      expect(mockRunPythonCode).toHaveBeenCalledWith(
        "def add(a, b):\n  return a + b\n\nprint(add(3.5, 3.5))"
      );
    });
  });

  describe("prediction mode", () => {
    it("should initialize with empty prediction state", () => {
      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      expect(result.current.savedState).toEqual({
        predictions: {
          0: { userAnswer: "", actualOutput: null, isCorrect: null },
          1: { userAnswer: "", actualOutput: null, isCorrect: null },
        },
      });
    });

    it("should handle user answer change for prediction mode", () => {
      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "5");
      });

      const state = result.current.savedState as any;
      expect(state.predictions[0].userAnswer).toBe("5");
    });

    it("should run prediction row and check correctness", async () => {
      mockRunPythonCode.mockResolvedValue({
        output: "5",
        error: null,
        result: null,
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "5");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      expect(mockRunPythonCode).toHaveBeenCalledWith(
        "def add(a, b):\n  return a + b\n\nprint(add(2, 3))"
      );

      const state = result.current.savedState as any;
      expect(state.predictions[0].actualOutput).toBe("5");
      expect(state.predictions[0].isCorrect).toBe(true);
    });

    it("should mark prediction as incorrect when answer doesn't match", async () => {
      mockRunPythonCode.mockResolvedValue({
        output: "5",
        error: null,
        result: null,
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "10");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      const state = result.current.savedState as any;
      expect(state.predictions[0].actualOutput).toBe("5");
      expect(state.predictions[0].isCorrect).toBe(false);
    });

    it("should handle Python errors in prediction mode", async () => {
      mockRunPythonCode.mockResolvedValue({
        output: null,
        error: "TypeError: unsupported operand type(s)",
        result: null,
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "5");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      const state = result.current.savedState as any;
      expect(state.predictions[0].actualOutput).toContain("Error:");
      expect(state.predictions[0].isCorrect).toBe(false);
    });

    it("should reset correctness when user answer changes", () => {
      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "new answer");
      });

      const state = result.current.savedState as any;
      expect(state.predictions[0].isCorrect).toBe(null);
      expect(state.predictions[0].actualOutput).toBe(null);
    });

    it("should trim whitespace when comparing predictions", async () => {
      mockRunPythonCode.mockResolvedValue({
        output: "  5  ",
        error: null,
        result: null,
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "  5  ");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      const state = result.current.savedState as any;
      expect(state.predictions[0].isCorrect).toBe(true);
    });

    it("should handle None output", async () => {
      mockRunPythonCode.mockResolvedValue({
        output: null,
        error: null,
        result: null,
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "None");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      const state = result.current.savedState as any;
      expect(state.predictions[0].actualOutput).toBe("None");
      expect(state.predictions[0].isCorrect).toBe(true);
    });
  });

  describe("common functionality", () => {
    it("should track running state during execution", async () => {
      let resolvePromise: any;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockRunPythonCode.mockReturnValue(promise);

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "5");
        result.current.runRow(0);
      });

      expect(result.current.runningStates[0]).toBe(true);

      await act(async () => {
        resolvePromise({ output: "5", error: null, result: null });
        await promise;
      });

      expect(result.current.runningStates[0]).toBe(false);
    });

    it("should handle exception thrown during execution", async () => {
      mockRunPythonCode.mockRejectedValue(new Error("Pyodide crash"));

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "5");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      const state = result.current.savedState as any;
      expect(state.predictions[0].actualOutput).toContain(
        "Error: Pyodide crash"
      );
      expect(state.predictions[0].isCorrect).toBe(false);
    });

    it("should handle Pyodide loading state", () => {
      mockedUsePyodide.mockReturnValue({
        runPythonCode: mockRunPythonCode,
        isLoading: true,
        error: null,
        loadPackages: vi.fn(),
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      expect(result.current.isLoading).toBe(true);
    });

    it("should handle Pyodide error", () => {
      mockedUsePyodide.mockReturnValue({
        runPythonCode: mockRunPythonCode,
        isLoading: false,
        error: new Error("Pyodide failed to load"),
        loadPackages: vi.fn(),
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      expect(result.current.pyodideError?.message).toBe(
        "Pyodide failed to load"
      );
    });

    it("should handle multiple rows independently", async () => {
      mockRunPythonCode
        .mockResolvedValueOnce({ output: "5", error: null, result: null })
        .mockResolvedValueOnce({ output: "10", error: null, result: null });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "5");
        result.current.handleUserInputChange(1, "10");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      await act(async () => {
        await result.current.runRow(1);
      });

      const state = result.current.savedState as any;
      expect(state.predictions[0].actualOutput).toBe("5");
      expect(state.predictions[0].isCorrect).toBe(true);
      expect(state.predictions[1].actualOutput).toBe("10");
      expect(state.predictions[1].isCorrect).toBe(true);
    });

    it("should handle empty function output", async () => {
      mockRunPythonCode.mockResolvedValue({
        output: "",
        error: null,
        result: null,
      });

      const { result } = renderHook(() =>
        useInteractiveTableLogic(predictionProps)
      );

      act(() => {
        result.current.handleUserInputChange(0, "");
      });

      await act(async () => {
        await result.current.runRow(0);
      });

      const state = result.current.savedState as any;
      // Empty string output gets trimmed to "", not "None"
      expect(state.predictions[0].actualOutput).toBe("");
      expect(state.predictions[0].isCorrect).toBe(true);
    });
  });
});
