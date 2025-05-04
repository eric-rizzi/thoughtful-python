// src/components/sections/CoverageSection.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
    CoverageSection as CoverageSectionData,
    InputParam,
    CoverageChallenge,
    ChallengeState, // Defined in types/data.ts
    SavedCoverageState // Defined in types/data.ts
} from '../../types/data';
import styles from './Section.module.css';
import { saveProgress, loadProgress } from '../../lib/localStorageUtils';
import { usePyodide } from '../../contexts/PyodideContext';
import CodeEditor from '../CodeEditor'; // For displaying target code

interface CoverageSectionProps {
  section: CoverageSectionData;
  lessonId: string;
  onSectionComplete: (sectionId: string) => void;
}

const CoverageSection: React.FC<CoverageSectionProps> = ({
    section,
    lessonId,
    onSectionComplete
}) => {
  const { runPythonCode, isLoading: isPyodideLoading, error: pyodideError } = usePyodide();
  const [challengeStates, setChallengeStates] = useState<{ [challengeId: string]: ChallengeState }>({});
  const storageKey = `coverageState_${lessonId}_${section.id}`;

  // --- Initialization & Persistence ---
  useEffect(() => {
    const savedData = loadProgress<SavedCoverageState>(storageKey);
    const initialStates: { [challengeId: string]: ChallengeState } = {};
    section.coverageChallenges.forEach(challenge => {
        const savedChallengeState = savedData?.challengeStates?.[challenge.id];
        // Initialize inputs for each parameter if not saved
        const initialInputs: { [paramName: string]: string } = {};
        section.inputParams.forEach(param => {
            initialInputs[param.name] = savedChallengeState?.inputs?.[param.name] ?? '';
        });

        initialStates[challenge.id] = {
            inputs: initialInputs,
            actualOutput: savedChallengeState?.actualOutput ?? null,
            isCorrect: savedChallengeState?.isCorrect ?? null,
            isRunning: false // Never persist running state
        };
    });
    setChallengeStates(initialStates);
  }, [storageKey, section.coverageChallenges, section.inputParams]);

  // --- State Calculation ---
  const completedCount = useMemo(() => {
      return Object.values(challengeStates).filter(state => state.isCorrect === true).length;
  }, [challengeStates]);

  const totalChallenges = section.coverageChallenges.length;
  const isComplete = completedCount === totalChallenges;
  const progressPercent = totalChallenges > 0 ? (completedCount / totalChallenges) * 100 : 0;

  // Effect to call completion handler only once when all are correct
  useEffect(() => {
    if (isComplete) {
        onSectionComplete(section.id);
    }
    // Run only when isComplete changes, ensures it fires once when transitioning to true
  }, [isComplete, section.id, onSectionComplete]);


  // --- Event Handlers ---
  const handleInputChange = useCallback((challengeId: string, paramName: string, value: string) => {
    setChallengeStates(prev => {
        const currentChallengeState = prev[challengeId] || { inputs: {}, actualOutput: null, isCorrect: null, isRunning: false };
        const updatedState = {
            ...prev,
            [challengeId]: {
                ...currentChallengeState,
                inputs: {
                    ...currentChallengeState.inputs,
                    [paramName]: value
                },
                // Reset output/correctness when input changes
                actualOutput: null,
                isCorrect: null
            }
        };
        // Save progress immediately on input change
        const stateToSave: SavedCoverageState = { challengeStates: {} };
        Object.keys(updatedState).forEach(id => {
             stateToSave.challengeStates[id] = {
                inputs: updatedState[id].inputs,
                actualOutput: updatedState[id].actualOutput,
                isCorrect: updatedState[id].isCorrect
             };
        });
        saveProgress(storageKey, stateToSave);
        return updatedState;
    });
  }, [storageKey]);


  const handleRunChallenge = useCallback(async (challenge: CoverageChallenge) => {
    if (isPyodideLoading || pyodideError || !challengeStates[challenge.id]) return;

    const currentState = challengeStates[challenge.id];

    // Set running state
     setChallengeStates(prev => ({
        ...prev,
        [challenge.id]: { ...currentState, isRunning: true, actualOutput: 'Running...', isCorrect: null }
    }));

    const inputs = currentState.inputs;
    let pythonCode = "";
    let runError: string | null = null;
    let actualOutput: string | null = null;
    let isCorrect = false;

    try {
        // Prepare variable assignments for Python
        const assignments = section.inputParams.map(param => {
            const rawValue = inputs[param.name] || ''; // Get value or empty string
            let pyValue: string;
            // Convert to Python literal based on type hint
            if (param.type === 'number') {
                const num = parseFloat(rawValue);
                pyValue = isNaN(num) ? 'None' : String(num); // Use None if not a valid number
            } else if (param.type === 'boolean') {
                const lowerVal = rawValue.toLowerCase().trim();
                if (lowerVal === 'true') pyValue = 'True';
                else if (lowerVal === 'false') pyValue = 'False';
                else pyValue = 'None'; // Treat invalid boolean input as None
            } else { // Default to string
                // Escape backslashes and quotes for Python string literal
                const escapedValue = rawValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                pyValue = `"${escapedValue}"`;
            }
            // Ensure param.name is a valid Python variable name before assignment
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param.name)) {
                throw new Error(`Invalid input parameter name: ${param.name}`);
            }
            return `${param.name} = ${pyValue}`;
        }).join('\n');

        // Construct the full code to run
        pythonCode = `
# --- Input Assignments ---
${assignments}

# --- Target Code ---
${section.code}
`;
        // Execute the code
        const result = await runPythonCode(pythonCode); // { output, error }
        runError = result.error;
        actualOutput = result.output?.trim() ?? ''; // Get trimmed output

        // Compare results (trim both for robustness)
        isCorrect = !runError && actualOutput === challenge.expectedOutput.trim();

    } catch (err) {
        console.error(`Error running coverage challenge ${challenge.id}:`, err);
        runError = err instanceof Error ? err.message : String(err);
        isCorrect = false;
    } finally {
        // Update final state for this challenge
        setChallengeStates(prev => {
            const finalState = {
                ...prev,
                [challenge.id]: {
                    ...prev[challenge.id],
                    actualOutput: runError ? `Error: ${runError}` : actualOutput,
                    isCorrect: runError ? false : isCorrect, // Mark incorrect on error
                    isRunning: false
                }
            };
             // Save final state including results
            const stateToSave: SavedCoverageState = { challengeStates: {} };
            Object.keys(finalState).forEach(id => {
                stateToSave.challengeStates[id] = {
                    inputs: finalState[id].inputs,
                    actualOutput: finalState[id].actualOutput,
                    isCorrect: finalState[id].isCorrect
                };
            });
            saveProgress(storageKey, stateToSave);
            return finalState;
        });
    }

  }, [challengeStates, section.inputParams, section.code, runPythonCode, isPyodideLoading, pyodideError, storageKey]);

  // --- Rendering ---
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      {/* Display Target Code */}
      <div className={styles.coverageCodeDisplayContainer}>
          <h4 className={styles.coverageCodeDisplayTitle}>Code to Analyze:</h4>
          <CodeEditor
              value={section.code}
              onChange={() => {}} // No-op
              readOnly={true}
              height="auto"
              minHeight="50px"
          />
      </div>

       {/* Instructions */}
      <div className={styles.coverageInstruction}>
         <p>For each "Expected Output" below, fill in the input fields and click "Run" to see if the code produces that exact output.</p>
      </div>

      {/* Challenges Table */}
      <div className={styles.coverageTableContainer}>
        <table className={styles.coverageTable}>
          <thead>
            <tr>
              {section.inputParams.map(param => <th key={param.name}>Input: {param.name}</th>)}
              <th>Expected Output</th>
              <th>Actual Output</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {section.coverageChallenges.map((challenge) => {
              const state = challengeStates[challenge.id] || { inputs: {}, actualOutput: null, isCorrect: null, isRunning: false };
              const rowClass = state.isCorrect === true ? styles.correctRow :
                               state.isCorrect === false ? styles.incorrectRow : '';
              const outputCellClass = state.isCorrect === true ? styles.correct :
                                      state.isCorrect === false ? styles.incorrect :
                                      (state.actualOutput?.startsWith('Error:') ? styles.error : '');

              return (
                <tr key={challenge.id} className={rowClass}>
                  {/* Input Cells */}
                  {section.inputParams.map(param => (
                    <td key={param.name}>
                      <input
                        type={param.type === 'number' ? 'number' : 'text'}
                        className={styles.coverageInput}
                        placeholder={param.placeholder}
                        value={state.inputs[param.name] ?? ''}
                        onChange={(e) => handleInputChange(challenge.id, param.name, e.target.value)}
                        disabled={state.isRunning || isPyodideLoading}
                        aria-label={`Input for ${param.name} for challenge ${challenge.id}`}
                      />
                    </td>
                  ))}
                  {/* Expected Output Cell */}
                  <td className={styles.expectedOutputCell}>
                      <pre>{challenge.expectedOutput}</pre>
                      {challenge.hint && (
                          <button
                              className={styles.hintButton}
                              title={challenge.hint}
                              onClick={() => alert(`Hint: ${challenge.hint}`)}
                              aria-label={`Hint for challenge ${challenge.id}`}
                          >?</button>
                      )}
                  </td>
                  {/* Actual Output Cell */}
                  <td className={`${styles.actualOutputCell} ${outputCellClass}`}>
                    <pre>{state.actualOutput ?? ''}</pre>
                  </td>
                  {/* Action Cell */}
                  <td className={styles.actionCell}>
                    <button
                      onClick={() => handleRunChallenge(challenge)}
                      disabled={state.isRunning || isPyodideLoading || !!pyodideError}
                      className={styles.coverageRunButton}
                      aria-label={`Run challenge ${challenge.id}`}
                    >
                      {state.isRunning ? 'Running...' : 'Run'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Progress Indicator */}
      <div className={styles.coverageProgress}>
          <div className={styles.progressBar}>
              <div
                  className={isComplete ? styles.progressFillComplete : styles.progressFill}
                  style={{ width: `${progressPercent}%` }}
              ></div>
          </div>
          <span className={styles.progressText}>
              {completedCount} / {totalChallenges} challenges completed
          </span>
      </div>

    </section>
  );
};

export default CoverageSection;