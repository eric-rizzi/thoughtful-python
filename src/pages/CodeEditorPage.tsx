// src/pages/CodeEditorPage.tsx
import React, { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs for tests
import CodeEditor from "../components/CodeEditor";
import { usePyodide } from "../contexts/PyodideContext";
import { loadProgress, saveProgress } from "../lib/localStorageUtils";
import styles from "./CodeEditorPage.module.css";

const MAIN_CODE_STORAGE_KEY = "codeEditorPage_mainCode_v2";
const TEST_DRAFT_STORAGE_KEY = "codeEditorPage_testDraftCode_v2";
const ACTIVE_TESTS_STORAGE_KEY = "codeEditorPage_activeTests_v2";

type TestStatus = "pending" | "passed" | "failed" | "error";

interface ActiveTest {
  id: string;
  name: string; // e.g., name of the test function or a description
  code: string;
  status: TestStatus;
  output?: string; // Detailed output or error message
}

interface PytestSimResult {
  name: string; // Name of the test function executed
  status: "PASSED" | "FAILED" | "ERROR";
  output: string;
}

const CodeEditorPage: React.FC = () => {
  const [mainCode, setMainCode] = useState<string>(
    () =>
      loadProgress<string>(MAIN_CODE_STORAGE_KEY) ||
      '# Write your main Python code here\n\ndef greet(name):\n  return f"Hello, {name}!"\n'
  );
  const [testDraftCode, setTestDraftCode] = useState<string>(
    () =>
      loadProgress<string>(TEST_DRAFT_STORAGE_KEY) ||
      '# Write a test function (e.g., test_my_feature)\n\ndef test_greet_default():\n  assert greet("World") == "Hello, World!"\n'
  );
  const [activeTests, setActiveTests] = useState<ActiveTest[]>(
    () => loadProgress<ActiveTest[]>(ACTIVE_TESTS_STORAGE_KEY) || []
  );
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();

  // Persist states
  useEffect(() => {
    saveProgress(MAIN_CODE_STORAGE_KEY, mainCode);
  }, [mainCode]);
  useEffect(() => {
    saveProgress(TEST_DRAFT_STORAGE_KEY, testDraftCode);
  }, [testDraftCode]);
  useEffect(() => {
    saveProgress(ACTIVE_TESTS_STORAGE_KEY, activeTests);
  }, [activeTests]);

  const extractTestName = (code: string): string => {
    const match = code.match(/def\s+(test_[a-zA-Z0-9_]+)\s*\(/);
    return match && match[1] ? match[1] : `Test ${activeTests.length + 1}`;
  };

  const handleAddTestToSuite = useCallback(() => {
    if (!testDraftCode.trim()) return;
    const newTest: ActiveTest = {
      id: uuidv4(),
      name:
        extractTestName(testDraftCode) ||
        `Custom Test ${activeTests.length + 1}`,
      code: testDraftCode,
      status: "pending",
    };
    setActiveTests((prevTests) => [...prevTests, newTest]);
    setTestDraftCode(""); // Clear draft editor after adding
  }, [testDraftCode, activeTests.length]);

  const handleDeleteTest = useCallback((testId: string) => {
    setActiveTests((prevTests) =>
      prevTests.filter((test) => test.id !== testId)
    );
  }, []);

  const handleRunActiveTests = useCallback(async () => {
    if (isPyodideLoading || !runPythonCode || activeTests.length === 0) {
      // Update all tests to show an error or skip message if needed
      setActiveTests((prev) =>
        prev.map((t) => ({
          ...t,
          status: "error",
          output: "Pyodide not ready or no active tests.",
        }))
      );
      return;
    }
    setIsRunningTests(true);
    // Reset statuses to pending before run
    setActiveTests((prev) =>
      prev.map((test) => ({ ...test, status: "pending", output: "Running..." }))
    );

    const allTestCode = activeTests
      .map((test) => test.code)
      .join("\n\n# -- Next Test --\n");

    const testRunnerScript = `
import json
import traceback

# ==== User's Main Code Start ====
${mainCode}
# ==== User's Main Code End ====

# ==== User's Active Test Code Start ====
${allTestCode}
# ==== User's Active Test Code End ====

# ==== Simple Pytest-like Test Runner ====
results = []
tests_to_run = []
for test_obj_name_in_globals in list(globals().keys()):
    if test_obj_name_in_globals.startswith("test_"):
        item = globals()[test_obj_name_in_globals]
        if callable(item):
            tests_to_run.append({"name": test_obj_name_in_globals, "func": item})

if not tests_to_run:
    print("===PYTEST_RESULTS_JSON===")
    print(json.dumps([{"name": "No test functions found", "status": "ERROR", "output": "No functions starting with 'test_' were found in the active suite."}]))
    print("===END_PYTEST_RESULTS_JSON===")
else:
    for test_info in tests_to_run:
        test_name = test_info["name"]
        test_func = test_info["func"]
        test_doc = test_func.__doc__.strip() if test_func.__doc__ else test_name
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
              // Try to match by extracted name, or if only one test, assume it's for that one.
              // A more robust solution would involve passing IDs or exact original code for matching.
              // For now, we map results by the `test_...` function name.
              const result = parsedResults.find(
                (r) =>
                  activeTest.name === r.name ||
                  activeTest.code.includes(`def ${r.name}(`)
              );
              if (result) {
                return {
                  ...activeTest,
                  status: result.status.toLowerCase() as TestStatus,
                  output: result.output,
                };
              }
              // If no specific result found, but tests ran, mark as error or keep pending
              if (
                parsedResults.length > 0 &&
                parsedResults[0].name === "No test functions found"
              ) {
                return {
                  ...activeTest,
                  status: "error",
                  output: parsedResults[0].output,
                };
              }
              return {
                ...activeTest,
                status: "error",
                output: "Test result not found in runner output.",
              };
            })
          );
        } catch (parseError) {
          setActiveTests((prev) =>
            prev.map((t) => ({
              ...t,
              status: "error",
              output: `Failed to parse test results: ${parseError}\nOutput: ${rawPyodideOutput}`,
            }))
          );
        }
      } else {
        setActiveTests((prev) =>
          prev.map((t) => ({
            ...t,
            status: "error",
            output: `Test runner output format error.\nOutput: ${rawPyodideOutput}`,
          }))
        );
      }
    }
    setIsRunningTests(false);
  }, [mainCode, activeTests, runPythonCode, isPyodideLoading]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.titleBar}>
        <h2>Python Code & Test Suite Editor</h2>
        <div className={styles.mainActions}>
          <button
            onClick={handleAddTestToSuite}
            disabled={!testDraftCode.trim()}
            className={styles.addTestButton}
            title="Add current test from middle pane to the Active Test Suite"
          >
            Add Test to Suite
          </button>
          <button
            onClick={handleRunActiveTests}
            disabled={
              isPyodideLoading ||
              isRunningTests ||
              !!pyodideError ||
              activeTests.length === 0
            }
            className={styles.runButton}
          >
            {isRunningTests ? "Running..." : "Run Active Tests"}
          </button>
        </div>
      </div>
      {pyodideError && (
        <p style={{ color: "red" }}>Pyodide Error: {pyodideError.message}</p>
      )}

      <div className={styles.contentPanes}>
        {/* Pane 1: Main Code Editor */}
        <div className={styles.pane}>
          <div className={styles.paneHeader}>Main Code (code.py)</div>
          <div className={styles.editorWrapper}>
            <CodeEditor value={mainCode} onChange={setMainCode} />
          </div>
        </div>

        {/* Pane 2: Test Draft/Creation Area */}
        <div className={styles.pane}>
          <div className={styles.paneHeader}>
            Test Creation Area (test_draft.py)
          </div>
          <div className={styles.editorWrapper}>
            <CodeEditor value={testDraftCode} onChange={setTestDraftCode} />
          </div>
        </div>

        {/* Pane 3: Active Test Suite */}
        <div className={styles.pane}>
          <div className={styles.paneHeader}>Active Test Suite</div>
          <div className={styles.activeTestSuitePane}>
            {activeTests.length === 0 ? (
              <p className={styles.noActiveTests}>
                No tests added to the suite yet. Write tests in the middle pane
                and click "Add Test to Suite".
              </p>
            ) : (
              activeTests.map((test) => (
                <div
                  key={test.id}
                  className={`${styles.activeTestItem} ${
                    styles[
                      "status" +
                        test.status.charAt(0).toUpperCase() +
                        test.status.slice(1)
                    ]
                  }`}
                >
                  <div className={styles.activeTestItemHeader}>
                    <strong>{test.name}</strong>
                    <button
                      onClick={() => handleDeleteTest(test.id)}
                      className={styles.deleteTestButton}
                      title="Remove test from suite"
                    >
                      &times;
                    </button>
                  </div>
                  <pre>
                    <code>{test.code}</code>
                  </pre>
                  {test.output &&
                    test.status !== "passed" && ( // Show output for failed/error/running
                      <div className={styles.testOutputDetails}>
                        {test.output}
                      </div>
                    )}
                  {test.status === "pending" &&
                    test.output && ( // Show 'Running...' if that's the output
                      <div className={styles.testOutputDetails}>
                        {test.output}
                      </div>
                    )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPage;
