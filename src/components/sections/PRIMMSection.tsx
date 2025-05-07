// src/components/sections/PRIMMSection.tsx
import React, { useState, useCallback, useMemo } from "react"; // Added useState for local running state
import type {
  PRIMMSection as PRIMMSectionData,
  PRIMMCodeExample,
  PRIMMExampleState, // Use updated interface
  SavedPRIMMSectionState, // Use updated interface
} from "../../types/data";
import styles from "./Section.module.css";
import primmStyles from "./PRIMMSection.module.css";
import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import { useSectionProgress } from "../../hooks/useSectionProgress";

interface PRIMMExampleBlockProps {
  example: PRIMMCodeExample;
  state: PRIMMExampleState;
  onStateChange: (newState: Partial<PRIMMExampleState>) => void;
  onRunCode: () => Promise<{ output: string; error: string | null }>;
  isPyodideLoading: boolean;
  pyodideError: Error | null;
}

// *** PRIMMExampleBlock Sub-component ***
const PRIMMExampleBlock: React.FC<PRIMMExampleBlockProps> = React.memo(
  ({
    example,
    state,
    onStateChange,
    onRunCode,
    isPyodideLoading,
    pyodideError,
  }) => {
    // Local state to track if the 'Run' button is currently executing
    const [isRunningCode, setIsRunningCode] = useState(false);

    const handlePredictionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only update prediction, don't affect other states yet
      onStateChange({ userPrediction: e.target.value });
    };

    const handleExplanationChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const newText = e.target.value;
      const explanationMet = newText.length >= example.minExplanationLength;
      // When explanation is updated, check if *this action* makes the block complete
      // (It completes if explanation is now met AND the explanation was needed due to prior wrong prediction)
      const blockNowComplete =
        explanationMet &&
        state.runAttempted &&
        !state.runError &&
        !(
          state.userPrediction.trim().toLowerCase() ===
          example.expectedPrediction.trim().toLowerCase()
        );
      onStateChange({
        explanationText: newText,
        hasMetExplanationRequirement: explanationMet,
        isComplete: state.isComplete || blockNowComplete,
      });
    };

    const handleRunCodeInternal = async () => {
      setIsRunningCode(true);
      // Update persisted state immediately to show "Running..."
      onStateChange({
        output: "Running...",
        runError: null,
        runAttempted: true,
      });

      const result = await onRunCode();
      const actualOutput = result.error ? null : result.output || "";
      const predictionAtRunTime = state.userPrediction.trim();

      const wasCorrectNow =
        !result.error &&
        actualOutput !== null &&
        predictionAtRunTime.toLowerCase() ===
          example.expectedPrediction.trim().toLowerCase();

      const needsExplanationNow = !wasCorrectNow && !result.error;
      // Check if existing explanation text already meets requirement
      const explanationRequirementAlreadyMet =
        needsExplanationNow &&
        state.explanationText.length >= example.minExplanationLength;
      const blockCompleteNow =
        wasCorrectNow || explanationRequirementAlreadyMet;

      onStateChange({
        output: actualOutput,
        runError: result.error,
        hasMetExplanationRequirement:
          wasCorrectNow || explanationRequirementAlreadyMet, // Met if correct OR explanation already sufficient
        isComplete: blockCompleteNow,
      });

      setIsRunningCode(false);
    };

    // --- Reordered Declarations ---
    const isRunEnabled =
      !!state.userPrediction.trim() && !isRunningCode && !isPyodideLoading;

    // Define wasPredictionCorrect FIRST based on current state (for display)
    const wasPredictionCorrect =
      state.runAttempted &&
      !state.runError &&
      state.output !== null &&
      state.userPrediction.trim().toLowerCase() ===
        example.expectedPrediction.trim().toLowerCase();

    const showExplanation =
      state.runAttempted && !state.runError && !wasPredictionCorrect;

    return (
      // --- JSX Structure (updated slightly for clarity and disabling) ---
      <div
        className={`${primmStyles.exampleBlock} ${
          state.isComplete ? primmStyles.blockComplete : ""
        }`}
      >
        {/* 1. Code */}
        <h4>Code Example:</h4>
        <CodeEditor
          value={example.code}
          onChange={() => {}}
          readOnly={true}
          height="auto"
          minHeight="80px"
        />

        {/* 2. Output Area */}
        <h4>Output:</h4>
        <div className={`${styles.outputArea} ${primmStyles.outputArea}`}>
          {state.runAttempted ? (
            <pre>
              {state.runError
                ? `Error: ${state.runError}`
                : state.output ?? "Code executed (no output)."}
            </pre>
          ) : (
            <span className={styles.outputEmpty}>
              Output will appear here after running.
            </span>
          )}
        </div>

        {/* 3. Prediction Area + Run Button */}
        <div className={primmStyles.predictionRunArea}>
          <div className={primmStyles.predictionInputGroup}>
            <label htmlFor={`predict-${example.id}`}>
              {example.predictPrompt}{" "}
              {example.predictionTargetDescription &&
                `(${example.predictionTargetDescription})`}
              :
            </label>
            <input
              id={`predict-${example.id}`}
              type="text"
              value={state.userPrediction}
              onChange={handlePredictionChange}
              placeholder="Enter your prediction here..."
              className={primmStyles.predictionInput}
              disabled={state.isComplete || isRunningCode} // Disable if complete or running
            />
          </div>
          <button
            onClick={handleRunCodeInternal}
            disabled={!isRunEnabled || state.isComplete} // Disable if criteria not met or block complete
            className={`${styles.runButton} ${primmStyles.runButton}`}
            title={
              !state.userPrediction.trim()
                ? "Enter a prediction to enable Run"
                : isPyodideLoading
                ? "Python loading..."
                : state.isComplete
                ? "Example complete"
                : ""
            }
          >
            {isRunningCode ? "Running..." : "Run"}
          </button>
        </div>
        {/* Show feedback only after run attempted and there was no error */}
        {state.runAttempted && !state.runError && (
          <div className={primmStyles.feedbackArea}>
            {wasPredictionCorrect ? (
              <p className={primmStyles.correctText}>Prediction Correct!</p>
            ) : (
              <p className={primmStyles.incorrectText}>
                Prediction Incorrect. Expected: "{example.expectedPrediction}"
              </p>
            )}
          </div>
        )}

        {/* 4. Conditional Explanation Box */}
        {showExplanation && (
          <div
            className={`${primmStyles.stage} ${primmStyles.explanationStage}`}
          >
            <h5>Explain the Discrepancy</h5>
            <p>{example.explanationPrompt}</p>
            <textarea
              value={state.explanationText}
              onChange={handleExplanationChange}
              placeholder={`Explain why the output was different... (min ${example.minExplanationLength} chars)`}
              className={primmStyles.explanationTextarea}
              rows={3}
              // Disable textarea only once the requirement is met *for this explanation box*
              disabled={state.hasMetExplanationRequirement}
            />
            {/* Provide feedback on explanation length / met requirement */}
            {!state.hasMetExplanationRequirement &&
              state.explanationText.length > 0 && (
                <p className={primmStyles.lengthHint}>
                  {Math.max(
                    0,
                    example.minExplanationLength - state.explanationText.length
                  )}{" "}
                  more characters needed.
                </p>
              )}
            {state.hasMetExplanationRequirement &&
              state.explanationText.length > 0 && (
                <p className={primmStyles.correctText}>
                  Explanation requirement met!
                </p>
              )}
          </div>
        )}
      </div>
    );
  }
);

// ... (Rest of PRIMMSection component remains the same) ...
interface PRIMMSectionProps {
  section: PRIMMSectionData;
  lessonId: string;
}

const PRIMMSection: React.FC<PRIMMSectionProps> = ({ section, lessonId }) => {
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const storageKey = `primmState_${lessonId}_${section.id}`;

  const initialHookState = useMemo((): SavedPRIMMSectionState => {
    const exampleStates: SavedPRIMMSectionState["exampleStates"] = {};
    section.examples.forEach((ex) => {
      exampleStates[ex.id] = {
        userPrediction: "",
        explanationText: "",
        hasMetExplanationRequirement: false,
        output: null,
        runError: null,
        runAttempted: false,
        isComplete: false,
      };
    });
    return { exampleStates };
  }, [section.examples]);

  const checkPRIMMCompletion = useCallback(
    (currentHookState: SavedPRIMMSectionState): boolean => {
      if (!section.examples || section.examples.length === 0) return true;
      return section.examples.every((ex) => {
        const exState = currentHookState.exampleStates[ex.id];
        return exState?.isComplete === true;
      });
    },
    [section.examples]
  );

  const [primmSectionState, setPRIMMSectionState, isSectionComplete] =
    useSectionProgress<SavedPRIMMSectionState>(
      lessonId,
      section.id,
      storageKey,
      initialHookState,
      checkPRIMMCompletion
    );

  const handleExampleStateChange = useCallback(
    (exampleId: string, newState: Partial<PRIMMExampleState>) => {
      setPRIMMSectionState((prevGlobalState) => {
        const currentExampleState =
          prevGlobalState.exampleStates[exampleId] ||
          initialHookState.exampleStates[exampleId];
        const updatedExampleStates = {
          ...prevGlobalState.exampleStates,
          [exampleId]: {
            ...currentExampleState,
            ...newState,
          },
        };
        return { exampleStates: updatedExampleStates };
      });
    },
    [setPRIMMSectionState, initialHookState]
  );

  const handleRunCodeForExample = useCallback(
    async (code: string) => {
      if (isPyodideLoading || pyodideError) {
        return {
          output: "",
          error: `Python environment not ready (${
            pyodideError?.message || "loading"
          })`,
        };
      }
      return runPythonCode(code);
    },
    [runPythonCode, isPyodideLoading, pyodideError]
  );

  return (
    <section
      id={section.id}
      className={`${styles.section} ${primmStyles.primmSectionContainer}`}
    >
      <h2 className={styles.title}>{section.title}</h2>
      <div className={`${styles.content} ${primmStyles.introduction}`}>
        {section.introduction}
      </div>

      {section.examples.map((example) => {
        const currentExampleState =
          primmSectionState.exampleStates[example.id] ||
          initialHookState.exampleStates[example.id];
        return (
          <PRIMMExampleBlock
            key={example.id}
            example={example}
            state={currentExampleState}
            onStateChange={(newState) =>
              handleExampleStateChange(example.id, newState)
            }
            onRunCode={() => handleRunCodeForExample(example.code)}
            isPyodideLoading={isPyodideLoading}
            pyodideError={pyodideError}
          />
        );
      })}

      {isSectionComplete && section.conclusion && (
        <div
          className={`${styles.completionMessage} ${primmStyles.conclusion}`}
        >
          {section.conclusion}
        </div>
      )}
    </section>
  );
};

export default PRIMMSection;
