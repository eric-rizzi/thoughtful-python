import {
  generateTestCode,
  parseTestResults,
  TestCase,
  TestResult,
} from "../pyodideUtils";

describe("pyodideUtils", () => {
  describe("generateTestCode", () => {
    const userCode = "def add(a, b):\n  return a + b";
    const functionName = "add";
    const testCases: TestCase[] = [
      { input: [2, 3], expected: 5, description: "adds positive numbers" },
    ];

    it("should generate a valid Python script for a given function and test cases", () => {
      const result = generateTestCode(userCode, functionName, testCases);

      // Check that the key components are present in the generated script
      expect(result).toContain('user_code = """\ndef add(a, b):');
      expect(result).toContain("function_name = 'add'");
      expect(result).toContain(
        `test_cases = json.loads("""[{\\"input\\":[2,3],\\"expected\\":5,\\"description\\":\\"adds positive numbers\\"}]""")`
      );
      expect(result).toContain("final_results = run_tests()");
    });

    it("should correctly handle the special '__main__' function name for script execution", () => {
      const scriptCode = "print('Hello, World!')";
      const mainTestCases: TestCase[] = [
        {
          input: null,
          expected: "Hello, World!\n",
          description: "prints a greeting",
        },
      ];

      const result = generateTestCode(scriptCode, "__main__", mainTestCases);

      // Check for the specific logic path for __main__
      expect(result).toContain('if function_name == "__main__":');
      expect(result).toContain("exec(user_code, {})");
    });

    it("should throw an error for an invalid function name", () => {
      const invalidFunctionName = "invalid-name"; // Contains a hyphen
      expect(() =>
        generateTestCode(userCode, invalidFunctionName, testCases)
      ).toThrow("Invalid function name provided for testing.");
    });
  });

  describe("parseTestResults", () => {
    it("should correctly parse a valid JSON block from the raw output", () => {
      const mockResult: TestResult[] = [
        {
          input: "[2, 3]",
          expected: "5",
          actual: "5",
          passed: true,
          description: "adds positive numbers",
        },
      ];
      const rawOutput = `
        Some other logs from Pyodide...
        ===PYTHON_TEST_RESULTS_JSON===
        ${JSON.stringify(mockResult)}
        ===END_PYTHON_TEST_RESULTS_JSON===
        More logs...
      `;

      const result = parseTestResults(rawOutput);
      expect(result).toEqual(mockResult);
    });

    it("should correctly parse a test_error object from the raw output", () => {
      const mockError = { test_error: "Function 'add' not found." };
      const rawOutput = `
        ===PYTHON_TEST_RESULTS_JSON===
        ${JSON.stringify(mockError)}
        ===END_PYTHON_TEST_RESULTS_JSON===
      `;

      const result = parseTestResults(rawOutput);
      expect(result).toEqual(mockError);
    });

    it("should throw an error if the result markers are not found", () => {
      const rawOutput = "This output is missing the markers.";
      expect(() => parseTestResults(rawOutput)).toThrow(
        "Could not find test results block in Python output."
      );
    });

    it("should throw an error if the JSON between the markers is malformed", () => {
      const rawOutput = `
        ===PYTHON_TEST_RESULTS_JSON===
        { "key": "value", } 
        ===END_PYTHON_TEST_RESULTS_JSON===
      `; // Note the trailing comma, which is invalid JSON
      expect(() => parseTestResults(rawOutput)).toThrow(
        /failed to parse test results/i
      );
    });
  });
});
