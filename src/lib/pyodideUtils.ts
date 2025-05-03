// src/lib/pyodideUtils.ts

/**
 * Formats and escapes HTML output text
 * @param str - The string to escape
 * @returns Safe HTML string with entities escaped
 */
export function escapeHTML(str: string | undefined | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Test Generation & Parsing Logic (from original pyodide-utils.ts) ---

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
  // Ensure functionName is a valid identifier to prevent injection
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(functionName)) {
      throw new Error("Invalid function name provided for testing.");
  }

  // Safely serialize test cases for Python
  const testCasesJson = JSON.stringify(testCases).replace(/"/g, '\\"');

  // Use triple quotes for the user code to handle internal quotes/newlines
  const safeUserCode = userCode.replace(/"""/g, '\\"\\"\\"'); // Basic escaping

  return `
# --- Test Setup ---
import sys
import json
import io
import math
import traceback

# Using a dictionary to store the user's globals after execution
user_globals = {}

# Execute user's code within a controlled environment
user_code = """
${safeUserCode}
"""
try:
    exec(user_code, user_globals)
except Exception as e:
    # If user code fails to even execute, report that as a general error
    print("===PYTHON_TEST_RESULTS_JSON===")
    print(json.dumps({"test_error": f"Error executing user code: {traceback.format_exc()}"}))
    print("===END_PYTHON_TEST_RESULTS_JSON===")
    # Exit early if user code has syntax errors etc.
    sys.exit(0)


# --- Test Runner ---

# Save the user-defined function if available
user_function = user_globals.get('${functionName}')

# Function to compare results, handling floats
def compare_results(actual, expected):
    tolerance = 1e-5 # Tolerance for float comparisons
    if isinstance(actual, float) or isinstance(expected, float):
        try:
            return math.isclose(float(actual), float(expected), rel_tol=tolerance, abs_tol=tolerance)
        except (ValueError, TypeError):
            return False # Cannot compare if conversion fails
    else:
        # Basic equality check for other types (can be expanded)
        return actual == expected

def run_tests():
    results = []
    # Use raw string and parse JSON safely inside Python
    test_cases_json = r"""${testCasesJson}"""
    test_cases = json.loads(test_cases_json)

    if user_function is None:
         return {"test_error": f"Function '{functionName}' not found in user code."}
    if not callable(user_function):
         return {"test_error": f"'{functionName}' is not a function."}

    for test in test_cases:
        inp = test["input"]
        exp = test["expected"]
        description = test.get("description", f"Test with input: {inp}") # Use description or default
        passed = False
        actual_result = None
        is_error = False

        try:
            # Handle single input vs multiple args if needed (basic case: assume single input)
            # More complex cases might require inspecting function signature
            actual_result = user_function(inp)
            passed = compare_results(actual_result, exp)
        except Exception as e:
            actual_result = traceback.format_exc() # Get full traceback
            is_error = True
            passed = False

        results.append({
            "input": inp,
            "expected": exp,
            "actual": repr(actual_result), # Use repr for clearer output of types
            "passed": passed,
            "description": description,
            "error": is_error
        })
    return results

# --- Execute Tests ---
final_results = run_tests()

# --- Output Results ---
print("===PYTHON_TEST_RESULTS_JSON===")
print(json.dumps(final_results))
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