import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useTestingLogic } from "../useTestingLogic";
import { usePyodide } from "../../contexts/PyodideContext";
import { useProgressActions } from "../../stores/progressStore";
import type { TestCase, UnitId, LessonId, SectionId } from "../../types/data";

// Mock dependencies
vi.mock("../../contexts/PyodideContext");
vi.mock("../../stores/progressStore");

const mockRunPythonCode = vi.fn();
const mockCompleteSection = vi.fn();
const mockedUsePyodide = vi.mocked(usePyodide);
const mockedUseProgressActions = vi.mocked(useProgressActions);

describe("useTestingLogic", () => {
  const defaultProps = {
    unitId: "unit-1" as UnitId,
    lessonId: "lesson-1" as LessonId,
    sectionId: "section-1" as SectionId,
    functionToTest: "add",
    testCases: [
      { input: [2, 3], expected: 5, description: "adds 2 and 3" },
      { input: [5, 10], expected: 15, description: "adds 5 and 10" },
    ] as TestCase[],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUsePyodide.mockReturnValue({
      runPythonCode: mockRunPythonCode,
      isLoading: false,
      error: null,
      loadPackages: vi.fn(),
    });

    mockedUseProgressActions.mockReturnValue({
      completeSection: mockCompleteSection,
    });
  });

  describe("function testing mode", () => {
    it("should run tests for a function and mark all as passed", async () => {
      mockRunPythonCode
        .mockResolvedValueOnce({
          output: "Setup complete",
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 5,
            expected: 5,
            input: [2, 3],
            passed: true,
          }),
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 15,
            expected: 15,
            input: [5, 10],
            passed: true,
          }),
          error: null,
          result: null,
        });

      const { result } = renderHook(() => useTestingLogic(defaultProps));

      await act(async () => {
        await result.current.runTests("def add(a, b):\n    return a + b");
      });

      expect(result.current.testResults).toHaveLength(2);
      expect(result.current.testResults![0].passed).toBe(true);
      expect(result.current.testResults![1].passed).toBe(true);
      expect(mockCompleteSection).toHaveBeenCalledWith(
        defaultProps.unitId,
        defaultProps.lessonId,
        defaultProps.sectionId
      );
    });

    it("should mark tests as failed when function returns wrong value", async () => {
      mockRunPythonCode
        .mockResolvedValueOnce({
          output: "Setup complete",
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 6,
            expected: 5,
            input: [2, 3],
            passed: false,
          }),
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 50,
            expected: 15,
            input: [5, 10],
            passed: false,
          }),
          error: null,
          result: null,
        });

      const { result } = renderHook(() => useTestingLogic(defaultProps));

      await act(async () => {
        await result.current.runTests("def add(a, b):\n    return a * b");
      });

      expect(result.current.testResults).toHaveLength(2);
      expect(result.current.testResults![0].passed).toBe(false);
      expect(result.current.testResults![0].actual).toBe(6);
      expect(mockCompleteSection).not.toHaveBeenCalled();
    });

    it("should handle function not defined error", async () => {
      mockRunPythonCode.mockResolvedValueOnce({
        output: null,
        error: "NameError: Function 'add' is not defined.",
        result: null,
      });

      const { result } = renderHook(() => useTestingLogic(defaultProps));

      await act(async () => {
        await result.current.runTests("# no function defined");
      });

      expect(result.current.error).toContain("Function 'add' is not defined");
    });

    it("should handle runtime errors in test execution", async () => {
      mockRunPythonCode
        .mockResolvedValueOnce({
          output: "Setup complete",
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: false,
            error: "TypeError: unsupported operand type(s)",
            input: [2, 3],
            expected: 5,
          }),
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: false,
            error: "TypeError: unsupported operand type(s)",
            input: [5, 10],
            expected: 15,
          }),
          error: null,
          result: null,
        });

      const { result } = renderHook(() => useTestingLogic(defaultProps));

      await act(async () => {
        await result.current.runTests("def add(a, b):\n    return a + 'string'");
      });

      expect(result.current.testResults).toHaveLength(2);
      expect(result.current.testResults![0].passed).toBe(false);
      expect(result.current.testResults![0].actual).toContain("Error:");
    });
  });

  describe("__main__ testing mode", () => {
    const mainProps = {
      ...defaultProps,
      functionToTest: "__main__",
      testCases: [
        { input: null, expected: "Hello, World!", description: "prints greeting" },
      ] as TestCase[],
    };

    it("should test program output", async () => {
      mockRunPythonCode.mockResolvedValueOnce({
        output: JSON.stringify({
          success: true,
          actual: "Hello, World!",
          expected: "Hello, World!",
          passed: true,
        }),
        error: null,
        result: null,
      });

      const { result } = renderHook(() => useTestingLogic(mainProps));

      await act(async () => {
        await result.current.runTests('print("Hello, World!")');
      });

      expect(result.current.testResults).toHaveLength(1);
      expect(result.current.testResults![0].passed).toBe(true);
      expect(mockCompleteSection).toHaveBeenCalled();
    });

    it("should detect incorrect program output", async () => {
      mockRunPythonCode.mockResolvedValueOnce({
        output: JSON.stringify({
          success: true,
          actual: "Goodbye!",
          expected: "Hello, World!",
          passed: false,
        }),
        error: null,
        result: null,
      });

      const { result } = renderHook(() => useTestingLogic(mainProps));

      await act(async () => {
        await result.current.runTests('print("Goodbye!")');
      });

      expect(result.current.testResults![0].passed).toBe(false);
      expect(mockCompleteSection).not.toHaveBeenCalled();
    });

    it("should handle execution errors in __main__ mode", async () => {
      mockRunPythonCode.mockResolvedValueOnce({
        output: JSON.stringify({
          success: false,
          error: "NameError: name 'undefined_var' is not defined",
          actual: "",
          expected: "Hello, World!",
        }),
        error: null,
        result: null,
      });

      const { result } = renderHook(() => useTestingLogic(mainProps));

      await act(async () => {
        await result.current.runTests("print(undefined_var)");
      });

      expect(result.current.testResults![0].passed).toBe(false);
      expect(result.current.testResults![0].actual).toContain("Error:");
    });
  });

  describe("edge cases", () => {
    it("should handle JSON parse errors", async () => {
      mockRunPythonCode
        .mockResolvedValueOnce({
          output: "Setup complete",
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: "invalid json {",
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 15,
            expected: 15,
            input: [5, 10],
            passed: true,
          }),
          error: null,
          result: null,
        });

      const { result } = renderHook(() => useTestingLogic(defaultProps));

      await act(async () => {
        await result.current.runTests("def add(a, b):\n    return a + b");
      });

      expect(result.current.testResults).not.toBeNull();
      expect(result.current.testResults![0].passed).toBe(false);
      expect(result.current.testResults![0].actual).toContain("Parse error");
    });

    it("should handle Pyodide execution errors", async () => {
      mockRunPythonCode
        .mockResolvedValueOnce({
          output: "Setup complete",
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: null,
          error: "Pyodide internal error",
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 15,
            expected: 15,
            input: [5, 10],
            passed: true,
          }),
          error: null,
          result: null,
        });

      const { result } = renderHook(() => useTestingLogic(defaultProps));

      await act(async () => {
        await result.current.runTests("def add(a, b):\n    return a + b");
      });

      expect(result.current.testResults).not.toBeNull();
      expect(result.current.testResults![0].passed).toBe(false);
      expect(result.current.testResults![0].actual).toContain("Execution error");
    });

    it("should reset state when running new tests", async () => {
      mockRunPythonCode
        .mockResolvedValueOnce({
          output: "Setup complete",
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 5,
            expected: 5,
            input: [2, 3],
            passed: true,
          }),
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 15,
            expected: 15,
            input: [5, 10],
            passed: true,
          }),
          error: null,
          result: null,
        });

      const { result } = renderHook(() => useTestingLogic(defaultProps));

      await act(async () => {
        await result.current.runTests("def add(a, b):\n    return a + b");
      });

      expect(result.current.testResults).toHaveLength(2);
      expect(result.current.error).toBeFalsy();

      // Run again
      mockRunPythonCode
        .mockResolvedValueOnce({
          output: "Setup complete",
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: false,
            error: "some error",
            input: [2, 3],
            expected: 5,
          }),
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 15,
            expected: 15,
            input: [5, 10],
            passed: true,
          }),
          error: null,
          result: null,
        });

      await act(async () => {
        await result.current.runTests("def add(a, b):\n    return a + b");
      });

      expect(result.current.testResults).toHaveLength(2);
      expect(result.current.testResults![0].passed).toBe(false);
    });

    it("should track isLoading state during execution", async () => {
      let resolvePromise: any;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockRunPythonCode.mockReturnValue(promise);

      const { result } = renderHook(() => useTestingLogic(defaultProps));

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.runTests("def add(a, b):\n    return a + b");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise({
          output: "Setup complete",
          error: null,
          result: null,
        });
        await promise;
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should not complete section if not all tests pass", async () => {
      mockRunPythonCode
        .mockResolvedValueOnce({
          output: "Setup complete",
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 5,
            expected: 5,
            input: [2, 3],
            passed: true,
          }),
          error: null,
          result: null,
        })
        .mockResolvedValueOnce({
          output: JSON.stringify({
            success: true,
            actual: 10,
            expected: 15,
            input: [5, 10],
            passed: false,
          }),
          error: null,
          result: null,
        });

      const { result } = renderHook(() => useTestingLogic(defaultProps));

      await act(async () => {
        await result.current.runTests("def add(a, b):\n    return a + b");
      });

      expect(mockCompleteSection).not.toHaveBeenCalled();
    });
  });
});
