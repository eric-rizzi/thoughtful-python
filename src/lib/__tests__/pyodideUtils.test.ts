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

    it("should validate that parsed array contains TestResult objects", () => {
      const validResult: TestResult[] = [
        {
          input: "[2, 3]",
          expected: "5",
          actual: "5",
          passed: true,
          description: "test description",
          error: false,
        },
      ];
      const rawOutput = `
        ===PYTHON_TEST_RESULTS_JSON===
        ${JSON.stringify(validResult)}
        ===END_PYTHON_TEST_RESULTS_JSON===
      `;

      const result = parseTestResults(rawOutput);
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result[0]).toHaveProperty("input");
        expect(result[0]).toHaveProperty("expected");
        expect(result[0]).toHaveProperty("actual");
        expect(result[0]).toHaveProperty("passed");
        expect(result[0]).toHaveProperty("description");
      }
    });

    it("should throw an error if parsed result is neither array nor error object", () => {
      const rawOutput = `
        ===PYTHON_TEST_RESULTS_JSON===
        "just a string"
        ===END_PYTHON_TEST_RESULTS_JSON===
      `;

      expect(() => parseTestResults(rawOutput)).toThrow(
        "Parsed test result is not an array or a recognized error object."
      );
    });

    it("should throw an error if parsed result is null", () => {
      const rawOutput = `
        ===PYTHON_TEST_RESULTS_JSON===
        null
        ===END_PYTHON_TEST_RESULTS_JSON===
      `;

      expect(() => parseTestResults(rawOutput)).toThrow(
        "Parsed test result is not an array or a recognized error object."
      );
    });

    it("should handle empty array of test results", () => {
      const rawOutput = `
        ===PYTHON_TEST_RESULTS_JSON===
        []
        ===END_PYTHON_TEST_RESULTS_JSON===
      `;

      const result = parseTestResults(rawOutput);
      expect(result).toEqual([]);
    });

    it("should handle test results with optional error field", () => {
      const resultWithError: TestResult = {
        input: "[2, 3]",
        expected: "5",
        actual: "TypeError: unsupported operand",
        passed: false,
        description: "test with error",
        error: true,
      };
      const rawOutput = `
        ===PYTHON_TEST_RESULTS_JSON===
        ${JSON.stringify([resultWithError])}
        ===END_PYTHON_TEST_RESULTS_JSON===
      `;

      const result = parseTestResults(rawOutput);
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result[0].error).toBe(true);
        expect(result[0].passed).toBe(false);
      }
    });

    it("should handle markers with extra whitespace", () => {
      const mockResult: TestResult[] = [
        {
          input: "[]",
          expected: "0",
          actual: "0",
          passed: true,
          description: "test",
        },
      ];
      const rawOutput = `


        ===PYTHON_TEST_RESULTS_JSON===


        ${JSON.stringify(mockResult)}


        ===END_PYTHON_TEST_RESULTS_JSON===


      `;

      const result = parseTestResults(rawOutput);
      expect(result).toEqual(mockResult);
    });
  });

  describe("generateTestCode - edge cases", () => {
    it("should handle empty test cases array", () => {
      const result = generateTestCode("def foo():\n  pass", "foo", []);
      expect(result).toContain("function_name = 'foo'");
      expect(result).toContain("test_cases = json.loads(");
      expect(result).toContain("[]"); // Empty array in JSON
    });

    it("should handle function names with underscores", () => {
      const result = generateTestCode(
        "def my_func_name():\n  pass",
        "my_func_name",
        []
      );
      expect(result).toContain("function_name = 'my_func_name'");
    });

    it("should handle function names starting with underscore", () => {
      const result = generateTestCode(
        "def _private():\n  pass",
        "_private",
        []
      );
      expect(result).toContain("function_name = '_private'");
    });

    it("should reject function names starting with numbers", () => {
      expect(() =>
        generateTestCode("def 1invalid():\n  pass", "1invalid", [])
      ).toThrow("Invalid function name provided for testing.");
    });

    it("should reject function names with spaces", () => {
      expect(() =>
        generateTestCode("def bad name():\n  pass", "bad name", [])
      ).toThrow("Invalid function name provided for testing.");
    });

    it("should handle test cases with special characters in strings", () => {
      const testCases: TestCase[] = [
        {
          input: ["hello\nworld"],
          expected: 'result with "quotes"',
          description: "test with newlines and quotes",
        },
      ];
      const result = generateTestCode(
        "def func(s):\n  pass",
        "func",
        testCases
      );
      expect(result).toContain("test_cases = json.loads(");
      // Should not throw during generation
      expect(result).toBeTruthy();
    });

    it("should handle user code with triple quotes", () => {
      const userCode = 'def func():\n  return """triple quoted string"""';
      const result = generateTestCode(userCode, "func", []);
      // Should escape triple quotes in user code
      expect(result).toContain('\\"\\"\\"');
    });

    it("should handle user code with backslashes", () => {
      const userCode = "def func():\n  return '\\n\\t'";
      const result = generateTestCode(userCode, "func", []);
      // Should escape backslashes
      expect(result).toContain("\\\\");
    });
  });
});
