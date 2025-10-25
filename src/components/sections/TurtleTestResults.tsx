import React, { useState } from "react";
import type { TurtleTestResult } from "../../hooks/useTurtleTesting";
import type { TestCase } from "../../types/data";
import styles from "./Section.module.css";

interface TurtleTestResultsProps {
  results: TurtleTestResult[] | null;
  threshold: number;
  testCases: TestCase[];
  turtleCanvasRef: React.RefObject<HTMLDivElement>;
  lessonPath?: string;
  isRunningTests: boolean;
}

interface TestCaseHistoryItemProps {
  result: TurtleTestResult;
  index: number;
  forceExpanded?: boolean;
}

const TestCaseHistoryItem: React.FC<TestCaseHistoryItemProps> = ({
  result,
  index,
  forceExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!result.passed);

  // Use forceExpanded if provided, otherwise use state
  const expanded = forceExpanded || isExpanded;

  return (
    <div
      className={styles.testCaseCard}
      style={{
        borderLeft: result.passed ? "4px solid #4caf50" : "4px solid #f44336",
      }}
    >
      <div
        className={styles.testCaseHeader}
        onClick={() => !forceExpanded && setIsExpanded(!isExpanded)}
        style={{ cursor: forceExpanded ? "default" : "pointer" }}
      >
        <div className={styles.testCaseHeaderLeft}>
          <span className={styles.testCaseIcon}>
            {result.passed ? "✓" : "✗"}
          </span>
          <span className={styles.testCaseTitle}>
            Test {index + 1}: {result.description}
          </span>
        </div>
        <div className={styles.testCaseHeaderRight}>
          <span
            style={{
              color: result.passed ? "#4caf50" : "#f44336",
              fontWeight: "bold",
              marginRight: "0.5rem",
            }}
          >
            {(result.similarity * 100).toFixed(1)}% match
          </span>
          {!forceExpanded && (
            <span className={styles.expandIcon}>{expanded ? "▼" : "▶"}</span>
          )}
        </div>
      </div>

      {expanded && (
        <div className={styles.testCaseBody}>
          <div className={styles.testCaseImagesGrid}>
            <div className={styles.testCaseImageColumn}>
              <h5>Target Drawing:</h5>
              <img
                src={result.referenceImage}
                alt="Target drawing"
                className={styles.testCaseImage}
              />
            </div>
            <div className={styles.testCaseImageColumn}>
              <h5>Your Drawing:</h5>
              {result.studentImageDataURL ? (
                <img
                  src={result.studentImageDataURL}
                  alt="Student drawing"
                  className={styles.testCaseImage}
                />
              ) : (
                <p style={{ color: "#999", fontStyle: "italic" }}>
                  No drawing captured
                </p>
              )}
            </div>
          </div>

          {!result.passed && result.similarity > 0 && (
            <div className={styles.testCaseTips}>
              <p style={{ margin: 0, fontSize: "0.9em" }}>
                💡 <strong>Tips:</strong> Compare the drawings above. Check:
              </p>
              <ul style={{ marginTop: "0.25rem", fontSize: "0.9em" }}>
                <li>Are the shapes and sizes correct?</li>
                <li>Are you using the correct colors?</li>
                <li>Is the turtle in the right starting/ending position?</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TurtleTestResults: React.FC<TurtleTestResultsProps> = ({
  results,
  threshold,
  testCases,
  turtleCanvasRef,
  lessonPath,
  isRunningTests,
}) => {
  // Helper function to resolve relative image paths
  const resolveImagePath = (imagePath: string): string => {
    if (imagePath.startsWith("/") || imagePath.startsWith("http")) {
      return imagePath;
    }
    if (lessonPath) {
      const unitDir = lessonPath.split("/")[0];
      return `/thoughtful-python/data/${unitDir}/${imagePath}`;
    }
    return imagePath;
  };

  // Determine which test to display in side-by-side and which index it is
  const getDisplayedTestInfo = (): {
    referenceImage: string;
    description: string;
    isResult: boolean;
    resultIndex: number | null;
  } | null => {
    const visualTestCases = testCases.filter((tc) => tc.referenceImage);

    if (!results || results.length === 0) {
      // No results yet - show first test case
      const firstTest = visualTestCases[0];
      if (firstTest && firstTest.referenceImage) {
        return {
          referenceImage: resolveImagePath(firstTest.referenceImage),
          description: firstTest.description,
          isResult: false,
          resultIndex: null,
        };
      }
      return null;
    }

    // Find first failure
    const firstFailureIndex = results.findIndex((r) => !r.passed);
    if (firstFailureIndex !== -1) {
      const firstFailure = results[firstFailureIndex];
      return {
        referenceImage: firstFailure.referenceImage,
        description: firstFailure.description,
        isResult: true,
        resultIndex: firstFailureIndex,
      };
    }

    // All passing so far - check if there are more tests to run
    if (results.length < visualTestCases.length) {
      // Show the next test that's about to run
      const nextTest = visualTestCases[results.length];
      if (nextTest && nextTest.referenceImage) {
        return {
          referenceImage: resolveImagePath(nextTest.referenceImage),
          description: nextTest.description,
          isResult: false,
          resultIndex: null, // Not in results yet
        };
      }
    }

    // All tests completed and passed - show last test
    const lastIndex = results.length - 1;
    const lastTest = results[lastIndex];
    return {
      referenceImage: lastTest.referenceImage,
      description: lastTest.description,
      isResult: true,
      resultIndex: lastIndex,
    };
  };

  const displayedTestInfo = getDisplayedTestInfo();
  const visualTestCases = testCases.filter((tc) => tc.referenceImage);

  // Only consider tests complete if we're not running and have results
  const testsComplete = !isRunningTests && results && results.length > 0;

  // Check if all tests passed (only meaningful if tests are complete)
  const allTestsRan = results && results.length === visualTestCases.length;
  const allPassed =
    testsComplete && allTestsRan && results.every((r) => r.passed);
  const hasResults = results && results.length > 0;

  // During tests: show all completed tests in accordion
  // After tests complete: show ALL tests in accordion (final test expanded)
  const showSideBySide = !testsComplete;
  const accordionResults = results || [];

  return (
    <div>
      {/* Accordion for tests - shown above during run, shows all after completion */}
      {accordionResults && accordionResults.length > 0 && (
        <div className={styles.testCasesList} style={{ marginBottom: "1rem" }}>
          {accordionResults.map((result, idx) => {
            // Last test in accordion should be expanded when tests are complete
            const isLastTest = idx === accordionResults.length - 1;
            const shouldExpand = testsComplete && isLastTest;
            return (
              <TestCaseHistoryItem
                key={idx}
                result={result}
                index={idx}
                forceExpanded={shouldExpand}
              />
            );
          })}
        </div>
      )}

      {/* Side-by-side layout - only shown during test execution */}
      <div style={{ display: showSideBySide ? "block" : "none" }}>
        {/* Test description above the side-by-side */}
        {displayedTestInfo && visualTestCases.length > 1 && (
          <p
            style={{
              fontWeight: "bold",
              marginBottom: "0.5rem",
              fontSize: "0.95em",
              color: "#306998",
            }}
          >
            Test{" "}
            {displayedTestInfo.resultIndex !== null
              ? displayedTestInfo.resultIndex + 1
              : results
                ? results.length + 1
                : 1}{" "}
            of {visualTestCases.length}: {displayedTestInfo.description}
          </p>
        )}

        {/* Headings row - side by side */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem" }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0 }}>Target Drawing:</h4>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0 }}>Your Drawing:</h4>
          </div>
        </div>

        {/* Images row - side by side */}
        <div className={styles.visualTestingContainer}>
          <div className={styles.referenceImageColumn}>
            {displayedTestInfo ? (
              <img
                src={displayedTestInfo.referenceImage}
                alt={displayedTestInfo.description}
                style={{
                  border: "2px solid #ccc",
                  borderRadius: "4px",
                  width: "100%",
                  maxWidth: "400px",
                  display: "block",
                }}
              />
            ) : (
              <p style={{ color: "#999", fontStyle: "italic" }}>
                No reference image available
              </p>
            )}
          </div>

          <div className={styles.studentCanvasColumn}>
            <div ref={turtleCanvasRef} className={styles.turtleCanvasContainer}>
              {/* p5.js will inject its canvas here */}
            </div>
          </div>
        </div>
      </div>

      {/* Final message - only show after tests complete, appears below accordion */}
      {testsComplete && (
        <div
          className={allPassed ? styles.testSuccess : styles.testFailure}
          style={{ marginTop: "1rem" }}
        >
          {allPassed ? (
            <>
              <h4>🎉 Great job!</h4>
              <p>
                Your drawing matched the target! All {visualTestCases.length}{" "}
                tests passed.
              </p>
            </>
          ) : (
            <>
              <h4>Almost there!</h4>
              <p>
                Test {results!.length} failed. Fix the issue above and try
                again!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TurtleTestResults;
