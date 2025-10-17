import React from "react";
import type { TurtleTestResult } from "../../hooks/useTurtleTesting";
import styles from "./Section.module.css";

interface TurtleTestResultsProps {
  results: TurtleTestResult[];
  threshold: number;
}

const TurtleTestResults: React.FC<TurtleTestResultsProps> = ({
  results,
  threshold,
}) => {
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  return (
    <div className={styles.resultsList}>
      {allPassed ? (
        <div className={styles.testSuccess}>
          <h4>🎉 Great job! All visual tests passed!</h4>
          <p>
            Your drawing matched {totalCount} out of {totalCount} target
            image(s).
          </p>
        </div>
      ) : (
        <div className={styles.testFailure}>
          <h4>Almost there!</h4>
          <p>
            Your drawing matched {passedCount} out of {totalCount} target
            image(s).
          </p>
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        {results.map((result, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              border: result.passed ? "2px solid #4caf50" : "2px solid #f44336",
              borderRadius: "8px",
              backgroundColor: result.passed ? "#f1f8f4" : "#fef1f1",
            }}
          >
            <h5 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
              {result.passed ? "✓" : "✗"} {result.description}
            </h5>

            <p style={{ margin: "0.5rem 0" }}>
              <strong>Similarity:</strong>{" "}
              <span
                style={{
                  color: result.passed ? "#4caf50" : "#f44336",
                  fontWeight: "bold",
                }}
              >
                {(result.similarity * 100).toFixed(1)}%
              </span>
              {" ("}
              {result.passed ? "passed" : "failed"}, threshold:{" "}
              {(threshold * 100).toFixed(0)}%{")"}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              <div>
                <h6 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
                  Target Image:
                </h6>
                <img
                  src={result.referenceImage}
                  alt="Target drawing"
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    border: "2px solid #ccc",
                    borderRadius: "4px",
                    display: "block",
                  }}
                />
              </div>

              <div>
                <h6 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
                  Your Drawing:
                </h6>
                {result.studentImageDataURL ? (
                  <img
                    src={result.studentImageDataURL}
                    alt="Student drawing"
                    style={{
                      width: "100%",
                      maxWidth: "400px",
                      border: "2px solid #ccc",
                      borderRadius: "4px",
                      display: "block",
                    }}
                  />
                ) : (
                  <p style={{ color: "#999", fontStyle: "italic" }}>
                    No drawing captured
                  </p>
                )}
              </div>
            </div>

            {!result.passed && result.similarity > 0 && (
              <div style={{ marginTop: "1rem", color: "#666" }}>
                <p style={{ margin: 0, fontSize: "0.9em" }}>
                  💡 <strong>Tip:</strong> Your drawing is{" "}
                  {(result.similarity * 100).toFixed(1)}% similar to the target.
                  Check:
                </p>
                <ul style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
                  <li>Are the shapes and sizes correct?</li>
                  <li>Are you using the correct colors?</li>
                  <li>Is the turtle in the right starting/ending position?</li>
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TurtleTestResults;
