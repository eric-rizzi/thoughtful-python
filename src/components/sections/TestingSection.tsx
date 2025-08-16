import React, { useState } from "react";
import type { TestingSectionData, UnitId, LessonId } from "../../types/data";
import styles from "./Section.module.css";
import ContentRenderer from "../content_blocks/ContentRenderer";
import CodeEditor from "../CodeEditor";
import { useTestingLogic, TestResult } from "../../hooks/useTestingLogic";
import { useInteractiveExample } from "../../hooks/useInteractiveExample";
import LoadingSpinner from "../LoadingSpinner";
import { useProgressStore } from "../../stores/progressStore";

interface TestingSectionProps {
  section: TestingSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}

const TestResultsDisplay: React.FC<{ results: TestResult[] }> = ({
  results,
}) => {
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;
  const firstFailed = results.find((r) => !r.passed);

  return (
    <div className={styles.resultsList}>
      {allPassed ? (
        <div className={styles.testSuccess}>
          <h4>🎉 Great job! All tests passed!</h4>
          <p>
            Your solution passed {totalCount} out of {totalCount} tests.
          </p>
        </div>
      ) : (
        <div className={styles.testFailure}>
          <h4>Almost there!</h4>
          <p>
            Your solution passed {passedCount} out of {totalCount} tests.
          </p>
          {firstFailed && (
            <>
              <h5>First Failed Test:</h5>
              <p>{firstFailed.description}</p>
              <table className={styles.testResultsTable}>
                <thead>
                  <tr>
                    <th>Input</th>
                    <th>Expected</th>
                    <th>Your Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>{JSON.stringify(firstFailed.input)}</code>
                    </td>
                    <td>
                      <code>{JSON.stringify(firstFailed.expected)}</code>
                    </td>
                    <td>
                      <code>{JSON.stringify(firstFailed.actual)}</code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const TestingSection: React.FC<TestingSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  const [code, setCode] = useState(section.example.initialCode);
  const [lastAction, setLastAction] = useState<"run" | "test" | null>(null);

  // Hook for the "Run Code" functionality
  const {
    runCode,
    isLoading: isRunningCode,
    output: runOutput,
    error: runError,
  } = useInteractiveExample({
    unitId,
    lessonId,
    sectionId: section.id,
  });

  // Hook for the "Run Tests" functionality
  const {
    runTests,
    testResults,
    isLoading: isRunningTests,
    error: testError,
  } = useTestingLogic({
    unitId,
    lessonId,
    sectionId: section.id,
    functionToTest: section.functionToTest,
    testCases: section.testCases,
  });

  const isSectionComplete = useProgressStore(
    (state) => state.completion[unitId]?.[lessonId]?.[section.id] || false
  );

  const handleRunCode = () => {
    setLastAction("run");
    runCode(code);
  };

  const handleRunTests = () => {
    setLastAction("test");
    runTests(code);
  };

  const isLoading = isRunningCode || isRunningTests;

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

      <div className={styles.exampleContainer}>
        <div className={styles.editorArea}>
          <h4>Your Solution:</h4>
          <CodeEditor
            value={code}
            onChange={setCode}
            readOnly={isLoading}
            minHeight="200px"
          />
          <div className={styles.editorControls}>
            <button
              onClick={handleRunCode}
              disabled={isLoading}
              className={styles.runButton}
            >
              {isRunningCode ? "Running..." : "Run Code"}
            </button>
            <button
              onClick={handleRunTests}
              disabled={isLoading}
              className={styles.testButton}
            >
              {isRunningTests ? "Testing..." : "Run Tests"}
            </button>
          </div>
        </div>

        <div className={styles.resultsArea}>
          <h4>Output:</h4>
          {isLoading && <LoadingSpinner message="Executing..." />}

          {lastAction === "run" && (runOutput || runError) && (
            <div className={styles.outputArea}>
              <pre
                className={`${styles.outputPre} ${
                  runError ? styles.errorOutput : ""
                }`}
              >
                {runError ? runError.message : runOutput}
              </pre>
            </div>
          )}

          {lastAction === "test" && testError && (
            <div className={styles.errorFeedback}>
              <pre>{testError}</pre>
            </div>
          )}

          {lastAction === "test" && testResults && (
            <TestResultsDisplay results={testResults} />
          )}

          {isSectionComplete && lastAction !== "run" && (
            <div
              className={styles.completionMessage}
              style={{ marginTop: "1rem" }}
            >
              🎉 All tests passed! Great work.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestingSection;
