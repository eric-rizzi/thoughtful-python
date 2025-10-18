import { useState, useCallback } from "react";
import { usePyodide } from "../contexts/PyodideContext";
import type {
  UnitId,
  LessonId,
  SectionId,
  TestCase,
  TestMode,
} from "../types/data";
import { useProgressActions } from "../stores/progressStore";

export interface TestResult {
  description: string;
  passed: boolean;
  actual: any;
  expected: any;
  input?: any[]; // Optional for output-based tests
}

interface UseTestingLogicProps {
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
  testMode: TestMode;
  functionToTest: string; // "__main__" for testing entire program, function name for testing specific functions
  testCases: TestCase[];
}

export const useTestingLogic = ({
  unitId,
  lessonId,
  sectionId,
  testMode,
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

      try {
        const results: TestResult[] = [];

        if (functionToTest === "__main__") {
          // Test entire program output
          for (const testCase of testCases) {
            const testScript = `
import sys
from io import StringIO
import json

# Capture stdout
old_stdout = sys.stdout
captured_output = StringIO()
sys.stdout = captured_output

try:
    # Execute user code
    exec('''${userCode.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}''')
    
    # Get the output
    output = captured_output.getvalue().strip()
    
    # Restore stdout
    sys.stdout = old_stdout
    
    expected = '''${testCase.expected
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")}'''
    
    result = {
        "success": True,
        "actual": output,
        "expected": expected,
        "passed": output == expected
    }
    
except Exception as e:
    # Restore stdout
    sys.stdout = old_stdout
    
    result = {
        "success": False,
        "error": str(e),
        "actual": "",
        "expected": '''${testCase.expected
          .replace(/\\/g, "\\\\")
          .replace(/'/g, "\\'")}'''
    }

print(json.dumps(result))
`;

            const testResult = await runPythonCode(testScript);

            let testPassed = false;

            if (!testResult.success) {
              const errorMsg = testResult.error
                ? `${testResult.error.type}: ${testResult.error.message}`
                : "Unknown error";
              results.push({
                description: testCase.description,
                passed: false,
                actual: `Execution error: ${errorMsg}`,
                expected: testCase.expected,
              });
              testPassed = false;
            } else {
              try {
                const parsedResult = JSON.parse(testResult.stdout);

                if (parsedResult.success) {
                  results.push({
                    description: testCase.description,
                    passed: parsedResult.passed,
                    actual: parsedResult.actual,
                    expected: parsedResult.expected,
                  });
                  testPassed = parsedResult.passed;
                } else {
                  results.push({
                    description: testCase.description,
                    passed: false,
                    actual: `Error: ${parsedResult.error}`,
                    expected: parsedResult.expected,
                  });
                  testPassed = false;
                }
              } catch (e) {
                results.push({
                  description: testCase.description,
                  passed: false,
                  actual: `Parse error: ${testResult.stdout}`,
                  expected: testCase.expected,
                });
                testPassed = false;
              }
            }

            // Stop on first failure
            if (!testPassed) {
              break;
            }
          }
        } else {
          // Test individual function (either capture stdout for "procedure" or return value for "function")

          // First, execute the user code to define the function
          const setupScript = `
import sys
from io import StringIO

# Execute user code
exec('''${userCode.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}''')

# Check if function exists
if '${functionToTest}' not in globals():
    raise NameError("Function '${functionToTest}' is not defined.")

"Setup complete"
`;

          const setupResult = await runPythonCode(setupScript);
          if (!setupResult.success) {
            const errorMsg = setupResult.error
              ? `${setupResult.error.type}: ${setupResult.error.message}`
              : "Unknown error";
            throw new Error(errorMsg);
          }

          // Now run each test case
          for (const testCase of testCases) {
            if (testMode === "procedure") {
              // Capture stdout from function call
              const testScript = `
import json
import sys
from io import StringIO

# Capture stdout
old_stdout = sys.stdout
captured_output = StringIO()
sys.stdout = captured_output

try:
    user_func = globals()['${functionToTest}']
    test_input = ${JSON.stringify(testCase.input)}
    expected = ${JSON.stringify(testCase.expected)}

    # Call function (ignore return value, capture print output)
    user_func(*test_input)

    # Get the output
    output = captured_output.getvalue().strip()

    # Restore stdout
    sys.stdout = old_stdout

    result = {
        "success": True,
        "actual": output,
        "expected": expected,
        "input": test_input,
        "passed": output == expected
    }

except Exception as e:
    # Restore stdout
    sys.stdout = old_stdout

    result = {
        "success": False,
        "error": str(e),
        "input": ${JSON.stringify(testCase.input)},
        "expected": ${JSON.stringify(testCase.expected)}
    }

print(json.dumps(result))
`;

              const testResult = await runPythonCode(testScript);

              let testPassed = false;

              if (!testResult.success) {
                const errorMsg = testResult.error
                  ? `${testResult.error.type}: ${testResult.error.message}`
                  : "Unknown error";
                results.push({
                  description: testCase.description,
                  passed: false,
                  actual: `Execution error: ${errorMsg}`,
                  expected: testCase.expected,
                  input: testCase.input,
                });
                testPassed = false;
              } else {
                try {
                  const parsedResult = JSON.parse(testResult.stdout);

                  if (parsedResult.success) {
                    results.push({
                      description: testCase.description,
                      passed: parsedResult.passed,
                      actual: parsedResult.actual,
                      expected: parsedResult.expected,
                      input: parsedResult.input,
                    });
                    testPassed = parsedResult.passed;
                  } else {
                    results.push({
                      description: testCase.description,
                      passed: false,
                      actual: `Error: ${parsedResult.error}`,
                      expected: parsedResult.expected,
                      input: parsedResult.input,
                    });
                    testPassed = false;
                  }
                } catch (e) {
                  results.push({
                    description: testCase.description,
                    passed: false,
                    actual: `Parse error: ${testResult.stdout}`,
                    expected: testCase.expected,
                    input: testCase.input,
                  });
                  testPassed = false;
                }
              }

              // Stop on first failure
              if (!testPassed) {
                break;
              }
            } else {
              // testMode === "function": Capture return value
              const testScript = `
import json
import sys
from io import StringIO

# Capture stdout
old_stdout = sys.stdout
sys.stdout = StringIO()

try:
    user_func = globals()['${functionToTest}']
    test_input = ${JSON.stringify(testCase.input)}
    expected = ${JSON.stringify(testCase.expected)}

    actual = user_func(*test_input)

    # Convert to string for comparison if expected is string
    if isinstance(expected, str) and not isinstance(actual, str):
        actual = str(actual)

    # Restore stdout
    sys.stdout = old_stdout

    result = {
        "success": True,
        "actual": actual,
        "expected": expected,
        "input": test_input,
        "passed": actual == expected
    }

except Exception as e:
    # Restore stdout
    sys.stdout = old_stdout

    result = {
        "success": False,
        "error": str(e),
        "input": ${JSON.stringify(testCase.input)},
        "expected": ${JSON.stringify(testCase.expected)}
    }

print(json.dumps(result))
`;

              const testResult = await runPythonCode(testScript);

              let testPassed = false;

              if (!testResult.success) {
                const errorMsg = testResult.error
                  ? `${testResult.error.type}: ${testResult.error.message}`
                  : "Unknown error";
                results.push({
                  description: testCase.description,
                  passed: false,
                  actual: `Execution error: ${errorMsg}`,
                  expected: testCase.expected,
                  input: testCase.input,
                });
                testPassed = false;
              } else {
                try {
                  const parsedResult = JSON.parse(testResult.stdout);

                  if (parsedResult.success) {
                    results.push({
                      description: testCase.description,
                      passed: parsedResult.passed,
                      actual: parsedResult.actual,
                      expected: parsedResult.expected,
                      input: parsedResult.input,
                    });
                    testPassed = parsedResult.passed;
                  } else {
                    results.push({
                      description: testCase.description,
                      passed: false,
                      actual: `Error: ${parsedResult.error}`,
                      expected: parsedResult.expected,
                      input: parsedResult.input,
                    });
                    testPassed = false;
                  }
                } catch (e) {
                  results.push({
                    description: testCase.description,
                    passed: false,
                    actual: `Parse error: ${testResult.stdout}`,
                    expected: testCase.expected,
                    input: testCase.input,
                  });
                  testPassed = false;
                }
              }

              // Stop on first failure
              if (!testPassed) {
                break;
              }
            }
          }
        }

        setTestResults(results);

        const allPassed = results.every((res) => res.passed);
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
      testMode,
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
