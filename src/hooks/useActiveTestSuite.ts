// src/hooks/useActiveTestSuite.ts
import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { usePyodide } from "../contexts/PyodideContext";
import { loadProgress, saveProgress } from "../lib/localStorageUtils";

const ACTIVE_TESTS_STORAGE_KEY = "codeEditorPage_activeTests_v3"; // Updated version if schema changes

export type TestStatus = "pending" | "passed" | "failed" | "error";

export interface ActiveTest {
  id: string;
  name: string; // Should ideally be the actual 'test_...' function name if possible
  code: string;
  status: TestStatus;
  output?: string;
}

// For parsing Pyodide results from the test runner
export interface PytestSimResult {
  name: string; // Name of the test function executed (e.g., test_addition)
  status: "PASSED" | "FAILED" | "ERROR";
  output: string;
}

const extractTestFunctionName = (code: string): string | null => {
  const match = code.match(/def\s+(test_[a-zA-Z0-9_]+)\s*\(/);
  return match && match[1] ? match[1] : null;
};

export const useActiveTestSuite = () => {
  const [activeTests, setActiveTests] = useState<ActiveTest[]>(
    () => loadProgress<ActiveTest[]>(ACTIVE_TESTS_STORAGE_KEY) || []
  );
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();

  // Persist activeTests to localStorage
  useEffect(() => {
    saveProgress(ACTIVE_TESTS_STORAGE_KEY, activeTests);
  }, [activeTests]);

  const addTestToSuite = useCallback(
    (testCode: string, userGivenName?: string) => {
      if (!testCode.trim()) return;

      const functionName = extractTestFunctionName(testCode);
      const displayName =
        userGivenName || functionName || `Test ${Date.now() % 10000}`;

      const newTest: ActiveTest = {
        id: uuidv4(),
        name: displayName, // This name is crucial for matching results
        code: testCode,
        status: "pending",
        output: "",
      };
      setActiveTests((prevTests) => [...prevTests, newTest]);
    },
    []
  );

  const deleteTestFromSuite = useCallback((testId: string) => {
    setActiveTests((prevTests) =>
      prevTests.filter((test) => test.id !== testId)
    );
  }, []);

  const runActiveTests = useCallback(
    async (mainCode: string) => {
      if (isPyodideLoading || !runPythonCode || activeTests.length === 0) {
        setActiveTests((prev) =>
          prev.map((t) => ({
            ...t,
            status: "error",
            output:
              pyodideError?.message || "Pyodide not ready or no active tests.",
          }))
        );
        return;
      }

      setIsRunningTests(true);
      // Reset statuses to pending and clear previous output before run
      setActiveTests((prev) =>
        prev.map((test) => ({
          ...test,
          status: "pending",
          output: "Running...",
        }))
      );

      const allTestCodeSnippets = activeTests
        .map((test) => test.code)
        .join("\n\n# === Next Test Snippet ===\n");

      const testRunnerScript = `
import json
import traceback

# ==== User's Main Code Start ====
${mainCode}
# ==== User's Main Code End ====

# ==== User's Active Test Code Start ====
${allTestCodeSnippets}
# ==== User's Active Test Code End ====

# ==== Simple Pytest-like Test Runner ====
results = []
tests_to_run_from_globals = []

# Discover test functions defined by the concatenated test snippets
for name_in_globals, item_in_globals in list(globals().items()):
    if name_in_globals.startswith("test_") and callable(item_in_globals):
        tests_to_run_from_globals.append({"name": name_in_globals, "func": item_in_globals})

if not tests_to_run_from_globals:
    print("===PYTEST_RESULTS_JSON===")
    print(json.dumps([{"name": "No test functions found", "status": "ERROR", "output": "No functions starting with 'test_' were found in the active test suite code."}]))
    print("===END_PYTEST_RESULTS_JSON===")
else:
    for test_info in tests_to_run_from_globals:
        test_name = test_info["name"] # This is the 'test_xyz' function name
        test_func = test_info["func"]
        try:
            test_func()
            results.append({"name": test_name, "status": "PASSED", "output": ""})
        except AssertionError as e:
            results.append({"name": test_name, "status": "FAILED", "output": f"AssertionError: {e}"})
        except Exception as e:
            tb_str = traceback.format_exc()
            results.append({"name": test_name, "status": "ERROR", "output": tb_str})
    
    print("===PYTEST_RESULTS_JSON===")
    print(json.dumps(results))
    print("===END_PYTEST_RESULTS_JSON===")
    `;

      const { output: rawPyodideOutput, error: pyodideExecError } =
        await runPythonCode(testRunnerScript);

      if (pyodideExecError) {
        setActiveTests((prev) =>
          prev.map((t) => ({
            ...t,
            status: "error",
            output: `Pyodide execution error: ${pyodideExecError}`,
          }))
        );
      } else {
        const match = rawPyodideOutput.match(
          /===PYTEST_RESULTS_JSON===\s*([\s\S]*?)\s*===END_PYTEST_RESULTS_JSON===/
        );
        if (match && match[1]) {
          try {
            const parsedResults = JSON.parse(
              match[1].trim()
            ) as PytestSimResult[];

            setActiveTests((prevTests) =>
              prevTests.map((activeTest) => {
                // Match result by the function name defined within the test's code
                // The activeTest.name is for display; the runner identifies tests by their actual def test_... name
                const actualTestFuncNameInCode =
                  extractTestFunctionName(activeTest.code) || activeTest.name; // Fallback to activeTest.name if no def test_ is found (less ideal)
                const result = parsedResults.find(
                  (r) => r.name === actualTestFuncNameInCode
                );

                if (result) {
                  return {
                    ...activeTest,
                    status: result.status.toLowerCase() as TestStatus,
                    output: result.output,
                  };
                }
                // If this specific active test's function wasn't found by the runner, mark it as an error or skipped.
                // This can happen if the code snippet in activeTest.code doesn't define a discoverable test_ function.
                if (
                  parsedResults.length > 0 &&
                  parsedResults[0].name === "No test functions found" &&
                  parsedResults[0].status === "ERROR"
                ) {
                  return {
                    ...activeTest,
                    status: "error",
                    output:
                      "Test function not found or not discoverable in its snippet.",
                  };
                }
                return {
                  ...activeTest,
                  status: "error",
                  output:
                    "Test function not executed or result not found in runner output.",
                };
              })
            );
          } catch (parseError) {
            console.error(
              "Error parsing test results:",
              parseError,
              "\nRaw output:",
              rawPyodideOutput
            );
            setActiveTests((prev) =>
              prev.map((t) => ({
                ...t,
                status: "error",
                output: `Failed to parse test results: ${parseError}\nOutput snippet:\n${rawPyodideOutput.substring(
                  0,
                  500
                )}`,
              }))
            );
          }
        } else {
          setActiveTests((prev) =>
            prev.map((t) => ({
              ...t,
              status: "error",
              output: `Test runner output format error.\nOutput snippet:\n${rawPyodideOutput.substring(
                0,
                500
              )}`,
            }))
          );
        }
      }
      setIsRunningTests(false);
    },
    [activeTests, runPythonCode, isPyodideLoading, pyodideError]
  ); // Removed mainCode from deps, it's passed as arg

  return {
    activeTests,
    addTestToSuite,
    deleteTestFromSuite,
    runActiveTests,
    isRunningTests,
    // Expose Pyodide loading/error state if CodeEditorPage needs it for global disabling
    isPyodideReady: !isPyodideLoading && !pyodideError,
    pyodideHookError: pyodideError,
  };
};
