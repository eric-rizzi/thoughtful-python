/**
 * Utility functions for working with Python code execution and testing in the browser
 */

import { pythonRunner } from '../pyodide';

/**
 * Runs Python code and returns the output
 * @param code - The Python code to execute
 * @returns Promise with the execution result or error message
 */
export async function runPythonCode(code: string): Promise<string> {
  try {
    return await pythonRunner.runCode(code);
  } catch (error: any) {
    return `Error: ${error.toString()}`;
  }
}

/**
 * Formats and escapes HTML output text
 * @param str - The string to escape
 * @returns Safe HTML string with entities escaped
 */
export function escapeHTML(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates test code for a Python function
 * @param userCode - The user's Python code containing the function to test
 * @param functionName - The name of the function to test
 * @param testCases - Array of test cases to run
 * @returns Python code string that will test the function
 */
export function generateTestCode(
  userCode: string, 
  functionName: string, 
  testCases: Array<{ input: any, expected: any, description: string }>
): string {
  return `
# First, execute the user's code in its own context
${userCode}

# Now perform our tests with a clean stdout
import math
import sys
import json
import io

# Save the user-defined function to test
user_function = ${functionName}

# Create a clean testing environment
def run_tests():
    # Redirect stdout to capture only our test results
    original_stdout = sys.stdout
    test_output = io.StringIO()
    sys.stdout = test_output
    
    try:
        test_results = []

        test_cases = ${JSON.stringify(testCases)}

        for test in test_cases:
            inp = test["input"]
            exp = test["expected"]
            description = test["description"]
            
            # Run user function
            try:
                result = user_function(inp)
                # Check if result is close enough (accounting for floating point precision)
                is_correct = math.isclose(result, exp, rel_tol=1e-2)
                
                test_results.append({
                    "input": inp,
                    "expected": exp,
                    "actual": result,
                    "passed": is_correct,
                    "description": description
                })
            except Exception as e:
                test_results.append({
                    "input": inp,
                    "expected": exp,
                    "actual": str(e),
                    "passed": False,
                    "description": description,
                    "error": True
                })
        
        return test_results
    except Exception as e:
        return {"test_error": str(e)}
    finally:
        # Restore original stdout
        sys.stdout = original_stdout

# Run the tests and collect results
test_results = run_tests()

# Output test results in a clear, separate format
print("===PYTHON_TEST_RESULTS_JSON===")
print(json.dumps(test_results))
print("===END_PYTHON_TEST_RESULTS_JSON===")
`;
}

/**
 * Parses test results from Python output
 * @param result - The output string from Python test execution
 * @returns Parsed test results as an array or throws an error
 */
export function parseTestResults(result: string): any[] {
  // Extract the test results using regex
  const resultsMatch = result.match(/===PYTHON_TEST_RESULTS_JSON===\s*([\s\S]*?)\s*===END_PYTHON_TEST_RESULTS_JSON===/);
  
  if (resultsMatch && resultsMatch[1]) {
    const jsonStr = resultsMatch[1].trim();
    const parsedResults = JSON.parse(jsonStr);
    
    // Check if we got a test error
    if (parsedResults.test_error) {
      throw new Error(`Test framework error: ${parsedResults.test_error}`);
    }
    
    return parsedResults;
  }
  
  console.error('No test results found in output:', result);
  throw new Error('Could not find test results in output');
}