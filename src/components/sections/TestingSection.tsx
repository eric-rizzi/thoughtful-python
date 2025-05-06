// src/components/sections/TestingSection.tsx
import React, { useState, useCallback } from 'react';
import type { LessonSection, LessonExample } from '../../types/data';
import styles from './Section.module.css';
import { usePyodide } from '../../contexts/PyodideContext'; // To run the test script
import { generateTestCode, parseTestResults, TestResult } from '../../lib/pyodideUtils';
import { useProgressActions } from '../../stores/progressStore';
import { useInteractiveExample } from '../../hooks/useInteractiveExample';
import InteractiveExampleDisplay from './InteractiveExampleDisplay';

interface TestingSectionProps {
  section: LessonSection; // Should ideally be a more specific TestingSectionData type
  lessonId: string;
  // onSectionComplete is handled internally by TestableExample using useProgressActions
}

// Helper component for each testable example
const TestableExample: React.FC<{
  example: LessonExample;
  lessonId: string;
  sectionId: string;
}> = React.memo(({ example, lessonId, sectionId }) => {
  const { completeSection } = useProgressActions();
  const { runPythonCode: pyodideDirectRunner, isLoading: isPyodideDirectLoading, error: pyodideDirectError } = usePyodide(); // For running the test script

  const exampleHook = useInteractiveExample({
    exampleId: example.id,
    initialCode: example.code,
    lessonId, // For potential future code persistence keying, though not used now
    sectionId,
    persistCode: false, // Typically, test solutions aren't persisted, but this could be a prop
    storageKeyPrefix: 'testCodeAttempt', // If you ever enable persistCode
  });

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[] | { test_error: string } | null>(null);
  const [testRunHasBeenAttempted, setTestRunHasBeenAttempted] = useState<boolean>(false);

  const functionNameToTest = example.functionToTest || 'celsius_to_fahrenheit'; // Get from JSON or use a default

  const handleTestSolution = useCallback(async () => {
    if (isPyodideDirectLoading || pyodideDirectError) {
      setTestResults({ test_error: 'Python environment not ready for testing.' });
      setTestRunHasBeenAttempted(true);
      return;
    }
    if (!example.testCases || example.testCases.length === 0) {
      setTestResults({ test_error: 'No test cases defined for this example.' });
      setTestRunHasBeenAttempted(true);
      return;
    }

    setIsTesting(true);
    setTestResults(null);
    setTestRunHasBeenAttempted(true);
    // exampleHook.setOutput('Testing solution...'); // Optionally update main output

    try {
      const testScript = generateTestCode(exampleHook.code, functionNameToTest, example.testCases);
      const result = await pyodideDirectRunner(testScript); // Use direct runner for test script

      let parsed: TestResult[] | { test_error: string };
      let allPassed = false;

      if (result.error) {
        parsed = { test_error: `Error executing test script:\n${result.error}` };
      } else {
        try {
          parsed = parseTestResults(result.output);
          if (Array.isArray(parsed)) {
            allPassed = parsed.every(r => r.passed);
          }
        } catch (parseError) {
          console.error("Failed to parse test results:", parseError, "\nRaw output:", result.output);
          parsed = { test_error: `Failed to parse results: ${parseError instanceof Error ? parseError.message : String(parseError)}` };
        }
      }
      setTestResults(parsed);

      if (allPassed) {
        console.log(`Testing section ${sectionId} - example ${example.id} PASSED all tests. Marking complete.`);
        completeSection(lessonId, sectionId);
      }
    } catch (err) {
      console.error(`Error during test execution for ${example.id}:`, err);
      setTestResults({ test_error: `Testing failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setIsTesting(false);
    }
  }, [
    exampleHook.code, // User's current code from the editor
    example.testCases,
    functionNameToTest,
    pyodideDirectRunner,
    isPyodideDirectLoading,
    pyodideDirectError,
    completeSection,
    lessonId,
    sectionId,
    example.id,
    // exampleHook.setOutput // if using it
  ]);

  const renderTestResultsDisplay = () => {
    if (!testRunHasBeenAttempted || !testResults) return null;

    if ('test_error' in testResults) {
      return (
        <div className={styles.testResultArea}>
          <div className={styles.testError}>
            <h4>Test Execution Error</h4>
            <pre>{testResults.test_error}</pre>
          </div>
        </div>
      );
    }

    if (Array.isArray(testResults)) {
      const passedCount = testResults.filter(r => r.passed).length;
      const totalCount = testResults.length;
      const allPassed = passedCount === totalCount;

      return (
        <div className={styles.testResultArea}>
          {allPassed ? (
            <div className={styles.testSuccess}>
              <h4>🎉 Great job! All tests passed!</h4>
              <p>Your solution passed {totalCount} out of {totalCount} tests.</p>
            </div>
          ) : (
            <div className={styles.testFailure}>
              <h4>Almost there!</h4>
              <p>Your solution passed {passedCount} out of {totalCount} tests.</p>
              {/* You can add more detailed table rendering here if needed */}
              {/* For brevity, showing only the summary. Original TestingSection had a table. */}
              {(() => {
                const firstFailed = testResults.find(r => !r.passed);
                if (!firstFailed) return null;
                return (
                     <>
                        <h5>First Failed Test:</h5>
                        <table className={styles.testResultsTable}>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Input</th>
                                    <th>Expected</th>
                                    <th>Your Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className={styles.testFailedRow}>
                                     <td>{firstFailed.description}</td>
                                     <td><code>{firstFailed.input}</code></td>
                                     <td><code>{firstFailed.expected}</code></td>
                                     <td><code>{firstFailed.actual}</code>{firstFailed.error ? ' (error!)' : ''}</td>
                                </tr>
                            </tbody>
                        </table>
                    </>
                );
              })()}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <InteractiveExampleDisplay
      example={example}
      {...exampleHook} // Spreads code, onCodeChange, default onRunCode, output, isRunning etc.
      // The onRunCode from exampleHook will be for the "Run Code" button (general execution)
      isRunning={exampleHook.isRunning || isTesting} // Combine running states
      hasBeenRun={exampleHook.hasBeenRun || testRunHasBeenAttempted}
      renderExtraControls={() => (
        example.testCases && example.testCases.length > 0 && (
          <button
            onClick={handleTestSolution}
            disabled={exampleHook.isPyodideLoading || pyodideDirectError || exampleHook.isRunning || isTesting}
            className={styles.testButton}
          >
            {isTesting ? 'Testing...' : 'Test Solution'}
          </button>
        )
      )}
      renderExtraOutput={renderTestResultsDisplay}
    />
  );
});

const TestingSection: React.FC<TestingSectionProps> = ({ section, lessonId }) => {
  if (!section.examples || section.examples.length === 0) {
    return (
      <section id={section.id} className={styles.section}>
        <h2 className={styles.title}>{section.title}</h2>
        <div className={styles.content}>{section.content}</div>
        <p>No examples for this testing section.</p>
      </section>
    );
  }

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>
      {section.examples.map((example: LessonExample) => (
        <TestableExample
          key={example.id}
          example={example}
          lessonId={lessonId}
          sectionId={section.id}
        />
      ))}
    </section>
  );
};

export default TestingSection;