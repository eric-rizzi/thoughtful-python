// src/lib/pyodideUtils.ts

export interface TestCase {
    input: any;
    expected: any;
    description: string;
}

export interface TestResult {
    input: any;
    expected: any;
    actual: any;
    passed: boolean;
    description: string;
    error?: boolean; // Flag if execution caused an error
}

/**
 * Generates Python test code for a function.
 * Assumes userCode defines the function to be tested.
 * @param userCode - The user's Python code string.
 * @param functionName - The name of the function within userCode to test.
 * @param testCases - An array of test cases.
 * @returns Python code string designed to run tests and output JSON results.
 */
export function generateTestCode(
  userCode: string,
  functionName: string,
  testCases: TestCase[]
): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(functionName)) {
      throw new Error("Invalid function name provided for testing.");
  }

  // 1. Generate standard JSON string directly from the test cases
  const testCasesJson = JSON.stringify(testCases);
  //    (No need for the .replace(/"/g, '\\"') anymore!)

  // Basic escaping for the user code within triple quotes
  // Handles existing triple quotes and backslashes simply. May need refinement for complex code.
  const escapeTripleQuotes = (str: string) =>
      str.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');

  const safeUserCode = escapeTripleQuotes(userCode);
  // Escape backslashes in the JSON string itself for Python literal
  const safeTestCasesJson = testCasesJson.replace(/\\/g, '\\\\').replace(/"/g, '\\"');


  // 2. Embed using standard triple quotes (""") in Python, not raw (r""")
  //    And embed the escaped JSON string directly.
  return `
# --- Test Setup ---
import sys
import json
import io
import math
import traceback

user_globals = {}
user_code = """
${safeUserCode}
"""

# --- Execute User Code ---
try:
    exec(user_code, user_globals)
except Exception as e:
    print("===PYTHON_TEST_RESULTS_JSON===")
    print(json.dumps({"test_error": f"Error executing user code: {traceback.format_exc()}"}))
    print("===END_PYTHON_TEST_RESULTS_JSON===")
    sys.exit(0)

# --- Test Runner ---
user_function = user_globals.get('${functionName}')

def compare_results(actual, expected):
    # ... (comparison logic as before) ...
    tolerance = 1e-5
    if isinstance(actual, float) or isinstance(expected, float):
        try:
            # Handle potential None values before converting to float
            if actual is None or expected is None:
                return actual == expected
            return math.isclose(float(actual), float(expected), rel_tol=tolerance, abs_tol=tolerance)
        except (ValueError, TypeError):
            return False
    else:
        return actual == expected

def run_tests():
    results = []
    # Use standard triple quotes and the escaped JSON string
    test_cases_json_string_literal = """${safeTestCasesJson}"""
    try:
        test_cases = json.loads(test_cases_json_string_literal)
    except json.JSONDecodeError as json_err:
        # Error if Python fails to parse the JSON string we provided
        return {"test_error": f"Internal Error: Failed to parse test case JSON in Python. Error: {json_err}. String was: {test_cases_json_string_literal}"}

    if user_function is None:
         return {"test_error": f"Function '{functionName}' not found in user code."}
    if not callable(user_function):
         return {"test_error": f"'{functionName}' is not a function."}

    for test in test_cases:
        inp = test["input"]
        exp = test["expected"]
        description = test.get("description", f"Test with input: {repr(inp)}") # Use repr for input desc
        passed = False
        actual_result_repr = None # Store repr for JSON output
        is_error = False
        error_trace = None

        try:
            actual_result = user_function(inp)
            passed = compare_results(actual_result, exp)
            actual_result_repr = repr(actual_result) # Get repr after successful execution
        except Exception as e:
            error_trace = traceback.format_exc()
            actual_result_repr = error_trace # Put traceback in actual result on error
            is_error = True
            passed = False

        results.append({
            "input": repr(inp), # Use repr for input in results
            "expected": repr(exp), # Use repr for expected in results
            "actual": actual_result_repr,
            "passed": passed,
            "description": description,
            "error": is_error
            # Optionally include error_trace separately if needed
        })
    return results

# --- Execute Tests ---
final_results = run_tests()

# --- Output Results ---
print("===PYTHON_TEST_RESULTS_JSON===")
# Use ensure_ascii=False for better handling of unicode, though maybe not needed here
print(json.dumps(final_results, ensure_ascii=False))
print("===END_PYTHON_TEST_RESULTS_JSON===")
`;
}


/**
 * Parses the JSON test result block from Python output.
 * @param rawOutput - The complete stdout string from the Python execution.
 * @returns Parsed test results as an array or throws an error if parsing fails or results missing.
 */
export function parseTestResults(rawOutput: string): TestResult[] | { test_error: string } {
  const match = rawOutput.match(/===PYTHON_TEST_RESULTS_JSON===\s*([\s\S]*?)\s*===END_PYTHON_TEST_RESULTS_JSON===/);

  if (match && match[1]) {
    try {
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
      // Check if it's the error object or the array of results
      if (typeof parsed === 'object' && parsed !== null && parsed.test_error) {
        return parsed as { test_error: string };
      }
      if (Array.isArray(parsed)) {
        // TODO: Optionally add validation that items match TestResult structure
        return parsed as TestResult[];
      }
      throw new Error("Parsed test result is not an array or a recognized error object.");
    } catch (e) {
      console.error("Failed to parse test results JSON:", e);
      console.error("Raw JSON string was:", match[1].trim());
      throw new Error(`Failed to parse test results from Python output. ${e instanceof Error ? e.message : ''}`);
    }
  }

  console.error('Test result markers not found in output:', rawOutput);
  throw new Error("Could not find test results block in Python output.");
}