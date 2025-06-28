import React, { useState, useCallback } from "react";
import type {
  LessonId,
  TestingSectionData,
  TestingExample,
  UnitId,
  SectionId,
} from "../../types/data";
import type { TestResult } from "../../lib/pyodideUtils";
import styles from "./Section.module.css";
import { usePyodide } from "../../contexts/PyodideContext";
import { generateTestCode, parseTestResults } from "../../lib/pyodideUtils";
import { useProgressActions } from "../../stores/progressStore";
import { useInteractiveExample } from "../../hooks/useInteractiveExample";
import InteractiveExampleDisplay from "./InteractiveExampleDisplay";
import ContentRenderer from "../content_blocks/ContentRenderer";

interface TestingSectionProps {
  section: TestingSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}

const TestableExample: React.FC<{
  example: TestingExample;
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
}> = React.memo(({ example, unitId, lessonId, sectionId }) => {
  const { completeSection } = useProgressActions();
  const {
    runPythonCode: pyodideDirectRunner,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();

  // This hook manages the code editor and the output of the "Run Code" button
  const exampleHook = useInteractiveExample({
    exampleId: example.id,
    initialCode: example.code,
    lessonId,
    sectionId,
    persistCode: true, // Testing sections often benefit from persisting attempts
    storageKeyPrefix: "testCodeAttempt",
  });

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<
    TestResult[] | { test_error: string } | null
  >(null);

  // This new state tracks the user's most recent action to decide what to display
  const [lastAction, setLastAction] = useState<"run" | "test" | null>(null);

  // This handler wraps the "Run Code" action to set the last action state
  const handleRunCode = useCallback(async () => {
    setLastAction("run");
    return exampleHook.onRunCode();
  }, [exampleHook.onRunCode]);

  // This handler runs the tests and sets the last action state
  const handleTestSolution = useCallback(async () => {
    setLastAction("test");

    if (isPyodideLoading || pyodideError) {
      setTestResults({ test_error: "Python environment not ready." });
      return;
    }
    if (!example.testCases || example.testCases.length === 0) {
      setTestResults({ test_error: "No test cases defined for this example." });
      return;
    }

    setIsTesting(true);
    setTestResults(null);

    try {
      const testScript = generateTestCode(
        exampleHook.code,
        example.functionToTest,
        example.testCases
      );
      const result = await pyodideDirectRunner(testScript);
      let parsed: TestResult[] | { test_error: string };
      let allPassed = false;

      if (result.error) {
        parsed = {
          test_error: `Error executing test script:\n${result.error}`,
        };
      } else {
        try {
          parsed = parseTestResults(result.output);
          if (Array.isArray(parsed)) {
            allPassed = parsed.every((r) => r.passed);
          }
        } catch (parseError) {
          parsed = {
            test_error: `Failed to parse results: ${
              parseError instanceof Error
                ? parseError.message
                : String(parseError)
            }`,
          };
        }
      }
      setTestResults(parsed);

      if (allPassed) {
        completeSection(unitId, lessonId, sectionId);
      }
    } catch (err) {
      setTestResults({
        test_error: `Testing failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
    } finally {
      setIsTesting(false);
    }
  }, [
    exampleHook.code,
    example.testCases,
    example.functionToTest,
    pyodideDirectRunner,
    isPyodideLoading,
    pyodideError,
    completeSection,
    lessonId,
    sectionId,
    unitId,
  ]);

  // This helper function renders the test results table
  const renderTestResultsDisplay = () => {
    // Only render this if the last action was 'test'
    if (lastAction !== "test" || !testResults) return null;

    if ("test_error" in testResults) {
      return (
        <div className={styles.testResultArea}>
          <div className={styles.testError}>
            <h4>Test Execution Error</h4>
            <pre>{testResults.test_error}</pre>
          </div>
        </div>
      );
    }

    if (Array.isArray(testResults)) {
      const passedCount = testResults.filter((r) => r.passed).length;
      const totalCount = testResults.length;
      const allPassed = passedCount === totalCount;

      return (
        <div className={styles.testResultArea}>
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
              {(() => {
                const firstFailed = testResults.find((r) => !r.passed);
                if (!firstFailed) return null;
                return (
                  <>
                    <h5>First Failed Test:</h5>
                    <table className={styles.testResultsTable}>
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Input</th>
                          <th>Expected</th>
                          <th>Your Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={styles.testFailedRow}>
                          <td>{firstFailed.description}</td>
                          <td>
                            <code>{firstFailed.input}</code>
                          </td>
                          <td>
                            <code>{firstFailed.expected}</code>
                          </td>
                          <td>
                            <code>{firstFailed.actual}</code>
                            {firstFailed.error ? " (error!)" : ""}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <InteractiveExampleDisplay
      example={example}
      {...exampleHook}
      onRunCode={handleRunCode}
      isRunning={exampleHook.isRunning || isTesting}
      hasBeenRun={exampleHook.hasBeenRun}
      preventPasteInEditor={true}
      showOutputBox={lastAction === "run"}
      renderExtraControls={() => (
        <button
          onClick={handleTestSolution}
          disabled={
            exampleHook.isRunning ||
            isTesting ||
            isPyodideLoading ||
            !!pyodideError
          }
          className={styles.testButton}
        >
          {isTesting ? "Testing..." : "Test Solution"}
        </button>
      )}
      renderExtraOutput={renderTestResultsDisplay}
    />
  );
});

const TestingSection: React.FC<TestingSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>
      {section.example && (
        <TestableExample
          key={section.example.id}
          example={section.example}
          unitId={unitId}
          lessonId={lessonId}
          sectionId={section.id}
        />
      )}
    </section>
  );
};

export default TestingSection;
