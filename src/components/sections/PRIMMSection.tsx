// src/components/sections/PRIMMSection.tsx
import React, { useCallback, useMemo } from "react";
import type {
  PRIMMSection as PRIMMSectionData,
  PRIMMCodeExample,
  PRIMMExampleState,
  SavedPRIMMSectionState,
} from "../../types/data";
import styles from "./Section.module.css";
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

const PRIMMExampleBlock: React.FC<PRIMMExampleBlockProps> = ({
  example,
  state,
  onStateChange,
  onRunCode,
  isPyodideLoading,
  pyodideError,
}) => {
  const handlePredictionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStateChange({
      userPrediction: e.target.value,
      predictionSubmitted: false,
      isPredictionCorrect: null,
    });
  };

  const handleSubmitPrediction = () => {
    const correct =
      state.userPrediction.trim().toLowerCase() ===
      example.expectedPrediction.trim().toLowerCase();
    onStateChange({
      isPredictionCorrect: correct,
      predictionSubmitted: true,
      hasMetExplanationRequirement: correct, // If prediction is correct, explanation req is met
    });
  };

  const handleExplanationChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newText = e.target.value;
    onStateChange({
      explanationText: newText,
      hasMetExplanationRequirement:
        newText.length >= example.minExplanationLength,
    });
  };

  const handleRunCodeInternal = async () => {
    onStateChange({ output: "Running..." });
    const result = await onRunCode();
    onStateChange({
      output: result.error
        ? `Error: ${result.error}`
        : result.output || "Code executed (no output).",
      hasBeenRun: true,
    });
  };

  const canProceedAfterPrediction =
    state.predictionSubmitted &&
    (state.isPredictionCorrect || state.hasMetExplanationRequirement);

  return (
    <div
      className={`${styles.exampleBlock} ${
        state.isPredictionCorrect === true
          ? styles.predictionCorrect
          : state.isPredictionCorrect === false
          ? styles.predictionIncorrect
          : ""
      }`}
    >
      <h4>Code Example:</h4>
      <CodeEditor
        value={example.code}
        onChange={() => {}}
        readOnly={true}
        height="auto"
        minHeight="80px"
      />

      {/* --- PREDICT STAGE --- */}
      {!state.predictionSubmitted && (
        <div className={styles.stage}>
          <h5>1. Predict</h5>
          <p>
            {example.predictPrompt}{" "}
            {example.predictionTargetDescription &&
              `(${example.predictionTargetDescription})`}
          </p>
          <input
            type="text"
            value={state.userPrediction}
            onChange={handlePredictionChange}
            placeholder="Your prediction"
            className={styles.predictionInput}
          />
          <button
            onClick={handleSubmitPrediction}
            disabled={!state.userPrediction.trim()}
            className={styles.quizSubmitButton} // Reuse quiz button style
          >
            Submit Prediction
          </button>
        </div>
      )}

      {/* --- FEEDBACK & EXPLANATION STAGE (If prediction submitted) --- */}
      {state.predictionSubmitted && (
        <>
          <div className={styles.feedbackArea}>
            {state.isPredictionCorrect === true && (
              <p className={styles.correctText}>Your prediction was correct!</p>
            )}
            {state.isPredictionCorrect === false && (
              <>
                <p className={styles.incorrectText}>
                  Your prediction was incorrect. The expected answer was: "
                  {example.expectedPrediction}".
                </p>
                <div className={styles.stage}>
                  <h5>Explain the Discrepancy</h5>
                  <p>{example.explanationPrompt}</p>
                  <textarea
                    value={state.explanationText}
                    onChange={handleExplanationChange}
                    placeholder={`Explain why your prediction might have been off... (min ${example.minExplanationLength} chars)`}
                    className={styles.explanationTextarea}
                    rows={3}
                  />
                  {state.explanationText.length > 0 &&
                    state.explanationText.length <
                      example.minExplanationLength && (
                      <p className={styles.lengthHint}>
                        {example.minExplanationLength -
                          state.explanationText.length}{" "}
                        more characters needed.
                      </p>
                    )}
                  {state.hasMetExplanationRequirement &&
                    state.explanationText.length > 0 && (
                      <p className={styles.correctText}>
                        Explanation requirement met!
                      </p>
                    )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* --- RUN STAGE (Enabled after prediction/explanation) --- */}
      {canProceedAfterPrediction && (
        <div className={styles.stage}>
          <h5>2. Run & Observe</h5>
          <button
            onClick={handleRunCodeInternal}
            disabled={
              isPyodideLoading ||
              !!pyodideError ||
              state.output === "Running..."
            }
            className={styles.runButton}
          >
            {state.output === "Running..." ? "Running..." : "Run Code"}
          </button>
          {state.hasBeenRun && state.output && (
            <div className={styles.outputArea}>
              {" "}
              {/* Reuse existing output area style */}
              <pre>{state.output}</pre>
            </div>
          )}
          {isPyodideLoading && <p>Pyodide is loading...</p>}
          {pyodideError && (
            <p className={styles.pyodideError}>
              Pyodide Error: {pyodideError.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

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
        predictionSubmitted: false,
        isPredictionCorrect: null,
        explanationText: "",
        explanationSubmitted: false, // This might not be needed if we rely on hasMetExplanationRequirement
        hasMetExplanationRequirement: false,
        hasBeenRun: false,
        output: null,
      };
    });
    return { exampleStates };
  }, [section.examples]);

  const checkPRIMMCompletion = useCallback(
    (currentHookState: SavedPRIMMSectionState): boolean => {
      if (!section.examples || section.examples.length === 0) return true; // Or false if empty shouldn't complete
      return section.examples.every((ex) => {
        const exState = currentHookState.exampleStates[ex.id];
        if (!exState) return false; // Should not happen if initial state is correct
        const predictionPathComplete =
          exState.predictionSubmitted &&
          (exState.isPredictionCorrect || exState.hasMetExplanationRequirement);
        return predictionPathComplete && exState.hasBeenRun;
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
        const updatedExampleStates = {
          ...prevGlobalState.exampleStates,
          [exampleId]: {
            ...prevGlobalState.exampleStates[exampleId],
            ...newState,
          },
        };
        return { exampleStates: updatedExampleStates };
      });
    },
    [setPRIMMSectionState]
  );

  const handleRunCodeForExample = useCallback(
    async (code: string) => {
      return runPythonCode(code);
    },
    [runPythonCode]
  );

  return (
    <section
      id={section.id}
      className={`${styles.section} ${styles.primmSectionContainer}`}
    >
      <h2 className={styles.title}>{section.title}</h2>
      <div className={`${styles.content} ${styles.introduction}`}>
        {section.introduction}
      </div>

      {section.examples.map((example) => (
        <PRIMMExampleBlock
          key={example.id}
          example={example}
          state={
            primmSectionState.exampleStates[example.id] ||
            initialHookState.exampleStates[example.id]
          }
          onStateChange={(newState) =>
            handleExampleStateChange(example.id, newState)
          }
          onRunCode={() => handleRunCodeForExample(example.code)}
          isPyodideLoading={isPyodideLoading}
          pyodideError={pyodideError}
        />
      ))}

      {isSectionComplete && section.conclusion && (
        <div className={`${styles.completionMessage} ${styles.conclusion}`}>
          {section.conclusion}
        </div>
      )}
    </section>
  );
};

export default PRIMMSection;
