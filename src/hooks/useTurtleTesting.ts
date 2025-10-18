import { useState, useCallback } from "react";
import type { UnitId, LessonId, SectionId, TestCase } from "../types/data";
import type { RealTurtleInstance } from "../lib/turtleRenderer";
import { compareTurtleImages } from "../lib/turtleComparison";
import type { TurtleComparisonResult } from "../lib/turtleComparison";
import { useProgressActions } from "../stores/progressStore";

export interface TurtleTestResult {
  description: string;
  passed: boolean;
  similarity: number;
  referenceImage: string;
  studentImageDataURL?: string;
  comparisonResult?: TurtleComparisonResult;
}

interface UseTurtleTestingProps {
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
  testCases: TestCase[];
  visualThreshold?: number;
  turtleInstance: RealTurtleInstance | null;
  runTurtleCode: (code: string) => Promise<unknown>;
}

export const useTurtleTesting = ({
  unitId,
  lessonId,
  sectionId,
  testCases,
  visualThreshold = 0.95,
  turtleInstance,
  runTurtleCode,
}: UseTurtleTestingProps) => {
  const { completeSection } = useProgressActions();
  const [testResults, setTestResults] = useState<TurtleTestResult[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const runTests = useCallback(
    async (userCode: string) => {
      setIsRunningTests(true);
      setTestResults(null);
      setError(null);

      try {
        if (!turtleInstance) {
          throw new Error("Turtle instance not ready");
        }

        const results: TurtleTestResult[] = [];

        // Filter test cases that have reference images
        const visualTestCases = testCases.filter((tc) => tc.referenceImage);

        if (visualTestCases.length === 0) {
          throw new Error("No visual test cases found");
        }

        for (const testCase of visualTestCases) {
          if (!testCase.referenceImage) continue;

          // Update results to show we're about to run this test
          // This will trigger the UI to show the current test's reference image
          setTestResults([...results]);

          try {
            // Run the turtle code
            await runTurtleCode(userCode);

            // Get the student's canvas as data URL
            const studentImageDataURL = turtleInstance.getCanvasDataURL();

            if (!studentImageDataURL) {
              throw new Error("Could not capture student canvas");
            }

            // Compare against reference image
            const comparisonResult = await compareTurtleImages(
              studentImageDataURL,
              testCase.referenceImage,
              {
                threshold: visualThreshold,
                includeDiff: true,
              }
            );

            const testResult = {
              description: testCase.description,
              passed: comparisonResult.passed,
              similarity: comparisonResult.similarity,
              referenceImage: testCase.referenceImage,
              studentImageDataURL,
              comparisonResult,
            };

            results.push(testResult);

            // Update results after completing this test
            setTestResults([...results]);

            // Stop on first failure
            if (!testResult.passed) {
              break;
            }
          } catch (testError) {
            const errorMsg =
              testError instanceof Error
                ? testError.message
                : "Unknown error during test";
            results.push({
              description: testCase.description,
              passed: false,
              similarity: 0,
              referenceImage: testCase.referenceImage || "",
              studentImageDataURL: undefined,
              comparisonResult: undefined,
            });
            console.error(`Test failed: ${testCase.description}`, testError);
            // Update results after error
            setTestResults([...results]);
            // Stop on error as well
            break;
          }
        }

        setTestResults(results);

        // Check if all tests passed
        const allPassed = results.every((res) => res.passed);
        if (allPassed) {
          completeSection(unitId, lessonId, sectionId);
        }
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("Visual testing execution error:", errorMessage);
        setError(errorMessage);
      } finally {
        setIsRunningTests(false);
      }
    },
    [
      testCases,
      visualThreshold,
      runTurtleCode,
      turtleInstance,
      completeSection,
      unitId,
      lessonId,
      sectionId,
    ]
  );

  return {
    runTests,
    testResults,
    isLoading: isRunningTests,
    error,
  };
};
