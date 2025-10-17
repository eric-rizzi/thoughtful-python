import React, { useState, useRef } from "react";
import type { TestingSectionData, UnitId, LessonId } from "../../types/data";
import type { RealTurtleInstance } from "../../lib/turtleRenderer";
import styles from "./Section.module.css";
import ContentRenderer from "../content_blocks/ContentRenderer";
import CodeEditor from "../CodeEditor";
import { useTestingLogic, TestResult } from "../../hooks/useTestingLogic";
import {
  useTurtleTesting,
  TurtleTestResult,
} from "../../hooks/useTurtleTesting";
import { useTurtleExecution } from "../../hooks/useTurtleExecution";
import { useInteractiveExample } from "../../hooks/useInteractiveExample";
import TurtleTestResults from "./TurtleTestResults";
import LoadingSpinner from "../LoadingSpinner";

interface TestingSectionProps {
  section: TestingSectionData;
  unitId: UnitId;
  lessonId: LessonId;
  lessonPath?: string;
}

// Helper function to resolve relative image paths
const resolveImagePath = (imagePath: string, lessonPath?: string): string => {
  // If path is already absolute (starts with / or http), return as-is
  if (imagePath.startsWith("/") || imagePath.startsWith("http")) {
    return imagePath;
  }

  // Extract unit directory from lesson path (e.g., "07_loops_advanced/lessons/99_test" -> "07_loops_advanced")
  if (lessonPath) {
    const unitDir = lessonPath.split("/")[0];
    return `/thoughtful-python/data/${unitDir}/${imagePath}`;
  }

  // Fallback: return relative path as-is (will likely fail, but better than crashing)
  return imagePath;
};

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
                    {firstFailed.input && <th>Input</th>}
                    <th>Expected</th>
                    <th>Your Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {firstFailed.input && (
                      <td>
                        <code>{JSON.stringify(firstFailed.input)}</code>
                      </td>
                    )}
                    <td>
                      <code>
                        {Array.isArray(firstFailed.expected)
                          ? firstFailed.expected.join("\n")
                          : typeof firstFailed.expected === "string"
                            ? firstFailed.expected
                            : JSON.stringify(firstFailed.expected)}
                      </code>
                    </td>
                    <td>
                      <code>
                        {Array.isArray(firstFailed.actual)
                          ? firstFailed.actual.join("\n")
                          : typeof firstFailed.actual === "string"
                            ? firstFailed.actual
                            : JSON.stringify(firstFailed.actual)}
                      </code>
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
  lessonPath,
}) => {
  const [code, setCode] = useState(section.example.initialCode);
  const [lastAction, setLastAction] = useState<"run" | "test" | null>(null);
  const turtleCanvasRef = useRef<HTMLDivElement>(null);
  const [turtleInstance, setTurtleInstance] =
    useState<RealTurtleInstance | null>(null);

  // Detect if this is a visual turtle test
  const isVisualTurtleTest =
    section.example.visualization === "turtle" &&
    section.testCases.some((tc) => tc.referenceImage);

  // Hook for turtle execution (for "Run Code" button on visual turtle tests)
  const {
    runTurtleCode,
    stopExecution,
    isLoading: isRunningTurtle,
    error: turtleRunError,
  } = useTurtleExecution({
    canvasRef: turtleCanvasRef,
    unitId,
    lessonId,
    sectionId: section.id,
    autoCompleteOnRun: false,
    onTurtleInstanceReady: setTurtleInstance,
  });

  // Hook for console-based "Run Code" functionality
  const {
    runCode,
    isLoading: isRunningCode,
    output: runOutput,
    error: runError,
  } = useInteractiveExample({
    unitId,
    lessonId,
    sectionId: section.id,
    autoComplete: false, // Don't auto-complete on run for testing sections
  });

  // Resolve relative image paths in test cases
  const resolvedTestCases = section.testCases.map((tc) => ({
    ...tc,
    referenceImage: tc.referenceImage
      ? resolveImagePath(tc.referenceImage, lessonPath)
      : undefined,
  }));

  // Hook for visual turtle tests
  const turtleTestingHook = useTurtleTesting({
    unitId,
    lessonId,
    sectionId: section.id,
    testCases: resolvedTestCases,
    visualThreshold: section.visualThreshold,
    turtleInstance,
    runTurtleCode,
  });

  // Hook for regular (console-based) tests
  const regularTestingHook = useTestingLogic({
    unitId,
    lessonId,
    sectionId: section.id,
    testMode: section.testMode,
    functionToTest: section.functionToTest,
    testCases: section.testCases,
  });

  // Use the appropriate testing hook based on test type
  const {
    runTests,
    testResults,
    isLoading: isRunningTests,
    error: testError,
  } = isVisualTurtleTest ? turtleTestingHook : regularTestingHook;

  // Check if tests have passed (only for testing sections)
  const testsHavePassed =
    testResults && testResults.every((result) => result.passed);

  const handleRunCode = () => {
    setLastAction("run");
    if (isVisualTurtleTest) {
      runTurtleCode(code);
    } else {
      runCode(code);
    }
  };

  const handleRunTests = () => {
    setLastAction("test");
    runTests(code);
  };

  const isLoading = isRunningCode || isRunningTests || isRunningTurtle;

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

      {isVisualTurtleTest && (
        <div className={styles.referenceImageContainer}>
          <h4>Target Drawing:</h4>
          <p style={{ marginBottom: "0.5rem", color: "#666" }}>
            Make your turtle drawing look like this:
          </p>
          {section.testCases
            .filter((tc) => tc.referenceImage)
            .map((tc, idx) => (
              <div key={idx} style={{ marginBottom: "1rem" }}>
                {section.testCases.length > 1 && (
                  <p style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                    {tc.description}
                  </p>
                )}
                <img
                  src={resolveImagePath(tc.referenceImage!, lessonPath)}
                  alt={tc.description}
                  style={{
                    border: "2px solid #ccc",
                    borderRadius: "4px",
                    maxWidth: "400px",
                    display: "block",
                  }}
                />
              </div>
            ))}
        </div>
      )}

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
              {isVisualTurtleTest && isRunningTurtle
                ? "Executing..."
                : isRunningCode
                  ? "Running..."
                  : "Run Code"}
            </button>
            <button
              onClick={handleRunTests}
              disabled={isLoading}
              className={styles.testButton}
            >
              {isRunningTests ? "Testing..." : "Run Tests"}
            </button>
            {isVisualTurtleTest && (
              <button
                onClick={stopExecution}
                disabled={!isLoading}
                className={styles.runButton}
              >
                Stop
              </button>
            )}
          </div>
        </div>

        <div className={styles.resultsArea}>
          <h4>Output:</h4>
          {isLoading && !isVisualTurtleTest && (
            <LoadingSpinner message="Executing..." />
          )}

          {isVisualTurtleTest && (
            <div>
              <h4>Turtle Canvas:</h4>
              <div
                ref={turtleCanvasRef}
                className={styles.turtleCanvasContainer}
              >
                {/* p5.js will inject its canvas here */}
              </div>
            </div>
          )}

          {lastAction === "run" &&
            (runOutput || runError) &&
            !isVisualTurtleTest && (
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

          {lastAction === "run" && turtleRunError && isVisualTurtleTest && (
            <div className={styles.errorFeedback}>
              <pre>{turtleRunError}</pre>
            </div>
          )}

          {lastAction === "test" && testError && (
            <div className={styles.errorFeedback}>
              <pre>{testError}</pre>
            </div>
          )}

          {lastAction === "test" && testResults && !isVisualTurtleTest && (
            <TestResultsDisplay results={testResults as TestResult[]} />
          )}

          {lastAction === "test" && testResults && isVisualTurtleTest && (
            <TurtleTestResults
              results={testResults as TurtleTestResult[]}
              threshold={section.visualThreshold || 0.95}
            />
          )}

          {testsHavePassed && (
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
