// src/components/sections/CoverageSection.tsx
import React, { useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  CoverageSectionData,
  SavedCoverageState,
  InputParam,
  CoverageChallenge,
} from "../../types/data";
import styles from "./Section.module.css";
import { usePyodide } from "../../contexts/PyodideContext";
import CodeEditor from "../CodeEditor";
import { useSectionProgress } from "../../hooks/useSectionProgress";

interface CoverageSectionProps {
  section: CoverageSectionData;
  lessonId: string;
}

const CoverageSection: React.FC<CoverageSectionProps> = ({
  section,
  lessonId,
}) => {
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();

  const storageKey = `coverageState_${lessonId}_${section.id}`;

  // Initialize the state for the hook. Each challenge will have an entry.
  const initialHookState = useMemo((): SavedCoverageState => {
    const initialChallengeStates: SavedCoverageState["challengeStates"] = {};
    section.coverageChallenges.forEach((challenge) => {
      const initialInputs: { [paramName: string]: string } = {};
      section.inputParams.forEach((param) => {
        initialInputs[param.name] = ""; // Default to empty string
      });
      initialChallengeStates[challenge.id] = {
        inputs: initialInputs,
        actualOutput: null,
        isCorrect: null,
        // 'isRunning' is not part of PersistedChallengeState / SavedCoverageState
      };
    });
    return { challengeStates: initialChallengeStates };
  }, [section.coverageChallenges, section.inputParams]);

  const checkCoverageCompletion = useCallback(
    (currentHookState: SavedCoverageState): boolean => {
      if (section.coverageChallenges.length === 0) {
        return false; // Or true if empty sections are considered complete by default
      }
      return section.coverageChallenges.every(
        (challenge) =>
          currentHookState.challengeStates[challenge.id]?.isCorrect === true
      );
    },
    [section.coverageChallenges]
  );

  const [
    coverageHookState, // This is SavedCoverageState { challengeStates: { ... } }
    setCoverageHookState,
    isSectionComplete, // Boolean from the hook
  ] = useSectionProgress<SavedCoverageState>(
    lessonId,
    section.id,
    storageKey,
    initialHookState,
    checkCoverageCompletion
  );

  // Component-level state for 'isRunning' status of each challenge, not persisted.
  const [runningStates, setRunningStates] = React.useState<{
    [challengeId: string]: boolean;
  }>({});

  const completedCount = useMemo(() => {
    return Object.values(coverageHookState.challengeStates).filter(
      (state) => state.isCorrect === true
    ).length;
  }, [coverageHookState.challengeStates]);

  const totalChallenges = section.coverageChallenges.length;
  const progressPercent =
    totalChallenges > 0 ? (completedCount / totalChallenges) * 100 : 0;

  const handleInputChange = useCallback(
    (challengeId: string, paramName: string, value: string) => {
      setCoverageHookState((prevState) => {
        const currentChallengeState = prevState.challengeStates[
          challengeId
        ] || {
          inputs: {},
          actualOutput: null,
          isCorrect: null,
        };
        return {
          ...prevState,
          challengeStates: {
            ...prevState.challengeStates,
            [challengeId]: {
              ...currentChallengeState,
              inputs: { ...currentChallengeState.inputs, [paramName]: value },
              actualOutput: null, // Reset output and correctness on input change
              isCorrect: null,
            },
          },
        };
      });
    },
    [setCoverageHookState]
  );

  const handleRunChallenge = useCallback(
    async (challenge: CoverageChallenge) => {
      if (
        isPyodideLoading ||
        pyodideError ||
        !coverageHookState.challengeStates[challenge.id]
      ) {
        // Update persisted state with an error message if Pyodide isn't ready
        setCoverageHookState((prev) => ({
          ...prev,
          challengeStates: {
            ...prev.challengeStates,
            [challenge.id]: {
              ...prev.challengeStates[challenge.id],
              actualOutput: `Error: Python environment not ready.`,
              isCorrect: false,
            },
          },
        }));
        return;
      }

      setRunningStates((prev) => ({ ...prev, [challenge.id]: true }));
      // Update persisted state to show "Running..."
      setCoverageHookState((prev) => ({
        ...prev,
        challengeStates: {
          ...prev.challengeStates,
          [challenge.id]: {
            ...prev.challengeStates[challenge.id],
            actualOutput: "Running...",
            isCorrect: null,
          },
        },
      }));

      const currentChallengeInputs =
        coverageHookState.challengeStates[challenge.id].inputs;
      let runError: string | null = null;
      let actualOutputText: string | null = null; // Renamed to avoid conflict with actualOutput in state
      let isCorrectFlag = false;

      try {
        const assignments = section.inputParams
          .map((param) => {
            const rawValue = currentChallengeInputs[param.name] || "";
            let pyValue: string;
            if (param.type === "number") {
              const num = parseFloat(rawValue);
              pyValue = isNaN(num) ? "None" : String(num);
            } else if (param.type === "boolean") {
              const lowerVal = rawValue.toLowerCase().trim();
              if (lowerVal === "true") pyValue = "True";
              else if (lowerVal === "false") pyValue = "False";
              else pyValue = `"${String(rawValue).replace(/"/g, '\\"')}"`;
            } else {
              const escapedValue = rawValue
                .replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"');
              pyValue = `"${escapedValue}"`;
            }
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(param.name)) {
              throw new Error(`Invalid input parameter name: ${param.name}`);
            }
            return `${param.name} = ${pyValue}`;
          })
          .join("\n");

        const pythonCode = `${assignments}\n\n${section.code}`;
        const result = await runPythonCode(pythonCode);
        runError = result.error;
        actualOutputText = result.output?.trim() ?? "";
        isCorrectFlag =
          !runError && actualOutputText === challenge.expectedOutput.trim();
      } catch (err) {
        console.error(`Error running coverage challenge ${challenge.id}:`, err);
        runError = err instanceof Error ? err.message : String(err);
        isCorrectFlag = false;
      } finally {
        setCoverageHookState((prev) => ({
          ...prev,
          challengeStates: {
            ...prev.challengeStates,
            [challenge.id]: {
              ...prev.challengeStates[challenge.id],
              actualOutput: runError ? `Error: ${runError}` : actualOutputText,
              isCorrect: runError ? false : isCorrectFlag,
            },
          },
        }));
        setRunningStates((prev) => ({ ...prev, [challenge.id]: false }));
      }
    },
    [
      coverageHookState.challengeStates, // Depends on the inputs within this state
      section.inputParams,
      section.code,
      runPythonCode,
      isPyodideLoading,
      pyodideError,
      setCoverageHookState,
    ]
  );

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>

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

      <div className={styles.coverageInstruction}>
        <p>
          For each "Expected Output" below, fill in the input fields and click
          "Run" to see if the code produces that exact output.
        </p>
      </div>

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
              // Get the persisted state from the hook
              const persistedState =
                coverageHookState.challengeStates[challenge.id] ||
                initialHookState.challengeStates[challenge.id];
              const isChallengeRunning = runningStates[challenge.id] || false;

              const rowClass =
                persistedState.isCorrect === true
                  ? styles.correctRow
                  : persistedState.isCorrect === false
                  ? styles.incorrectRow
                  : "";
              const outputCellClass =
                persistedState.isCorrect === true
                  ? styles.correct
                  : persistedState.isCorrect === false
                  ? styles.incorrect
                  : persistedState.actualOutput?.startsWith("Error:")
                  ? styles.error
                  : "";

              return (
                <tr key={challenge.id} className={rowClass}>
                  {section.inputParams.map((param: InputParam) => (
                    <td key={param.name}>
                      <input
                        type={param.type === "number" ? "number" : "text"}
                        className={styles.coverageInput}
                        placeholder={param.placeholder}
                        value={persistedState.inputs[param.name] ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            challenge.id,
                            param.name,
                            e.target.value
                          )
                        }
                        disabled={isChallengeRunning || isPyodideLoading}
                        aria-label={`Input for ${param.name} for challenge ${challenge.id}`}
                      />
                    </td>
                  ))}
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
                  <td
                    className={`${styles.actualOutputCell} ${outputCellClass}`}
                  >
                    <pre>{persistedState.actualOutput ?? ""}</pre>,
                  </td>
                  <td className={styles.actionCell}>
                    <button
                      onClick={() => handleRunChallenge(challenge)}
                      disabled={
                        isChallengeRunning || isPyodideLoading || !!pyodideError
                      }
                      className={styles.coverageRunButton}
                      aria-label={`Run challenge ${challenge.id}`}
                    >
                      {isChallengeRunning ? "Running..." : "Run"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.coverageProgress}>
        <div className={styles.progressBar}>
          <div
            className={
              isSectionComplete
                ? styles.progressFillComplete
                : styles.progressFill
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
