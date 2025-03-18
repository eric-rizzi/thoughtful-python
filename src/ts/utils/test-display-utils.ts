/**
 * Utility functions for displaying test results in the UI
 */

import { escapeHTML } from './pyodide-utils';

/**
 * Displays test results in a container element
 * @param results - Array of test results to display
 * @param containerElement - DOM element to contain the results
 * @returns boolean indicating if all tests passed
 */
export function displayTestResults(results: any[], containerElement: HTMLElement): boolean {
  // Count passed tests
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;
  
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
                <td>${escapeHTML(firstFailedTest.description)}</td>
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
  return allPassed;
}

/**
 * Displays an error message in the test results container
 * @param error - The error object or message
 * @param containerElement - DOM element to contain the error
 */
export function displayTestError(error: any, containerElement: HTMLElement): void {
  containerElement.innerHTML = `
    <div class="test-error">
      <h4>Error</h4>
      <p>There was an error running your code:</p>
      <pre>${escapeHTML(error.toString())}</pre>
      <p>Please fix the errors in your code and try again.</p>
    </div>`;
}