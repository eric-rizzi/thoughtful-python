import React from "react";
import { STYLES } from "./turtleTestConstants";

interface TestProgressLabelProps {
  currentTestNumber: number;
  totalTests: number;
  description: string;
}

/**
 * Displays the current test progress label (e.g., "Test 2 of 5: Draw a square")
 */
const TestProgressLabel: React.FC<TestProgressLabelProps> = ({
  currentTestNumber,
  totalTests,
  description,
}) => {
  return (
    <p style={STYLES.testLabel}>
      Test {currentTestNumber} of {totalTests}: {description}
    </p>
  );
};

export default TestProgressLabel;
