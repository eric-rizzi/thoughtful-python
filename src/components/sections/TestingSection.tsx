// src/components/sections/TestingSection.tsx
import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  LessonId,
  LessonSection,
  SectionId,
  TestingExample,
} from "../../types/data";
import styles from "./Section.module.css";
import { usePyodide } from "../../contexts/PyodideContext";
import {
  generateTestCode,
  parseTestResults,
  TestResult,
} from "../../lib/pyodideUtils";
import { useProgressActions } from "../../stores/progressStore";
import { useInteractiveExample } from "../../hooks/useInteractiveExample";
import InteractiveExampleDisplay from "./InteractiveExampleDisplay";

interface TestingSectionProps {
  section: LessonSection;
  lessonId: LessonId;
}

const TestableExample: React.FC<{
  example: TestingExample;
  lessonId: LessonId;
  sectionId: SectionId;
}> = React.memo(({ example, lessonId, sectionId }) => {
  const { completeSection } = useProgressActions();
  const {
    runPythonCode: pyodideDirectRunner,
    isLoading: isPyodideDirectLoading,
    error: pyodideDirectError,
  } = usePyodide();

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
  const [testRunHasBeenAttempted, setTestRunHasBeenAttempted] =
    useState<boolean>(false);

  const functionNameToTest = example.functionToTest;

  const handleTestSolution = useCallback(async () => {
    if (isPyodideDirectLoading || pyodideDirectError) {
      setTestResults({
        test_error: "Python environment not ready for testing.",
      });
      setTestRunHasBeenAttempted(true);
      return;
    }
    if (!example.testCases || example.testCases.length === 0) {
      setTestResults({ test_error: "No test cases defined for this example." });
      setTestRunHasBeenAttempted(true);
      return;
    }

    setIsTesting(true);
    setTestResults(null);
    setTestRunHasBeenAttempted(true);

    try {
      const testScript = generateTestCode(
        exampleHook.code,
        functionNameToTest,
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
          console.error(
            "Failed to parse test results:",
            parseError,
            "\nRaw output:",
            result.output
          );
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
        completeSection(lessonId, sectionId);
      }
    } catch (err) {
      console.error(`Error during test execution for ${example.id}:`, err);
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
    functionNameToTest,
    pyodideDirectRunner,
    isPyodideDirectLoading,
    pyodideDirectError,
    completeSection,
    lessonId,
    sectionId,
    example.id,
  ]);

  const renderTestResultsDisplay = () => {
    if (!testRunHasBeenAttempted || !testResults) return null;

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
      isRunning={exampleHook.isRunning || isTesting}
      hasBeenRun={exampleHook.hasBeenRun || testRunHasBeenAttempted}
      preventPasteInEditor={true} // Prevent paste in TestingSection CodeEditor
      renderExtraControls={() =>
        example.testCases &&
        example.testCases.length > 0 && (
          <button
            onClick={handleTestSolution}
            disabled={
              exampleHook.isPyodideLoading ||
              pyodideDirectError ||
              exampleHook.isRunning ||
              isTesting
            }
            className={styles.testButton}
          >
            {isTesting ? "Testing..." : "Test Solution"}
          </button>
        )
      }
      renderExtraOutput={renderTestResultsDisplay}
    />
  );
});

const TestingSection: React.FC<TestingSectionProps> = ({
  section,
  lessonId,
}) => {
  const currentSingleExample = section.example;

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>
      {currentSingleExample ? (
        <TestableExample
          key={currentSingleExample.id}
          example={currentSingleExample}
          lessonId={lessonId}
          sectionId={section.id}
        />
      ) : (
        <p>No example for this observation section.</p>
      )}
    </section>
  );
};

export default TestingSection;
