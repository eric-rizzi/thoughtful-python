import { useState, useCallback } from "react";
import { usePyodide } from "../contexts/PyodideContext";
import type { UnitId, LessonId, SectionId, TestCase } from "../types/data";
import { useProgressActions } from "../stores/progressStore";

export interface TestResult {
  description: string;
  passed: boolean;
  actual: any;
  expected: any;
  input: any[]; // Added this property
}

interface UseTestingLogicProps {
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
  functionToTest: string;
  testCases: TestCase[];
}

export const useTestingLogic = ({
  unitId,
  lessonId,
  sectionId,
  functionToTest,
  testCases,
}: UseTestingLogicProps) => {
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const { completeSection } = useProgressActions();

  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTests = useCallback(
    async (userCode: string) => {
      setIsRunningTests(true);
      setTestResults(null);
      setError(null);

      const testCasesJson = JSON.stringify(testCases);

      const pythonTestRunnerScript = `
import json
import traceback

results = []
test_cases = json.loads('''${testCasesJson}''')

try:
    # --- User's Code is Executed Here ---
    ${userCode}
    # ------------------------------------

    if '${functionToTest}' not in globals():
        raise NameError("Function '${functionToTest}' is not defined.")

    user_func = globals()['${functionToTest}']

    for test in test_cases:
        try:
            actual_output = user_func(*test['input'])
            passed = actual_output == test['expected']
            results.append({
                "description": test['description'],
                "passed": passed,
                "actual": actual_output,
                "expected": test['expected'],
                "input": test['input']
            })
        except Exception as e:
            results.append({
                "description": test['description'],
                "passed": False,
                "actual": f"Error during test: {e}",
                "expected": test['expected'],
                "input": test['input']
            })

except Exception as e:
    results = {
        "error": True,
        "message": traceback.format_exc()
    }

json.dumps(results)
`;

      try {
        const result = await runPythonCode(pythonTestRunnerScript);

        if (result.error) {
          throw new Error(result.error);
        }

        const parsedResult = JSON.parse(result.output);

        if (parsedResult.error) {
          throw new Error(parsedResult.message);
        }

        setTestResults(parsedResult);

        const allPassed = parsedResult.every((res: TestResult) => res.passed);
        if (allPassed) {
          completeSection(unitId, lessonId, sectionId);
        }
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : "An unknown error occurred.";
        console.error("Testing execution error:", errorMessage);
        setError(errorMessage);
      } finally {
        setIsRunningTests(false);
      }
    },
    [
      functionToTest,
      testCases,
      runPythonCode,
      completeSection,
      unitId,
      lessonId,
      sectionId,
    ]
  );

  return {
    runTests,
    testResults,
    isLoading: isRunningTests || isPyodideLoading,
    error: error || pyodideError?.message,
  };
};
