// src/pages/CodeEditorPage.tsx
import React, { useState, useCallback, useEffect } from "react";
import CodeEditor from "../components/CodeEditor";
import { usePyodide } from "../contexts/PyodideContext";
import { loadProgress, saveProgress } from "../lib/localStorageUtils";
import styles from "./CodeEditorPage.module.css";

const MAIN_CODE_STORAGE_KEY = "codeEditorPage_mainCode";
const TEST_CODE_STORAGE_KEY = "codeEditorPage_testCode";

interface PytestResult {
  name: string;
  status: "PASSED" | "FAILED" | "ERROR";
  output: string;
}

const CodeEditorPage: React.FC = () => {
  const [mainCode, setMainCode] = useState<string>(
    () =>
      loadProgress<string>(MAIN_CODE_STORAGE_KEY) ||
      "# Write your main Python code here\n\ndef add(a, b):\n  return a + b\n"
  );
  const [testCode, setTestCode] = useState<string>(
    () =>
      loadProgress<string>(TEST_CODE_STORAGE_KEY) ||
      `# Write your pytest-style tests here\n# Functions should start with test_ (e.g., test_example)\n\nimport pytest # Pytest is not actually run, but use its conventions\n\n# Example: Accessing functions from the main code pane\n# from main_code import add # This won't work directly in Pyodide this way\n# Instead, main code is executed first, defining 'add' in global scope\n\ndef test_add_positive_numbers():\n  assert add(2, 3) == 5\n\ndef test_add_negative_numbers():\n  assert add(-1, -5) == -6\n\ndef test_add_mixed_numbers():\n  assert add(5, -3) == 2\n\n# Example of a failing test\n# def test_failing():\n#   assert add(1,1) == 3\n`
  );
  const [testResults, setTestResults] = useState<
    PytestResult[] | string | null
  >(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();

  useEffect(() => {
    saveProgress(MAIN_CODE_STORAGE_KEY, mainCode);
  }, [mainCode]);

  useEffect(() => {
    saveProgress(TEST_CODE_STORAGE_KEY, testCode);
  }, [testCode]);

  const handleRunTests = useCallback(async () => {
    if (isPyodideLoading || !runPythonCode) {
      setTestResults("Pyodide is not ready.");
      return;
    }
    setIsRunningTests(true);
    setTestResults("Running tests...");

    const testRunnerScript = `
import json
import traceback

# ==== User's Main Code Start ====
${mainCode}
# ==== User's Main Code End ====

# ==== User's Test Code Start ====
${testCode}
# ==== User's Test Code End ====

# ==== Simple Pytest-like Test Runner ====
results = []
tests_found = 0
for name, item in list(globals().items()): # list() to copy for safe iteration if globals change
    if name.startswith("test_") and callable(item):
        tests_found += 1
        test_doc = item.__doc__.strip() if item.__doc__ else name
        try:
            item()
            results.append({"name": test_doc, "status": "PASSED", "output": ""})
        except AssertionError as e:
            results.append({"name": test_doc, "status": "FAILED", "output": f"AssertionError: {e}"})
        except Exception as e:
            tb_str = traceback.format_exc()
            results.append({"name": test_doc, "status": "ERROR", "output": tb_str})

if tests_found == 0:
    print("===PYTEST_RESULTS_JSON===")
    print(json.dumps([{"name": "No tests found", "status": "SKIPPED", "output": "No functions starting with 'test_' were found."}]))
    print("===END_PYTEST_RESULTS_JSON===")
else:
    print("===PYTEST_RESULTS_JSON===")
    print(json.dumps(results))
    print("===END_PYTEST_RESULTS_JSON===")
    `;

    const { output, error } = await runPythonCode(testRunnerScript);

    if (error) {
      setTestResults(`Error during test execution environment:\n${error}`);
    } else {
      const match = output.match(
        /===PYTEST_RESULTS_JSON===\s*([\s\S]*?)\s*===END_PYTEST_RESULTS_JSON===/
      );
      if (match && match[1]) {
        try {
          const parsedResults = JSON.parse(match[1].trim());
          setTestResults(parsedResults as PytestResult[]);
        } catch (parseError) {
          setTestResults(
            `Failed to parse test results JSON: ${parseError}\nRaw output:\n${output}`
          );
        }
      } else {
        setTestResults(
          `Could not find test results in output.\nRaw output:\n${output}`
        );
      }
    }
    setIsRunningTests(false);
  }, [mainCode, testCode, runPythonCode, isPyodideLoading]);

  const renderTestResults = () => {
    if (testResults === null) return null;
    if (typeof testResults === "string") {
      return <pre>{testResults}</pre>;
    }
    if (
      testResults.length === 0 ||
      (testResults.length === 1 && testResults[0].status === "SKIPPED")
    ) {
      return (
        <p className={styles.noTestsMessage}>
          {testResults[0]?.output || "No tests to display."}
        </p>
      );
    }

    return (
      <div>
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`${styles.testResultItem} ${
              styles[result.status.toLowerCase()]
            }`}
          >
            <strong>{result.status}:</strong> {result.name}
            {result.output && result.status !== "PASSED" && (
              <pre>{result.output}</pre>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.titleBar}>
        <h2>Python Code & Unit Test Editor</h2>
        <button
          onClick={handleRunTests}
          disabled={isPyodideLoading || isRunningTests || !!pyodideError}
          className={styles.runButton}
        >
          {isRunningTests ? "Running..." : "Run Tests"}
        </button>
      </div>
      {pyodideError && (
        <p style={{ color: "red" }}>Pyodide Error: {pyodideError.message}</p>
      )}

      <div className={styles.panesContainer}>
        <div className={styles.pane}>
          <div className={styles.paneHeader}>Main Code (code.py)</div>
          <div className={styles.editorWrapper}>
            <CodeEditor value={mainCode} onChange={setMainCode} />
          </div>
        </div>
        <div className={styles.pane}>
          <div className={styles.paneHeader}>Unit Tests (test_code.py)</div>
          <div className={styles.editorWrapper}>
            <CodeEditor value={testCode} onChange={setTestCode} />
          </div>
        </div>
      </div>
      <div
        className={styles.pane}
        style={{ marginTop: "1rem", flexGrow: 0.5, minHeight: "150px" }}
      >
        {" "}
        {/* Adjust flexGrow/minHeight for results pane */}
        <div className={styles.paneHeader}>Test Results</div>
        <div className={styles.resultsPane}>
          {isRunningTests && testResults === "Running tests..." ? (
            <p>Running tests...</p>
          ) : (
            renderTestResults()
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPage;
