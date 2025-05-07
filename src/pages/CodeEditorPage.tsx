// src/pages/CodeEditorPage.tsx
import React, { useState, useCallback, useEffect } from "react";
import CodeEditor from "../components/CodeEditor";
import ActiveTestItem from "../components/ActiveTestItem";
import { useActiveTestSuite } from "../hooks/useActiveTestSuite";
import { loadProgress, saveProgress } from "../lib/localStorageUtils";
import styles from "./CodeEditorPage.module.css";

const MAIN_CODE_STORAGE_KEY = "codeEditorPage_mainCode_v2";
const TEST_DRAFT_STORAGE_KEY = "codeEditorPage_testDraftCode_v2";

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
    isPyodideReady,
    pyodideHookError,
  } = useActiveTestSuite();

  useEffect(() => {
    saveProgress(MAIN_CODE_STORAGE_KEY, mainCode);
  }, [mainCode]);
  useEffect(() => {
    saveProgress(TEST_DRAFT_STORAGE_KEY, testDraftCode);
  }, [testDraftCode]);

  const handleAddDraftToSuite = () => {
    addTestToSuite(testDraftCode);
    setTestDraftCode("");
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
            disabled={
              !testDraftCode.trim() || !isPyodideReady || isRunningTests
            }
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

      {/* Updated Layout Structure */}
      <div className={styles.contentPanes}>
        {/* Left Column: Main Code */}
        <div className={styles.leftColumn}>
          <div className={styles.pane}>
            {" "}
            {/* Pane for Main Code */}
            <div className={styles.paneHeader}>Main Code (code.py)</div>
            <div className={styles.editorWrapper}>
              <CodeEditor
                value={mainCode}
                onChange={setMainCode}
                readOnly={isRunningTests || !isPyodideReady}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Test Creation and Active Suite */}
        <div className={styles.rightColumn}>
          {/* Top Row in Right Column: Test Creation Area */}
          <div className={`${styles.pane} ${styles.testCreationPane}`}>
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

          {/* Bottom Row in Right Column: Active Test Suite */}
          <div className={`${styles.pane} ${styles.activeTestSuiteOuterPane}`}>
            <div className={styles.paneHeader}>Active Test Suite</div>
            <div className={styles.activeTestSuitePane}>
              {" "}
              {/* This div is for scrolling content */}
              {activeTests.length === 0 ? (
                <p className={styles.noActiveTests}>
                  No tests added to the suite yet. Write tests in the middle
                  pane and click "Add Test to Suite".
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
    </div>
  );
};

export default CodeEditorPage;
