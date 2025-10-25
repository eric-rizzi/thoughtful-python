// src/pages/CodeEditorPage.tsx
import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
import CodeEditor from "../../components/CodeEditor";
import ActiveTestItem from "../../components/ActiveTestItem";
import { useActiveTestSuite } from "../../hooks/useActiveTestSuite";
import {
  loadProgress,
  saveProgress,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../../lib/localStorageUtils";
import { useAuthStore } from "../../stores/authStore"; // Import useAuthStore
import styles from "./CodeEditorPage.module.css";

const MAIN_CODE_STORAGE_KEY = "codeEditorPage_mainCode_v2";
const TEST_DRAFT_STORAGE_KEY = "codeEditorPage_testDraftCode_v2";

const CodeEditorPage: React.FC = () => {
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const currentStorageUserId = useMemo(() => {
    return isAuthenticated && authUser
      ? authUser.userId
      : ANONYMOUS_USER_ID_PLACEHOLDER;
  }, [isAuthenticated, authUser]);

  const [mainCode, setMainCode] = useState<string>(
    () =>
      loadProgress<string>(currentStorageUserId, MAIN_CODE_STORAGE_KEY) ||
      '# Write your main Python code here\n\ndef greet(name):\n  return f"Hello, {name}!"\n'
  );
  const [testDraftCode, setTestDraftCode] = useState<string>(
    () =>
      loadProgress<string>(currentStorageUserId, TEST_DRAFT_STORAGE_KEY) ||
      '# Write a test function (e.g., test_my_feature)\n\ndef test_greet_default():\n  assert greet("World") == "Hello, World!"\n'
  );

  // Pass currentStorageUserId to useActiveTestSuite
  const {
    activeTests,
    addTestToSuite,
    deleteTestFromSuite,
    runActiveTests,
    isRunningTests,
    isPyodideReady,
    pyodideHookError,
  } = useActiveTestSuite(currentStorageUserId);

  // Persist mainCode auth-aware
  useEffect(() => {
    saveProgress(currentStorageUserId, MAIN_CODE_STORAGE_KEY, mainCode);
  }, [mainCode, currentStorageUserId]);

  // Persist testDraftCode auth-aware
  useEffect(() => {
    saveProgress(currentStorageUserId, TEST_DRAFT_STORAGE_KEY, testDraftCode);
  }, [testDraftCode, currentStorageUserId]);

  // Reload local code states if user changes
  useEffect(() => {
    setMainCode(
      loadProgress<string>(currentStorageUserId, MAIN_CODE_STORAGE_KEY) ||
        '# Write your main Python code here\n\ndef greet(name):\n  return f"Hello, {name}!"\n'
    );
    setTestDraftCode(
      loadProgress<string>(currentStorageUserId, TEST_DRAFT_STORAGE_KEY) ||
        '# Write a test function (e.g., test_my_feature)\n\ndef test_greet_default():\n  assert greet("World") == "Hello, World!"\n'
    );
  }, [currentStorageUserId]);

  const handleAddDraftToSuite = () => {
    addTestToSuite(testDraftCode);
    setTestDraftCode(""); // Clear draft after adding
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
            className={styles.runButton} // Ensured this uses the correct class from module
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
        <div className={styles.leftColumn}>
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
        </div>

        <div className={styles.rightColumn}>
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

          <div className={`${styles.pane} ${styles.activeTestSuiteOuterPane}`}>
            <div className={styles.paneHeader}>Active Test Suite</div>
            <div className={styles.activeTestSuitePane}>
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
