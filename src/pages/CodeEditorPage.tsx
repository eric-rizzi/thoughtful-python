// src/pages/CodeEditorPage.tsx
import React, { useState, useCallback, useEffect } from "react";
import CodeEditor from "../components/CodeEditor";
import ActiveTestItem from "../components/ActiveTestItem"; // IMPORT THE NEW COMPONENT
import { useActiveTestSuite } from "../hooks/useActiveTestSuite"; // IMPORT THE NEW HOOK
import { loadProgress, saveProgress } from "../lib/localStorageUtils";
import styles from "./CodeEditorPage.module.css";

const MAIN_CODE_STORAGE_KEY = "codeEditorPage_mainCode_v2";
const TEST_DRAFT_STORAGE_KEY = "codeEditorPage_testDraftCode_v2";
// ACTIVE_TESTS_STORAGE_KEY is now managed inside useActiveTestSuite

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

  const {
    activeTests,
    addTestToSuite,
    deleteTestFromSuite,
    runActiveTests,
    isRunningTests,
    isPyodideReady, // From the hook
    pyodideHookError, // From the hook
  } = useActiveTestSuite();

  // Persist mainCode and testDraftCode
  useEffect(() => {
    saveProgress(MAIN_CODE_STORAGE_KEY, mainCode);
  }, [mainCode]);
  useEffect(() => {
    saveProgress(TEST_DRAFT_STORAGE_KEY, testDraftCode);
  }, [testDraftCode]);

  const handleAddDraftToSuite = () => {
    addTestToSuite(testDraftCode); // The hook will extract the name
    setTestDraftCode(""); // Clear draft editor
  };

  const handleExecuteTests = () => {
    runActiveTests(mainCode);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.titleBar}>
        <h2>Python Code & Test Suite Editor</h2>
        <div className={styles.mainActions}>
          <button
            onClick={handleAddDraftToSuite}
            disabled={!testDraftCode.trim() || !isPyodideReady} // Disable if Pyodide not ready
            className={styles.addTestButton}
            title="Add current test from middle pane to the Active Test Suite"
          >
            Add Test to Suite
          </button>
          <button
            onClick={handleExecuteTests}
            disabled={
              !isPyodideReady || isRunningTests || activeTests.length === 0
            }
            className={styles.runButton}
          >
            {isRunningTests ? "Running..." : "Run Active Tests"}
          </button>
        </div>
      </div>
      {pyodideHookError && (
        <p style={{ color: "red" }}>
          Pyodide Error: {pyodideHookError.message}
        </p>
      )}

      <div className={styles.contentPanes}>
        <div className={styles.pane}>
          <div className={styles.paneHeader}>Main Code (code.py)</div>
          <div className={styles.editorWrapper}>
            <CodeEditor
              value={mainCode}
              onChange={setMainCode}
              readOnly={isRunningTests || !isPyodideReady}
            />
          </div>
        </div>

        <div className={styles.pane}>
          <div className={styles.paneHeader}>
            Test Creation Area (test_draft.py)
          </div>
          <div className={styles.editorWrapper}>
            <CodeEditor
              value={testDraftCode}
              onChange={setTestDraftCode}
              readOnly={isRunningTests || !isPyodideReady}
            />
          </div>
        </div>

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
                <ActiveTestItem
                  key={test.id}
                  test={test}
                  onDelete={deleteTestFromSuite}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPage;
