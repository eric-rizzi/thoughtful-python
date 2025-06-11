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

  // Basic escaping for the user code within triple quotes
  // Handles existing triple quotes and backslashes simply. May need refinement for complex code.
  const escapeTripleQuotes = (str: string) =>
    str.replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"');

  const safeUserCode = escapeTripleQuotes(userCode);
  // Escape backslashes in the JSON string itself for Python literal
  const safeTestCasesJson = testCasesJson
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  // 2. Embed using standard triple quotes (""") in Python, not raw (r""")
  //    And embed the escaped JSON string directly.
  return `
# --- Test Setup ---
import sys
import json
import io
import math
import traceback

user_code = """
${safeUserCode}
"""

def compare_results(actual, expected) -> bool:
    # This function is unchanged
    tolerance = 1e-5
    if isinstance(actual, str) and isinstance(expected, str):
        # Normalize newlines for comparison
        return actual.strip().replace('\\r\\n', '\\n') == expected.strip().replace('\\r\\n', '\\n')
    if isinstance(actual, (float, int)) and isinstance(expected, (float, int)):
        try:
            return math.isclose(float(actual), float(expected), rel_tol=tolerance, abs_tol=tolerance)
        except (ValueError, TypeError):
            return False
    return actual == expected

def run_tests():
    results = []
    test_cases = json.loads("""${safeTestCasesJson}""")
    function_name = '${functionName}'

    # --- Case 1: Testing a script's print() output ---
    if function_name == "__main__":
        if not test_cases or not isinstance(test_cases, list) or len(test_cases) == 0:
            return {"test_error": "No test cases provided for __main__ execution."}
        
        test = test_cases[0] # For __main__, we only run one test case
        expected_output = test["expected"]
        actual_output = ""
        is_error = False
        
        # This is the core logic for capturing stdout
        original_stdout = sys.stdout
        sys.stdout = captured_output = io.StringIO()
        
        try:
            exec(user_code, {})
        except Exception:
            is_error = True
            actual_output = traceback.format_exc()
        finally:
            # Crucially, always restore stdout
            sys.stdout = original_stdout
        
        if not is_error:
            actual_output = captured_output.getvalue()

        passed = compare_results(actual_output, expected_output)
        
        results.append({
            "input": repr(test["input"]),
            "expected": repr(expected_output),
            "actual": repr(actual_output),
            "passed": passed,
            "description": test["description"],
            "error": is_error,
        })
        return results

    # --- Case 2: Testing a specific function (original logic) ---
    user_globals = {}
    try:
        exec(user_code, user_globals)
    except Exception as e:
        return {"test_error": f"Error compiling user code: {traceback.format_exc()}"}
        
    user_function = user_globals.get(function_name)
    if not user_function:
        return {"test_error": f"Function '{function_name}' not found in user code."}
    if not callable(user_function):
        return {"test_error": f"'{function_name}' is not a function."}

    for test in test_cases:
      # ... (the existing loop for testing functions is unchanged)
      # Note: I've corrected some minor bugs in your original function test loop
      inp = test["input"]
      expected = test["expected"]
      description = test.get("description", f"Test with input: {repr(inp)}")
      
      try:
          actual_result = user_function(inp)
          passed = compare_results(actual_result, expected)
          actual_repr = repr(actual_result)
          is_error = False
      except Exception as e:
          passed = False
          actual_repr = traceback.format_exc()
          is_error = True

      results.append({
          "input": repr(inp),
          "expected": repr(expected),
          "actual": actual_repr,
          "passed": passed,
          "description": description,
          "error": is_error
      })

    return results

# --- Execute and Print Results ---
final_results = run_tests()
print("===PYTHON_TEST_RESULTS_JSON===")
print(json.dumps(final_results, ensure_ascii=False))
print("===END_PYTHON_TEST_RESULTS_JSON===")
`;
}

/**
 * Parses the JSON test result block from Python output.
 * @param rawOutput - The complete stdout string from the Python execution.
 * @returns Parsed test results as an array or throws an error if parsing fails or results missing.
 */
export function parseTestResults(
  rawOutput: string
): TestResult[] | { test_error: string } {
  const match = rawOutput.match(
    /===PYTHON_TEST_RESULTS_JSON===\s*([\s\S]*?)\s*===END_PYTHON_TEST_RESULTS_JSON===/
  );

  if (match && match[1]) {
    try {
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
      // Check if it's the error object or the array of results
      if (typeof parsed === "object" && parsed !== null && parsed.test_error) {
        return parsed as { test_error: string };
      }
      if (Array.isArray(parsed)) {
        // TODO: Optionally add validation that items match TestResult structure
        return parsed as TestResult[];
      }
      throw new Error(
        "Parsed test result is not an array or a recognized error object."
      );
    } catch (e) {
      console.error("Failed to parse test results JSON:", e);
      console.error("Raw JSON string was:", match[1].trim());
      throw new Error(
        `Failed to parse test results from Python output. ${
          e instanceof Error ? e.message : ""
        }`
      );
    }
  }

  console.error("Test result markers not found in output:", rawOutput);
  throw new Error("Could not find test results block in Python output.");
}
