// src/components/sections/CoverageSection.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type {
  CoverageSection as CoverageSectionData,
  ChallengeState, // Already used, keep if needed for types
  SavedCoverageState,
} from "../../types/data";
import styles from "./Section.module.css";
import { saveProgress, loadProgress } from "../../lib/localStorageUtils";
import { usePyodide } from "../../contexts/PyodideContext";
import CodeEditor from "../CodeEditor"; // For displaying target code
import { useProgressActions } from "../../stores/progressStore";

interface CoverageSectionProps {
  section: CoverageSectionData;
  lessonId: string;
}

const CoverageSection: React.FC<CoverageSectionProps> = ({
  section,
  lessonId,
  // onSectionComplete // REMOVE
}) => {
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const { completeSection } = useProgressActions(); // <-- USE ZUSTAND ACTION

  const [challengeStates, setChallengeStates] = useState<{
    [challengeId: string]: ChallengeState;
  }>({});
  const storageKey = `coverageState_${lessonId}_${section.id}`;

  // --- Initialization & Persistence ---
  useEffect(() => {
    const savedData = loadProgress<SavedCoverageState>(storageKey);
    const initialStates: { [challengeId: string]: ChallengeState } = {};
    section.coverageChallenges.forEach((challenge) => {
      const savedChallengeState = savedData?.challengeStates?.[challenge.id];
      const initialInputs: { [paramName: string]: string } = {};
      section.inputParams.forEach((param) => {
        initialInputs[param.name] =
          savedChallengeState?.inputs?.[param.name] ?? "";
      });

      initialStates[challenge.id] = {
        inputs: initialInputs,
        actualOutput: savedChallengeState?.actualOutput ?? null,
        isCorrect: savedChallengeState?.isCorrect ?? null,
        isRunning: false,
      };
    });
    setChallengeStates(initialStates);
  }, [storageKey, section.coverageChallenges, section.inputParams]);

  // --- State Calculation ---
  const completedCount = useMemo(() => {
    return Object.values(challengeStates).filter(
      (state) => state.isCorrect === true
    ).length;
  }, [challengeStates]);

  const totalChallenges = section.coverageChallenges.length;
  const isComplete = totalChallenges > 0 && completedCount === totalChallenges;
  const progressPercent =
    totalChallenges > 0 ? (completedCount / totalChallenges) * 100 : 0;

  // Effect to call completion handler (now using Zustand action)
  useEffect(() => {
    if (isComplete) {
      console.log(
        `CoverageSection ${section.id} is complete. Marking via Zustand.`
      );
      completeSection(lessonId, section.id); // <-- USE ZUSTAND ACTION
    }
  }, [isComplete, section.id, lessonId, completeSection]); // Added dependencies

  // --- Event Handlers ---
  const handleInputChange = useCallback(
    (challengeId: string, paramName: string, value: string) => {
      setChallengeStates((prev) => {
        const currentChallengeState = prev[challengeId] || {
          inputs: {},
          actualOutput: null,
          isCorrect: null,
          isRunning: false,
        };
        const updatedState = {
          ...prev,
          [challengeId]: {
            ...currentChallengeState,
            inputs: { ...currentChallengeState.inputs, [paramName]: value },
            actualOutput: null,
            isCorrect: null,
          },
        };
        // Save progress immediately on input change
        const stateToSave: SavedCoverageState = { challengeStates: {} };
        Object.keys(updatedState).forEach((id) => {
          stateToSave.challengeStates[id] = {
            inputs: updatedState[id].inputs,
            actualOutput: updatedState[id].actualOutput,
            isCorrect: updatedState[id].isCorrect,
          };
        });
        saveProgress(storageKey, stateToSave);
        return updatedState;
      });
    },
    [storageKey]
  );

  const handleRunChallenge = useCallback(
    async (challenge: CoverageSectionData["coverageChallenges"][0]) => {
      if (isPyodideLoading || pyodideError || !challengeStates[challenge.id])
        return;

      const currentState = challengeStates[challenge.id];

      // Set running state
      setChallengeStates((prev) => ({
        ...prev,
        [challenge.id]: {
          ...currentState,
          isRunning: true,
          actualOutput: "Running...",
          isCorrect: null,
        },
      }));

      const inputs = currentState.inputs;
      let runError: string | null = null;
      let actualOutput: string | null = null;
      let isCorrectFlag = false;

      try {
        // Prepare variable assignments for Python
        const assignments = section.inputParams
          .map((param) => {
            // ... (input preparation logic is the same) ...
            const rawValue = inputs[param.name] || "";
            let pyValue: string;
            if (param.type === "number") {
              const num = parseFloat(rawValue);
              pyValue = isNaN(num) ? "None" : String(num);
            } else if (param.type === "boolean") {
              // Ensure boolean conversion handles 'True'/'False' strings
              const lowerVal = rawValue.toLowerCase().trim();
              if (lowerVal === "true") pyValue = "True";
              else if (lowerVal === "false") pyValue = "False";
              else pyValue = `"${String(rawValue)}"`; // Or treat as string if not strictly True/False
            } else {
              const escapedValue = rawValue
                .replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"');
              pyValue = `"${escapedValue}"`;
            }
            // Ensure param.name is a valid Python variable name before assignment
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param.name)) {
              throw new Error(`Invalid input parameter name: ${param.name}`);
            }
            return `${param.name} = ${pyValue}`;
          })
          .join("\n");

        const pythonCode = `${assignments}\n\n${section.code}`;
        const result = await runPythonCode(pythonCode);
        runError = result.error;
        actualOutput = result.output?.trim() ?? "";
        isCorrectFlag =
          !runError && actualOutput === challenge.expectedOutput.trim();
      } catch (err) {
        console.error(`Error running coverage challenge ${challenge.id}:`, err);
        runError = err instanceof Error ? err.message : String(err);
        isCorrectFlag = false;
      } finally {
        // Update final state for this challenge
        setChallengeStates((prev) => {
          const finalState = {
            ...prev,
            [challenge.id]: {
              ...prev[challenge.id],
              actualOutput: runError ? `Error: ${runError}` : actualOutput,
              isCorrect: runError ? false : isCorrectFlag,
              isRunning: false,
            },
          };
          // Save final state including results
          const stateToSave: SavedCoverageState = { challengeStates: {} };
          Object.keys(finalState).forEach((id) => {
            stateToSave.challengeStates[id] = {
              inputs: finalState[id].inputs,
              actualOutput: finalState[id].actualOutput,
              isCorrect: finalState[id].isCorrect,
            };
          });
          saveProgress(storageKey, stateToSave);
          return finalState;
        });
      }
    },
    [
      challengeStates,
      section.inputParams,
      section.code,
      runPythonCode,
      isPyodideLoading,
      pyodideError,
      storageKey,
    ]
  );

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
          onChange={() => {}}
          readOnly={true}
          height="auto"
          minHeight="50px"
        />
      </div>

      {/* Instructions */}
      <div className={styles.coverageInstruction}>
        <p>
          For each "Expected Output" below, fill in the input fields and click
          "Run" to see if the code produces that exact output.
        </p>
      </div>

      {/* Challenges Table */}
      <div className={styles.coverageTableContainer}>
        <table className={styles.coverageTable}>
          <thead>
            <tr>
              {section.inputParams.map((param) => (
                <th key={param.name}>Input: {param.name}</th>
              ))}
              <th>Expected Output</th>
              <th>Actual Output</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {section.coverageChallenges.map((challenge) => {
              const state = challengeStates[challenge.id] || {
                inputs: {},
                actualOutput: null,
                isCorrect: null,
                isRunning: false,
              };
              const rowClass =
                state.isCorrect === true
                  ? styles.correctRow
                  : state.isCorrect === false
                  ? styles.incorrectRow
                  : "";
              const outputCellClass =
                state.isCorrect === true
                  ? styles.correct
                  : state.isCorrect === false
                  ? styles.incorrect
                  : state.actualOutput?.startsWith("Error:")
                  ? styles.error
                  : "";

              return (
                <tr key={challenge.id} className={rowClass}>
                  {/* Input Cells */}
                  {section.inputParams.map((param) => (
                    <td key={param.name}>
                      <input
                        type={param.type === "number" ? "number" : "text"}
                        className={styles.coverageInput}
                        placeholder={param.placeholder}
                        value={state.inputs[param.name] ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            challenge.id,
                            param.name,
                            e.target.value
                          )
                        }
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
                      >
                        ?
                      </button>
                    )}
                  </td>
                  {/* Actual Output Cell */}
                  <td
                    className={`${styles.actualOutputCell} ${outputCellClass}`}
                  >
                    <pre>{state.actualOutput ?? ""}</pre>
                  </td>
                  {/* Action Cell */}
                  <td className={styles.actionCell}>
                    <button
                      onClick={() => handleRunChallenge(challenge)}
                      disabled={
                        state.isRunning || isPyodideLoading || !!pyodideError
                      }
                      className={styles.coverageRunButton}
                      aria-label={`Run challenge ${challenge.id}`}
                    >
                      {state.isRunning ? "Running..." : "Run"}
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
            className={
              isComplete ? styles.progressFillComplete : styles.progressFill
            }
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
