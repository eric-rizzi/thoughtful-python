import React, { useState } from "react";
import type { TurtleTestResult } from "../../hooks/useTurtleTesting";
import styles from "./Section.module.css";
import { COLORS, DIMENSIONS, STYLES } from "./turtleTestConstants";

interface TestCaseItemProps {
  result: TurtleTestResult;
  index: number;
  forceExpanded?: boolean;
}

/**
 * Individual test case card in the accordion
 */
const TestCaseItem: React.FC<TestCaseItemProps> = ({
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
        borderLeft: `${DIMENSIONS.borderWidth} solid ${result.passed ? COLORS.pass : COLORS.fail}`,
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
          <span style={STYLES.similarityText(result.passed)}>
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
                <p style={STYLES.noImageText}>No drawing captured</p>
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

interface TurtleTestAccordionProps {
  results: TurtleTestResult[];
  testsComplete: boolean;
}

/**
 * Accordion list of all test results
 */
const TurtleTestAccordion: React.FC<TurtleTestAccordionProps> = ({
  results,
  testsComplete,
}) => {
  if (results.length === 0) return null;

  return (
    <div className={styles.testCasesList} style={{ marginBottom: "1rem" }}>
      {results.map((result, idx) => {
        // Last test in accordion should be expanded when tests are complete
        const isLastTest = idx === results.length - 1;
        const shouldExpand = testsComplete && isLastTest;
        return (
          <TestCaseItem
            key={idx}
            result={result}
            index={idx}
            forceExpanded={shouldExpand}
          />
        );
      })}
    </div>
  );
};

export default TurtleTestAccordion;
