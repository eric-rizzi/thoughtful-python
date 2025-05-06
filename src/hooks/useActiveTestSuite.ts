// src/hooks/useActiveTestSuite.ts
import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { usePyodide } from "../contexts/PyodideContext";
import { loadProgress, saveProgress } from "../lib/localStorageUtils";

const ACTIVE_TESTS_STORAGE_KEY = "codeEditorPage_activeTests_v3";

export type TestStatus = "pending" | "passed" | "failed" | "error";

export interface ActiveTest {
  id: string;
  name: string; // Display name, ideally the 'test_...' function name
  code: string; // The actual Python code for this test
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
        userGivenName || functionName || `Test snippet ${Date.now() % 10000}`;

      const newTest: ActiveTest = {
        id: uuidv4(),
        name: displayName, // This name should match the `def test_...` for result mapping
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
        const errorMessage =
          pyodideError?.message || "Pyodide not ready or no active tests.";
        setActiveTests((prev) =>
          prev.map((t) => ({ ...t, status: "error", output: errorMessage }))
        );
        setIsRunningTests(false);
        return;
      }

      setIsRunningTests(true);
      // Set all tests to 'pending' and clear previous specific outputs
      let initialTestStates = activeTests.map((test) => ({
        ...test,
        status: "pending" as TestStatus,
        output: "Queued...",
      }));
      setActiveTests(initialTestStates);

      // Attempt to run mainCode once to catch syntax errors there first.
      // Note: Definitions from this run will be available to subsequent runPythonCode calls in the same Pyodide session.
      try {
        const mainCodeResult = await runPythonCode(mainCode);
        if (mainCodeResult.error) {
          throw new Error(`Error in main code: ${mainCodeResult.error}`);
        }
      } catch (e) {
        console.error("Error executing mainCode:", e);
        const errorMessage = `Error in main code: ${
          e instanceof Error ? e.message : String(e)
        }`;
        setActiveTests((prev) =>
          prev.map((t) => ({ ...t, status: "error", output: errorMessage }))
        );
        setIsRunningTests(false);
        return;
      }

      const updatedResults: ActiveTest[] = [];

      for (const currentTest of initialTestStates) {
        // Iterate using the initial pending states
        setActiveTests((prev) =>
          prev.map((t) =>
            t.id === currentTest.id ? { ...t, output: "Running..." } : t
          )
        );

        // The name used here MUST match the function name `def test_...():` inside currentTest.code
        const testFunctionToCall =
          extractTestFunctionName(currentTest.code) || currentTest.name;

        // Script to define the current test's code AND run its specific test_ function
        // mainCode has already been executed, so its definitions should be in the global scope
        const singleTestExecutionScript = `
import traceback
import json

# ==== Current Test Snippet Start ====
# (This defines the test function in the global scope if not already defined by mainCode execution)
${currentTest.code}
# ==== Current Test Snippet End ====

# ==== Runner for a single test function ====
result_data = {"name": "${testFunctionToCall.replace(
          /"/g,
          '\\"'
        )}", "status": "ERROR", "output": "Test function '${testFunctionToCall.replace(
          /"/g,
          '\\"'
        )}' not found or not callable after executing its snippet."}

# Check if the specific test function is now defined and callable
if "${testFunctionToCall.replace(
          /"/g,
          '\\"'
        )}" in globals() and callable(globals()["${testFunctionToCall.replace(
          /"/g,
          '\\"'
        )}"]):
    try:
        globals()["${testFunctionToCall.replace(
          /"/g,
          '\\"'
        )}"]() # Call the specific test function
        result_data["status"] = "PASSED"
        result_data["output"] = ""
    except AssertionError as e_assert:
        result_data["status"] = "FAILED"
        result_data["output"] = f"AssertionError: {e_assert}"
    except Exception as e_general:
        result_data["status"] = "ERROR"
        result_data["output"] = traceback.format_exc()
else:
    # This could also mean a syntax error in currentTest.code prevented its definition
    # Check if there's an implicit error from Pyodide (less direct way)
    pass

print("===PYTEST_SINGLE_RESULT_JSON===")
print(json.dumps(result_data))
print("===END_PYTEST_SINGLE_RESULT_JSON===")
      `;

        let testStatus: TestStatus = "error";
        let testOutputString: string =
          "Execution did not complete as expected.";

        try {
          const {
            output: pyodideOutputForThisTest,
            error: pyodideErrorForThisTest,
          } = await runPythonCode(singleTestExecutionScript);

          if (pyodideErrorForThisTest) {
            // This error is from Pyodide failing to run `singleTestExecutionScript` (e.g. syntax error in test code itself)
            testStatus = "error";
            testOutputString = `Error executing test snippet: ${pyodideErrorForThisTest}`;
          } else {
            const match = pyodideOutputForThisTest.match(
              /===PYTEST_SINGLE_RESULT_JSON===\s*([\s\S]*?)\s*===END_PYTEST_SINGLE_RESULT_JSON===/
            );
            if (match && match[1]) {
              try {
                const parsedResult = JSON.parse(
                  match[1].trim()
                ) as PytestSimResult;
                // Ensure the result name matches the function we tried to call for this activeTest
                if (parsedResult.name === testFunctionToCall) {
                  testStatus = parsedResult.status.toLowerCase() as TestStatus;
                  testOutputString = parsedResult.output;
                } else {
                  testOutputString = `Result name mismatch. Expected: ${testFunctionToCall}, Got: ${parsedResult.name}. Raw: ${parsedResult.output}`;
                }
              } catch (parseError) {
                testOutputString = `Failed to parse result for test '${currentTest.name}': ${parseError}\nRaw output:\n${pyodideOutputForThisTest}`;
              }
            } else {
              testOutputString = `Result format error for test '${currentTest.name}'.\nRaw output:\n${pyodideOutputForThisTest}`;
            }
          }
        } catch (e) {
          // Catch any JS errors during the process for this test
          testStatus = "error";
          testOutputString = `Unexpected error running test '${
            currentTest.name
          }': ${e instanceof Error ? e.message : String(e)}`;
        }

        // Update the specific test in the main state array immediately after it runs
        setActiveTests((prev) =>
          prev.map((t) =>
            t.id === currentTest.id
              ? { ...t, status: testStatus, output: testOutputString }
              : t
          )
        );
        updatedResults.push({
          ...currentTest,
          status: testStatus,
          output: testOutputString,
        }); // Also collect for final state set if needed
      } // End for loop

      // setActiveTests(updatedResults); // Or rely on the individual updates within the loop
      setIsRunningTests(false);
    },
    [activeTests, runPythonCode, isPyodideLoading, pyodideError, setActiveTests]
  ); // Added setActiveTests

  return {
    activeTests,
    addTestToSuite,
    deleteTestFromSuite,
    runActiveTests,
    isRunningTests,
    isPyodideReady: !isPyodideLoading && !pyodideError,
    pyodideHookError: pyodideError,
  };
};
