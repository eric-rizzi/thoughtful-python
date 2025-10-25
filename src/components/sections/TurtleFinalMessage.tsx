import React from "react";
import styles from "./Section.module.css";

interface TurtleFinalMessageProps {
  allPassed: boolean;
  totalTests: number;
  failedTestNumber?: number;
}

/**
 * Displays the final success or failure message after all tests complete
 */
const TurtleFinalMessage: React.FC<TurtleFinalMessageProps> = ({
  allPassed,
  totalTests,
  failedTestNumber,
}) => {
  return (
    <div
      className={allPassed ? styles.testSuccess : styles.testFailure}
      style={{ marginTop: "1rem" }}
    >
      {allPassed ? (
        <>
          <h4>🎉 Great job!</h4>
          <p>Your drawing matched the target! All {totalTests} tests passed.</p>
        </>
      ) : (
        <>
          <h4>Almost there!</h4>
          <p>
            Test {failedTestNumber} failed. Fix the issue above and try again!
          </p>
        </>
      )}
    </div>
  );
};

export default TurtleFinalMessage;
