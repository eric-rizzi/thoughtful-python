// src/components/sections/TestingSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { LessonSection, LessonExample } from '../../types/data';
import styles from './Section.module.css';
import CodeEditor from '../CodeEditor';
import { usePyodide } from '../../contexts/PyodideContext';
import { generateTestCode, parseTestResults, TestResult } from '../../lib/pyodideUtils';

interface TestingSectionProps {
  section: LessonSection;
  // Add lessonId and onComplete callback later for Step 22/23
  // lessonId: string;
  // onSectionComplete: (sectionId: string) => void;
}

interface ExampleState {
  code: string;
  output: string; // For regular 'Run' output
  testResults: TestResult[] | { test_error: string } | null;
  isRunning: boolean;
  isTesting: boolean;
  testRunCompleted: boolean; // Track if tests have been run at least once
}

const TestingSection: React.FC<TestingSectionProps> = ({ section }) => {
  const { runPythonCode, isLoading: isPyodideLoading, error: pyodideError } = usePyodide();
  const [exampleStates, setExampleStates] = useState<{ [key: string]: ExampleState }>({});

  // Initialize or update state when section examples change
  useEffect(() => {
    const initialState: { [key: string]: ExampleState } = {};
    section.examples?.forEach(ex => {
      initialState[ex.id] = {
        code: ex.code,
        output: '',
        testResults: null,
        isRunning: false,
        isTesting: false,
        testRunCompleted: false,
      };
    });
    setExampleStates(initialState);
  }, [section.examples]);

  const handleCodeChange = useCallback((exampleId: string, newCode: string) => {
    setExampleStates(prev => ({
      ...prev,
      [exampleId]: {
        ...(prev[exampleId] || {}), // Ensure previous state exists
        code: newCode,
        // Reset test results if code changes? Optional.
        // testResults: null,
        // testRunCompleted: false,
      }
    }));
  }, []);

  // Handler for the simple "Run" button (optional)
  const handleRunCode = useCallback(async (exampleId: string) => {
    if (isPyodideLoading || pyodideError || !exampleStates[exampleId]) {
       setExampleStates(prev => ({ ...prev, [exampleId]: { ...(prev[exampleId]), output: 'Python environment not ready.', isRunning: false } }));
      return;
    }

    setExampleStates(prev => ({
      ...prev,
      [exampleId]: { ...prev[exampleId], output: 'Running...', isRunning: true, testResults: null, testRunCompleted: false }
    }));

    const codeToRun = exampleStates[exampleId].code;
    const result = await runPythonCode(codeToRun); // Returns { output, error }

    setExampleStates(prev => ({
      ...prev,
      [exampleId]: {
        ...prev[exampleId],
        output: result.error ? `Error:\n${result.error}` : result.output || 'Code executed (no output).',
        isRunning: false
      }
    }));
  }, [exampleStates, isPyodideLoading, pyodideError, runPythonCode]);

  // Handler for the "Test Solution" button
  const handleTestCode = useCallback(async (exampleId: string, exampleData: LessonExample) => {

    if (isPyodideLoading || pyodideError || !exampleStates[exampleId]) {
        setExampleStates(prev => ({ ...prev, [exampleId]: { ...(prev[exampleId]), testResults: { test_error: 'Python environment not ready.' }, isTesting: false, testRunCompleted: true } }));
        return;
    }
    if (!exampleData.testCases || exampleData.testCases.length === 0) {
        setExampleStates(prev => ({ ...prev, [exampleId]: { ...(prev[exampleId]), testResults: { test_error: 'No test cases defined for this example.' }, isTesting: false, testRunCompleted: true } }));
        return;
    }

    setExampleStates(prev => ({
      ...prev,
      [exampleId]: { ...prev[exampleId], output: '', testResults: null, isTesting: true, testRunCompleted: false }
    }));

    const codeToTest = exampleStates[exampleId].code;
    // TODO: Make function name configurable in JSON? Assume 'solution' or parse?
    // Let's assume the function to test is typically named 'solution' or infer from context if possible.
    // For now, using a placeholder name. Update generateTestCode if needed.
    const functionNameToTest = 'celsius_to_fahrenheit'; // Example - MAKE DYNAMIC LATER

    try {
        const testCode = generateTestCode(codeToTest, functionNameToTest, exampleData.testCases);
      console.log(testCode)
        const rawResult = await runPythonCode(testCode); // Returns { output, error }
        console.log("Boobs 110")
        console.log(rawResult)

        let parsedResults: TestResult[] | { test_error: string } | null = null;
        let allPassed = false;

        if (rawResult.error) {
            // If runPythonCode itself returned an error (e.g., syntax in generated code)
             parsedResults = { test_error: rawResult.error };
        } else {
            // Try parsing the JSON block from the output
            try {
                 parsedResults = parseTestResults(rawResult.output);
                 if (Array.isArray(parsedResults)) {
                     allPassed = parsedResults.every(r => r.passed);
                 } else {
                     // It's the { test_error: "..." } object from Python
                     console.error("Test execution error reported from Python:", parsedResults.test_error);
                 }
            } catch (parseError) {
                 console.error("Failed to parse test results:", parseError);
                 console.error("Raw output was:", rawResult.output);
                 parsedResults = { test_error: `Failed to parse results: ${parseError instanceof Error ? parseError.message : String(parseError)}\nRaw Output:\n${rawResult.output}` };
            }
        }

        setExampleStates(prev => ({
            ...prev,
            [exampleId]: {
                ...prev[exampleId],
                testResults: parsedResults,
                isTesting: false,
                testRunCompleted: true
            }
        }));

        // --- Placeholder for Completion Logic (Phase 5) ---
        if (allPassed) {
             // Call function passed via props or context to mark completion
             // onSectionComplete(section.id);
             console.log(`Placeholder: Section ${section.id} / Example ${exampleId} PASSED all tests.`);
        }
        // --- End Placeholder ---

    } catch (err) {
        console.error(`Error during test generation or execution for ${exampleId}:`, err);
        setExampleStates(prev => ({
            ...prev,
            [exampleId]: {
                ...prev[exampleId],
                testResults: { test_error: `Testing failed: ${err instanceof Error ? err.message : String(err)}` },
                isTesting: false,
                testRunCompleted: true
            }
        }));
    }
  }, [exampleStates, isPyodideLoading, pyodideError, runPythonCode]);

  // Helper component/function to render test results
  const renderTestResults = (results: TestResult[] | { test_error: string } | null) => {
      if (!results) return null;

      console.log(results)
      if ('test_error' in results) {
          return (
              <div className={styles.testError}>
                  <h4>Test Execution Error</h4>
                  <pre>{results.test_error}</pre>
              </div>
          );
      }

      if (Array.isArray(results)) {
          const passedCount = results.filter(r => r.passed).length;
          const totalCount = results.length;
          const allPassed = passedCount === totalCount;

          if (allPassed) {
              return (
                  <div className={styles.testSuccess}>
                      <h4>🎉 Great job! All tests passed!</h4>
                      <p>Your solution passed {totalCount} out of {totalCount} tests.</p>
                  </div>
              );
          } else {
              const firstFailed = results.find(r => !r.passed);
              return (
                  <div className={styles.testFailure}>
                      <h4>Almost there!</h4>
                      <p>Your solution passed {passedCount} out of {totalCount} tests.</p>
                      {firstFailed && (
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
                                           {/* Use repr for input/expected/actual */}
                                           <td><code>{firstFailed.input}</code></td>
                                           <td><code>{firstFailed.expected}</code></td>
                                           <td><code>{firstFailed.actual}</code>{firstFailed.error ? ' (error!)' : ''}</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </>
                      )}
                      <p style={{marginTop: '1rem'}}>Review the failed test and try again.</p>
                  </div>
              );
          }
      }
      return null; // Should not happen
  };


  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      {section.examples?.map((example: LessonExample) => {
        const state = exampleStates[example.id];
        const canRunOrTest = !isPyodideLoading && !pyodideError && !state?.isRunning && !state?.isTesting;

        // Testing sections MUST have test cases defined in the JSON
        const hasTests = !!example.testCases && example.testCases.length > 0;

        return (
          <div key={example.id} className={styles.exampleContainer}>
            <h3 className={styles.exampleTitle}>{example.title}</h3>
            <p className={styles.exampleDescription}>{example.description}</p>
            <CodeEditor
              value={state?.code ?? example.code}
              onChange={(newCode) => handleCodeChange(example.id, newCode)}
            />
            <div className={styles.editorControls}>
              <div> {/* Group buttons */}
                <button
                    onClick={() => handleRunCode(example.id)}
                    disabled={!canRunOrTest}
                    className={styles.runButton}
                    title="Run code without tests"
                >
                    {state?.isRunning ? 'Running...' : 'Run'}
                </button>
                {hasTests && (
                     <button
                        onClick={() => handleTestCode(example.id, example)}
                        disabled={!canRunOrTest}
                        className={styles.testButton}
                        title="Run code against test cases"
                    >
                        {state?.isTesting ? 'Testing...' : 'Test Solution'}
                    </button>
                )}
              </div>
               {/* Show Pyodide status */}
               <div>
                    {isPyodideLoading && <span className={styles.pyodideStatus}>Initializing Python...</span>}
                    {pyodideError && <span className={styles.pyodideError}>Pyodide Error!</span>}
               </div>
            </div>

            {/* Area for standard run output */}
            {(state?.isRunning || state?.output) && (
                 <div className={styles.outputArea}>
                    <pre>
                        {state?.output
                            ? state.output
                            : (state?.isRunning ? '' : <span className={styles.outputEmpty}>No output from run.</span>)
                        }
                    </pre>
                 </div>
            )}

            {/* Area for Test Results */}
            {state?.testRunCompleted && (
                <div className={styles.testResultArea}>
                    {renderTestResults(state.testResults)}
                </div>
            )}

            {!hasTests && <p style={{marginTop: '1rem', color: '#777', fontSize: '0.9em'}}><i>Note: No automated tests defined for this example. Use the "Run" button to execute.</i></p>}

          </div>
        );
      })}
    </section>
  );
};

export default TestingSection;