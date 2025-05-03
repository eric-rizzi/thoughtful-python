// src/components/sections/ObservationSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { LessonSection, LessonExample, SavedCodeState } from '../../types/data';
import styles from './Section.module.css'; // Common section styles
import CodeEditor from '../CodeEditor'; // The CM6 editor component (Step 14)
import { usePyodide } from '../../contexts/PyodideContext'; // Pyodide context (Step 13)
import { useProgressActions } from '../../stores/progressStore';
import { loadProgress, saveProgress } from '../../lib/localStorageUtils';

interface ObservationSectionProps {
  section: LessonSection;
  lessonId: string;
}

// Define state structure for each example
interface ExampleState {
  code: string;
  output: string;
  isRunning: boolean;
  hasBeenRun: boolean; // Track if run button was clicked at least once
}


const ObservationSection: React.FC<ObservationSectionProps> = ({ section, lessonId }) => {
  const { completeSection } = useProgressActions();
  const { runPythonCode, isLoading: isPyodideLoading, error: pyodideError } = usePyodide();
  const [exampleStates, setExampleStates] = useState<{ [key: string]: ExampleState }>({});
  const storageKey = `observeCode_${lessonId}_${section.id}`;

  // Initialize state when examples change (e.g., on initial load)
  useEffect(() => {
    const initialState: { [key: string]: ExampleState } = {};
    const savedCodeState = loadProgress<SavedCodeState>(storageKey);
    section.examples?.forEach(ex => {
      console.log(`ObservationSection ${section.id}: Loaded saved code state:`, savedCodeState);
      initialState[ex.id] = {
        code: savedCodeState?.[ex.id] ?? ex.code,
        output: '',
        isRunning: false,
        hasBeenRun: false,
      };
    });
    setExampleStates(initialState);
  }, [section.examples, storageKey, section.id]); // Rerun if examples array changes reference

  // Callback to handle code changes (uses storageKey via saveCurrentCodeState)
  const saveCurrentCodeState = useCallback((currentStates: typeof exampleStates) => {
    const codeToSave: SavedCodeState = {};
    Object.keys(currentStates).forEach(exId => {
        codeToSave[exId] = currentStates[exId].code;
    });
    saveProgress(storageKey, codeToSave); // Use storageKey
  }, [storageKey]); // Dependency


  const handleCodeChange = useCallback((exampleId: string, newCode: string) => {
    setExampleStates(prev => {
      const newState = {
        ...prev,
        [exampleId]: { ...(prev[exampleId] || { code: '', output: '', isRunning: false, hasBeenRun: false }), code: newCode }
      };
      // Save the updated code state
      saveCurrentCodeState(newState);
      return newState;
    });
  }, [saveCurrentCodeState]); // Dependency

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

    // For Observation, complete after running *any* example?
    if (!result.error) {
      console.log(`Observation section ${section.id} run successfully. Marking complete.`);
      completeSection(lessonId, section.id);
    }

  }, [exampleStates, isPyodideLoading, pyodideError, runPythonCode, lessonId, section.id, completeSection]);


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
                        {state?.output
                            ? state.output
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