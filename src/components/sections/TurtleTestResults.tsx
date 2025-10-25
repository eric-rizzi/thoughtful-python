import React from "react";
import type { TurtleTestResult } from "../../hooks/useTurtleTesting";
import type { TestCase } from "../../types/data";
import { useTurtleTestDisplay } from "../../hooks/useTurtleTestDisplay";
import TurtleTestAccordion from "./TurtleTestAccordion";
import TurtleSideBySideView from "./TurtleSideBySideView";
import TurtleFinalMessage from "./TurtleFinalMessage";

interface TurtleTestResultsProps {
  results: TurtleTestResult[] | null;
  threshold: number;
  testCases: TestCase[];
  turtleCanvasRef: React.RefObject<HTMLDivElement>;
  lessonPath?: string;
  isRunningTests: boolean;
}

/**
 * Main component for displaying turtle test results.
 * Shows a progressive accordion of completed tests and a side-by-side view during execution.
 */
const TurtleTestResults: React.FC<TurtleTestResultsProps> = ({
  results,
  threshold,
  testCases,
  turtleCanvasRef,
  lessonPath,
  isRunningTests,
}) => {
  // Use custom hook to manage display state and logic
  const {
    visualTestCases,
    testsComplete,
    allPassed,
    showSideBySide,
    displayedTestInfo,
    accordionResults,
  } = useTurtleTestDisplay({
    results,
    testCases,
    isRunningTests,
    lessonPath,
  });

  // Calculate current test number for display
  const getCurrentTestNumber = (): number => {
    if (!displayedTestInfo) return 1;
    if (displayedTestInfo.resultIndex !== null) {
      return displayedTestInfo.resultIndex + 1;
    }
    return results ? results.length + 1 : 1;
  };

  const currentTestNumber = getCurrentTestNumber();
  const showProgressLabel = visualTestCases.length > 1;

  return (
    <div>
      {/* Accordion for tests - shown above during run, shows all after completion */}
      <TurtleTestAccordion
        results={accordionResults}
        testsComplete={testsComplete}
      />

      {/* Side-by-side layout - only shown during test execution */}
      {displayedTestInfo && (
        <div style={{ display: showSideBySide ? "block" : "none" }}>
          <TurtleSideBySideView
            referenceImage={displayedTestInfo.referenceImage}
            description={displayedTestInfo.description}
            currentTestNumber={currentTestNumber}
            totalTests={visualTestCases.length}
            turtleCanvasRef={turtleCanvasRef}
            showProgressLabel={showProgressLabel}
          />
        </div>
      )}

      {/* Final message - only show after tests complete, appears below accordion */}
      {testsComplete && (
        <TurtleFinalMessage
          allPassed={allPassed}
          totalTests={visualTestCases.length}
          failedTestNumber={results?.length}
        />
      )}
    </div>
  );
};

export default TurtleTestResults;
