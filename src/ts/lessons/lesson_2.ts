// lesson_2.ts - Handles the interactive elements for Lesson 2
import { pythonRunner } from '../pyodide';
import '../../css/main.css';
import '../../css/lessons.css';
import '../../css/challenges.css';

declare global {
  interface Window {
    CodeMirror: any;
  }
}

interface TestCase {
  input: number;
  expected: number;
  description: string;
}

class Lesson2Controller {
  private runButtons: NodeListOf<Element> = document.querySelectorAll('.run-button');
  private testButtons: NodeListOf<Element> = document.querySelectorAll('.test-button');
  private codeEditors: Map<string, any> = new Map();
  private isInitialized: boolean = false;
  
  // Test cases for the temperature conversion function
  private testCases: TestCase[] = [
    { input: 0, expected: 32, description: "Freezing point of water (0°C)" },
    { input: 100, expected: 212, description: "Boiling point of water (100°C)" },
    { input: 37, expected: 98.6, description: "Human body temperature (37°C)" },
    { input: -40, expected: -40, description: "Equal point (-40°C)" },
    { input: 25, expected: 77, description: "Room temperature (25°C)" },
    { input: -10, expected: 14, description: "Cold winter day (-10°C)" },
    { input: 42, expected: 107.6, description: "Hot day (42°C)" }
  ];

  constructor() {
    // Initialize Pyodide in the background as soon as possible
    this.initializePyodide();
    
    // Wait for DOM to be fully loaded before setting up event handlers
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // DOM already loaded, initialize immediately
      this.initialize();
    }
  }

  private async initializePyodide(): Promise<void> {
    try {
      await pythonRunner.initialize();
      console.log('Python environment ready for Lesson 2');
    } catch (error) {
      console.error('Failed to initialize Python environment:', error);
      this.showError('Failed to load Python environment. Please refresh the page and try again.');
    }
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    // Get all buttons
    this.runButtons = document.querySelectorAll('.run-button');
    this.testButtons = document.querySelectorAll('.test-button');
    
    // Initialize code editors
    this.initializeCodeEditors();
    
    // Add click event listeners to run buttons
    this.runButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleRunButtonClick(button as HTMLElement);
      });
    });
    
    // Add click event listeners to test buttons
    this.testButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleTestButtonClick(button as HTMLElement);
      });
    });
    
    // Mark as initialized
    this.isInitialized = true;
    console.log('Lesson 2 controller initialized');
  }

  private initializeCodeEditors(): void {
    // Find all code editor elements
    const editorElements = document.querySelectorAll('.code-editor');
    
    editorElements.forEach(element => {
      const id = element.id;
      
      if (!id) {
        console.warn('Code editor element is missing an ID attribute');
        return;
      }
      
      try {
        // Check if CodeMirror is available
        if (window.CodeMirror) {
          const editor = window.CodeMirror.fromTextArea(element as HTMLTextAreaElement, {
            mode: 'python',
            theme: 'default',
            lineNumbers: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: true,
            extraKeys: {
              Tab: (cm: any) => {
                if (cm.somethingSelected()) {
                  cm.indentSelection('add');
                } else {
                  cm.replaceSelection('    ', 'end');
                }
              }
            }
          });
          
          this.codeEditors.set(id, editor);
        } else {
          console.warn('CodeMirror not available, falling back to basic textarea');
        }
      } catch (error) {
        console.error(`Failed to initialize code editor ${id}:`, error);
      }
    });
  }

  private async handleRunButtonClick(button: HTMLElement): Promise<void> {
    const exampleId = button.dataset.exampleId;
    if (!exampleId) {
      console.error('Run button is missing data-example-id attribute');
      return;
    }
    
    const editorId = `${exampleId}-editor`;
    const outputElement = document.getElementById(`${exampleId}-output`);
    
    if (!outputElement) {
      console.error(`Could not find output element for example: ${exampleId}`);
      return;
    }
    
    // Get code from the editor
    const code = this.getCodeFromEditor(editorId);
    if (!code) return;
    
    // Clear previous output
    outputElement.innerHTML = '';
    
    // Disable button and show loading state
    button.setAttribute('disabled', 'true');
    const originalText = button.textContent;
    button.textContent = 'Running...';
    
    try {
      // Run the Python code
      const result = await pythonRunner.runCode(code);
      
      // Display the output
      if (result.trim()) {
        outputElement.innerHTML = `<pre class="output-text">${this.escapeHTML(result)}</pre>`;
      } else {
        outputElement.innerHTML = '<p class="output-empty">Code executed successfully with no output.</p>';
      }
    } catch (error: any) {
      outputElement.innerHTML = `<pre class="output-error">Error: ${this.escapeHTML(error.toString())}</pre>`;
    } finally {
      // Re-enable the button
      button.removeAttribute('disabled');
      button.textContent = originalText;
    }
  }

  private async handleTestButtonClick(button: HTMLElement): Promise<void> {
    const exampleId = button.dataset.exampleId;
    if (!exampleId) {
      console.error('Test button is missing data-example-id attribute');
      return;
    }
    
    const editorId = `${exampleId}-editor`;
    const testResultElement = document.getElementById(`${exampleId}-test-result`);
    
    if (!testResultElement) {
      console.error(`Could not find test result element for example: ${exampleId}`);
      return;
    }
    
    // Get code from the editor
    const userCode = this.getCodeFromEditor(editorId);
    if (!userCode) return;
    
    // Disable button and show loading state
    button.setAttribute('disabled', 'true');
    const originalText = button.textContent || 'Test Solution';
    button.textContent = 'Testing...';
    
    try {
      // Run tests against the user's function
      const testResults = await this.runTests(userCode);
      
      // Display test results
      this.displayTestResults(testResults, testResultElement);
    } catch (error: any) {
      testResultElement.innerHTML = `
        <div class="test-error">
          <h4>Error</h4>
          <p>There was an error running your code:</p>
          <pre>${this.escapeHTML(error.toString())}</pre>
          <p>Please fix the errors in your code and try again.</p>
        </div>`;
    } finally {
      // Re-enable the button - ensure the button is always re-enabled
      button.removeAttribute('disabled');
      button.textContent = originalText;
    }
  }

  private getCodeFromEditor(editorId: string): string | null {
    let code;
    const cmEditor = this.codeEditors.get(editorId);
    
    if (cmEditor) {
      // Using CodeMirror
      code = cmEditor.getValue();
    } else {
      // Fallback to regular textarea
      const editorElement = document.getElementById(editorId) as HTMLTextAreaElement;
      if (!editorElement) {
        console.error(`Could not find editor element: ${editorId}`);
        return null;
      }
      code = editorElement.value;
    }
    
    return code;
  }

  private async runTests(userCode: string): Promise<any[]> {
    // This function will run the user's code against our test cases
    const testCode = `
${userCode}

# Test function results
import math

test_results = []

test_cases = [
    {"input": 0, "expected": 32, "description": "Freezing point of water (0°C)"},
    {"input": 100, "expected": 212, "description": "Boiling point of water (100°C)"},
    {"input": 37, "expected": 98.6, "description": "Human body temperature (37°C)"},
    {"input": -40, "expected": -40, "description": "Equal point (-40°C)"},
    {"input": 25, "expected": 77, "description": "Room temperature (25°C)"},
    {"input": -10, "expected": 14, "description": "Cold winter day (-10°C)"},
    {"input": 42, "expected": 107.6, "description": "Hot day (42°C)"}
]

for test in test_cases:
    inp = test["input"]
    expected = test["expected"]
    description = test["description"]
    
    # Run user function
    try:
        result = celsius_to_fahrenheit(inp)
        # Check if result is close enough (accounting for floating point precision)
        is_correct = math.isclose(result, expected, rel_tol=1e-3)
        
        test_results.append({
            "input": inp,
            "expected": expected,
            "actual": result,
            "passed": is_correct,
            "description": description
        })
    except Exception as e:
        test_results.append({
            "input": inp,
            "expected": expected,
            "actual": str(e),
            "passed": False,
            "description": description,
            "error": True
        })

import json
print(json.dumps(test_results))
`;

    // Run the combined test code
    const result = await pythonRunner.runCode(testCode);
    console.log(result)
    
    try {
      // Parse the JSON output
      return JSON.parse(result.trim());
    } catch (error) {
      console.error('Failed to parse test results:', error);
      throw new Error(`Failed to run tests: ${result}`);
    }
  }

  private displayTestResults(results: any[], containerElement: HTMLElement): void {
    // Count passed tests
    console.log(results)
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    const allPassed = passedCount === totalCount;
    console.log(passedCount)
    
    let html = '';
    
    if (allPassed) {
      // All tests passed
      html = `
        <div class="test-success">
          <h4>🎉 Great job!</h4>
          <p>Your function passed all ${totalCount} tests!</p>
          <p>You've successfully implemented the Celsius to Fahrenheit conversion function.</p>
        </div>`;
    } else {
      // Find the first failed test
      const firstFailedTest = results.find(r => !r.passed);
      
      if (firstFailedTest) {
        // Show only the first failed test
        html = `
          <div class="test-failure">
            <h4>Almost there!</h4>
            <p>Your function passed ${passedCount} out of ${totalCount} tests.</p>
            <h5>First Failed Test:</h5>
            <table class="test-results-table">
              <thead>
                <tr>
                  <th>Test Case</th>
                  <th>Input</th>
                  <th>Expected</th>
                  <th>Your Result</th>
                </tr>
              </thead>
              <tbody>
                <tr class="test-failed">
                  <td>${this.escapeHTML(firstFailedTest.description)}</td>
                  <td>${firstFailedTest.input}°C</td>
                  <td>${firstFailedTest.expected}°F</td>
                  <td>${firstFailedTest.error ? '<span class="error">Error</span>' : firstFailedTest.actual}°F</td>
                </tr>
              </tbody>
            </table>
            <p>Fix this issue and try again!</p>
          </div>`;
      } else {
        // This should not happen but handle it just in case
        html = `
          <div class="test-failure">
            <h4>Something went wrong</h4>
            <p>Could not find a failed test, but not all tests passed.</p>
          </div>`;
      }
    }
    
    containerElement.innerHTML = html;
  }

  private escapeHTML(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
  }
}

// Create and export the controller instance
const lesson2Controller = new Lesson2Controller();
export default lesson2Controller;