// src/components/sections/ObservationSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { LessonSection, LessonExample } from '../../types/data';
import styles from './Section.module.css'; // Common section styles
import CodeEditor from '../CodeEditor'; // The CM6 editor component (Step 14)
import { usePyodide } from '../../contexts/PyodideContext'; // Pyodide context (Step 13)
import { escapeHTML } from '../../lib/pyodideUtils'; // Helper utility (Step 13)

interface ObservationSectionProps {
  section: LessonSection;
  // Add lessonId and onComplete callback later for Step 22/23
  // lessonId: string;
  // onSectionComplete: (sectionId: string) => void;
}

// Define state structure for each example
interface ExampleState {
  code: string;
  output: string;
  isRunning: boolean;
  hasBeenRun: boolean; // Track if run button was clicked at least once
}

const ObservationSection: React.FC<ObservationSectionProps> = ({ section }) => {
  const { runPythonCode, isLoading: isPyodideLoading, error: pyodideError } = usePyodide();
  const [exampleStates, setExampleStates] = useState<{ [key: string]: ExampleState }>({});

  // Initialize state when examples change (e.g., on initial load)
  useEffect(() => {
    const initialState: { [key: string]: ExampleState } = {};
    section.examples?.forEach(ex => {
      // TODO: Later, load saved code state from localStorage if needed
      initialState[ex.id] = {
        code: ex.code,
        output: '',
        isRunning: false,
        hasBeenRun: false,
      };
    });
    setExampleStates(initialState);
  }, [section.examples]); // Rerun if examples array changes reference

  const handleCodeChange = useCallback((exampleId: string, newCode: string) => {
    setExampleStates(prev => ({
      ...prev,
      [exampleId]: { ...(prev[exampleId] || {}), code: newCode }
    }));
    // TODO: Potentially save draft code to localStorage here
  }, []);

  const handleRunCode = useCallback(async (exampleId: string) => {
    if (isPyodideLoading || pyodideError || !exampleStates[exampleId]) {
      console.warn("Pyodide not ready or example state missing.");
      setExampleStates(prev => ({
          ...prev,
          [exampleId]: { ...(prev[exampleId]), output: 'Python environment is not ready.' }
      }));
      return;
    }

    setExampleStates(prev => ({
      ...prev,
      [exampleId]: { ...prev[exampleId], output: 'Running...', isRunning: true, hasBeenRun: true }
    }));

    const codeToRun = exampleStates[exampleId].code;
    const result = await runPythonCode(codeToRun); // Fetches { output, error }

    setExampleStates(prev => ({
      ...prev,
      [exampleId]: {
        ...prev[exampleId],
        // Display error prominently if present, otherwise show output
        output: result.error ? `Error:\n${result.error}${result.output ? `\nOutput before error:\n${result.output}` : ''}` : result.output,
        isRunning: false
      }
    }));

    // --- Placeholder for Completion Logic (Phase 5) ---
    // For Observation, maybe complete after running *any* example?
    // Or maybe all examples? Needs clarification.
    // if (!result.error) {
    //    // Call function passed via props or context to mark completion
    //    // onSectionComplete(section.id);
    //    console.log(`Placeholder: Section ${section.id} potentially complete.`);
    // }
    // --- End Placeholder ---

  }, [exampleStates, isPyodideLoading, pyodideError, runPythonCode]); // Dependencies for useCallback


  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      {/* Render content safely */}
      <div className={styles.content}>{section.content}</div>

      {/* Render Examples */}
      {section.examples?.map((example: LessonExample) => {
        const state = exampleStates[example.id];
        // Determine if the button should be disabled
        const canRun = !isPyodideLoading && !pyodideError && !state?.isRunning;

        return (
          <div key={example.id} className={styles.exampleContainer}>
            <h3 className={styles.exampleTitle}>{example.title}</h3>
            <p className={styles.exampleDescription}>{example.description}</p>
            <CodeEditor
              value={state?.code ?? example.code} // Use state code, fallback to initial
              onChange={(newCode) => handleCodeChange(example.id, newCode)}
            />
            <div className={styles.editorControls}>
                <button
                    onClick={() => handleRunCode(example.id)}
                    disabled={!canRun}
                    className={styles.runButton}
                >
                    {state?.isRunning ? 'Running...' : 'Run Code'}
                </button>
                 {/* Show Pyodide status near the button */}
                {isPyodideLoading && <span className={styles.pyodideStatus}>Initializing Python...</span>}
                {pyodideError && <span className={styles.pyodideError}>Pyodide Error!</span>}
            </div>

             {/* Display Output Area only if run or loading */}
            {(state?.isRunning || state?.hasBeenRun) && (
                 <div className={styles.outputArea}>
                     <pre>
                        {/* Use escapeHTML for security */}
                        {state?.output
                            ? escapeHTML(state.output)
                            : (state?.isRunning ? '' : <span className={styles.outputEmpty}>Code executed (no output).</span>)
                        }
                     </pre>
                 </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default ObservationSection;