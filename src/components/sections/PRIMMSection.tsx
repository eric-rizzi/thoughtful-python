// src/components/sections/PRIMMSection.tsx
import React, { useState, useCallback, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type {
  PRIMMSectionData,
  PRIMMCodeExample,
  EnhancedPRIMMExampleUserState,
  SavedEnhancedPRIMMSectionState,
  AssessmentLevel,
  LessonId,
  UnitId,
} from "../../types/data";
import type { PrimmEvaluationRequest } from "../../types/apiServiceTypes";

import styles from "./Section.module.css"; // General section styles
import primmStyles from "./PRIMMSection.module.css"; // Specific PRIMM styles

import CodeEditor from "../CodeEditor";
import { usePyodide } from "../../contexts/PyodideContext";
import { useSectionProgress } from "../../hooks/useSectionProgress";
import { useAuthStore } from "../../stores/authStore";
import * as apiService from "../../lib/apiService";
import { ApiError } from "../../lib/apiService";
import { API_GATEWAY_BASE_URL } from "../../config";

const CONFIDENCE_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "Not Confident" },
  { value: 2, label: "Somewhat Confident" },
  { value: 3, label: "Very Confident" },
];

interface PRIMMSectionProps {
  section: PRIMMSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}

const PRIMMSection: React.FC<PRIMMSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const { isAuthenticated } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;

  const currentExample: PRIMMCodeExample | undefined = section.examples[0];
  const storageKey = `primmProgressiveFill_${unitId}_${lessonId}_${
    section.id
  }_${currentExample?.id || "default"}`;

  const initialSingleExampleState: EnhancedPRIMMExampleUserState = useMemo(
    () => ({
      userEnglishPrediction: "",
      userPredictionConfidence: 0,
      isPredictionLocked: false,
      actualPyodideOutput: null,
      keyOutputSnippet: null,
      userExplanationText: "",
      aiEvaluationResult: null,
      currentUiStep: "PREDICT",
      isComplete: false,
    }),
    []
  );

  const getInitialSectionState = useCallback(
    (): SavedEnhancedPRIMMSectionState => ({
      exampleStates: currentExample
        ? { [currentExample.id]: initialSingleExampleState }
        : {},
    }),
    [currentExample, initialSingleExampleState]
  );

  const checkPRIMMCompletion = useCallback(
    (currentHookState: SavedEnhancedPRIMMSectionState): boolean => {
      if (!currentExample) return true; // Or false, depending on desired behavior for empty sections
      return (
        currentHookState.exampleStates[currentExample.id]?.isComplete === true
      );
    },
    [currentExample]
  );

  const [savedSectionState, setSavedSectionState, isSectionOverallComplete] =
    useSectionProgress<SavedEnhancedPRIMMSectionState>(
      unitId,
      lessonId,
      section.id,
      storageKey,
      getInitialSectionState(),
      checkPRIMMCompletion
    );

  const [currentExampleUserState, setCurrentExampleUserState] =
    useState<EnhancedPRIMMExampleUserState>(
      () =>
        (currentExample &&
          savedSectionState.exampleStates[currentExample.id]) ||
        initialSingleExampleState
    );

  useEffect(() => {
    if (currentExample) {
      const persistedState = savedSectionState.exampleStates[currentExample.id];
      if (
        persistedState &&
        JSON.stringify(persistedState) !==
          JSON.stringify(currentExampleUserState)
      ) {
        setCurrentExampleUserState(persistedState);
      } else if (
        !persistedState &&
        JSON.stringify(initialSingleExampleState) !==
          JSON.stringify(currentExampleUserState)
      ) {
        setCurrentExampleUserState(initialSingleExampleState);
      }
    }
  }, [
    savedSectionState,
    currentExample,
    initialSingleExampleState,
    currentExampleUserState,
  ]);

  const updatePersistedExampleState = useCallback(
    (newStatePartial: Partial<EnhancedPRIMMExampleUserState>) => {
      if (!currentExample) return;
      setCurrentExampleUserState((prevState) => {
        const fullyUpdatedState = { ...prevState, ...newStatePartial };
        setSavedSectionState((prevOverall) => ({
          ...prevOverall,
          exampleStates: {
            ...prevOverall.exampleStates,
            [currentExample.id]: fullyUpdatedState,
          },
        }));
        return fullyUpdatedState;
      });
    },
    [currentExample, setSavedSectionState]
  );

  const [isLoadingAiFeedback, setIsLoadingAiFeedback] = useState(false);
  const [submitActionError, setSubmitActionError] = useState<string | null>(
    null
  );

  const extractKeyOutput = (fullOutput: string | null): string | null => {
    if (!fullOutput || typeof fullOutput !== "string")
      return "(No output or error during run)";
    const lines = fullOutput.trim().split("\n");
    return lines.length > 0
      ? lines.join("\n")
      : "(No distinct last line of output)";
  };

  const handleRunCode = async () => {
    if (!currentExample || isPyodideLoading || pyodideError) return;
    updatePersistedExampleState({
      actualPyodideOutput: "Running...",
      keyOutputSnippet: "Running...",
    });
    const result = await runPythonCode(currentExample.code);
    const fullOutput = result.error
      ? `Pyodide Execution Error: ${result.error}`
      : result.output || "Code executed (no output).";
    const keyOutput = extractKeyOutput(fullOutput);

    updatePersistedExampleState({
      actualPyodideOutput: fullOutput,
      keyOutputSnippet: keyOutput,
      isPredictionLocked: true,
      currentUiStep: "EXPLAIN_AFTER_RUN",
    });
  };

  const handleActionApiError = (err: unknown, defaultMessage: string) => {
    if (err instanceof ApiError) {
      const serverMessage =
        typeof err.data?.message === "string" ? err.data.message : err.message;
      setSubmitActionError(
        `${serverMessage}${
          err.status === 429 ? "" : ` (Status: ${err.status})`
        }`
      );
    } else if (err instanceof Error) {
      setSubmitActionError(`${defaultMessage}: ${err.message}`);
    } else {
      setSubmitActionError(`${defaultMessage}: An unknown error occurred.`);
    }
  };

  const handleGetAIFeedback = async () => {
    if (!currentExample || !isAuthenticated || !apiGatewayUrl) {
      setSubmitActionError("Authentication or configuration error.");
      return;
    }
    if (currentExampleUserState.userExplanationText.length < 2) {
      alert(`Please provide a more detailed explanation.`);
      return;
    }

    setIsLoadingAiFeedback(true);
    setSubmitActionError(null);

    const payload: PrimmEvaluationRequest = {
      lessonId,
      sectionId: section.id,
      primmExampleId: currentExample.id,
      codeSnippet: currentExample.code,
      userPredictionPromptText: currentExample.predictPrompt,
      userPredictionText: currentExampleUserState.userEnglishPrediction,
      userPredictionConfidence:
        currentExampleUserState.userPredictionConfidence,
      actualOutputSummary: currentExampleUserState.keyOutputSnippet,
      userExplanationText: currentExampleUserState.userExplanationText,
    };

    try {
      const aiResponse = await apiService.submitPrimmEvaluation(
        apiGatewayUrl,
        payload
      );

      updatePersistedExampleState({
        aiEvaluationResult: aiResponse,
        currentUiStep: "VIEW_AI_FEEDBACK",
        isComplete: true,
      });
    } catch (err) {
      console.error("Error getting AI feedback via apiService:", err);
      handleActionApiError(err, "Failed to get AI evaluation");
    } finally {
      setIsLoadingAiFeedback(false);
    }
  };

  if (!currentExample) {
    return (
      <div className={styles.interactivePlaceholder}>
        No PRIMM example data configured for this section.
      </div>
    );
  }

  const isPredictionInputValid =
    currentExampleUserState.userEnglishPrediction.length >= 1 &&
    currentExampleUserState.userPredictionConfidence > 0;
  const isExplanationInputValid =
    currentExampleUserState.userExplanationText.length >= 1;

  const getAssessmentLabelClass = (
    assessment?: AssessmentLevel | null
  ): string => {
    if (!assessment) return "";
    return (
      primmStyles[
        `assessment${assessment.charAt(0).toUpperCase() + assessment.slice(1)}`
      ] || ""
    );
  };

  const showPastAnswersDiv =
    currentExampleUserState.isPredictionLocked ||
    currentExampleUserState.currentUiStep === "VIEW_AI_FEEDBACK";

  return (
    <section
      id={section.id}
      className={`${styles.section} ${primmStyles.primmSectionContainer}`}
    >
      <h2 className={styles.title}>{section.title}</h2>
      <div className={`${styles.content} ${primmStyles.introduction}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>

      <div className={primmStyles.exampleBlock} key={currentExample.id}>
        <h4>Code to Analyze:</h4>
        <CodeEditor
          value={currentExample.code}
          onChange={() => {}}
          readOnly={true}
          height="auto"
          minHeight="80px"
        />

        {/* --- "Past Answers / Information" Div --- */}
        <div
          className={`${primmStyles.pastAnswersDiv} ${
            !showPastAnswersDiv ? primmStyles.pastAnswersDiv_hidden : ""
          }`}
        >
          {currentExampleUserState.isPredictionLocked && (
            <div className={primmStyles.infoEntry}>
              <span className={primmStyles.infoLabel}>
                Prediction:
                {currentExampleUserState.currentUiStep === "VIEW_AI_FEEDBACK" &&
                  currentExampleUserState.aiEvaluationResult
                    ?.aiPredictionAssessment && (
                    <span
                      className={`${
                        primmStyles.assessmentLabel
                      } ${getAssessmentLabelClass(
                        currentExampleUserState.aiEvaluationResult
                          .aiPredictionAssessment
                      )}`}
                    >
                      {currentExampleUserState.aiEvaluationResult.aiPredictionAssessment.toUpperCase()}
                    </span>
                  )}
              </span>
              <span className={primmStyles.infoText}>
                {currentExampleUserState.userEnglishPrediction ||
                  "(No prediction was entered)"}
              </span>
            </div>
          )}

          {currentExampleUserState.isPredictionLocked &&
            currentExampleUserState.userPredictionConfidence > 0 && (
              <div className={primmStyles.infoEntry}>
                <span className={primmStyles.infoLabel}>Confidence:</span>
                <span className={primmStyles.infoText}>
                  {CONFIDENCE_OPTIONS.find(
                    (c) =>
                      c.value ===
                      currentExampleUserState.userPredictionConfidence
                  )?.label || "Not Set"}
                </span>
              </div>
            )}

          {(currentExampleUserState.currentUiStep === "EXPLAIN_AFTER_RUN" ||
            currentExampleUserState.currentUiStep === "VIEW_AI_FEEDBACK") &&
            currentExampleUserState.keyOutputSnippet !== null && (
              <div className={primmStyles.infoEntry}>
                <span className={primmStyles.infoLabel}>Key Output:</span>
                <span
                  className={primmStyles.keyOutputText}
                  style={{ width: "100%", boxSizing: "border-box" }}
                >
                  {currentExampleUserState.keyOutputSnippet}
                </span>
              </div>
            )}

          {currentExampleUserState.currentUiStep === "VIEW_AI_FEEDBACK" && (
            <div className={primmStyles.infoEntry}>
              <span className={primmStyles.infoLabel}>
                Reflection:
                {currentExampleUserState.aiEvaluationResult
                  ?.aiExplanationAssessment && (
                  <span
                    className={`${
                      primmStyles.assessmentLabel
                    } ${getAssessmentLabelClass(
                      currentExampleUserState.aiEvaluationResult
                        .aiExplanationAssessment
                    )}`}
                  >
                    {currentExampleUserState.aiEvaluationResult.aiExplanationAssessment.toUpperCase()}
                  </span>
                )}
              </span>
              <span className={primmStyles.infoText}>
                {currentExampleUserState.userExplanationText ||
                  "(No explanation was entered)"}
              </span>
            </div>
          )}

          {currentExampleUserState.currentUiStep === "VIEW_AI_FEEDBACK" &&
            currentExampleUserState.aiEvaluationResult?.aiOverallComment && (
              <div className={primmStyles.infoEntry}>
                <span className={primmStyles.infoLabel}>
                  AI Overall Comments:
                </span>
                <p className={primmStyles.aiCommentText}>
                  {currentExampleUserState.aiEvaluationResult.aiOverallComment}
                </p>
              </div>
            )}
        </div>

        {/* --- "Next Question to Answer" Div --- */}
        <div
          className={`${primmStyles.nextQuestionDiv} ${
            showPastAnswersDiv ? "" : primmStyles.nextQuestionDiv_noContentAbove
          }`}
        >
          {currentExampleUserState.currentUiStep === "PREDICT" && (
            <div className={primmStyles.inputGroup}>
              <label
                htmlFor={`predict-english-${currentExample.id}`}
                className={primmStyles.inputLabel}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentExample.predictPrompt}
                </ReactMarkdown>{" "}
              </label>
              <textarea
                id={`predict-english-${currentExample.id}`}
                value={currentExampleUserState.userEnglishPrediction}
                onChange={(e) =>
                  updatePersistedExampleState({
                    userEnglishPrediction: e.target.value,
                  })
                }
                placeholder="In your own words, what will this code do?"
                className={primmStyles.predictionTextarea}
                rows={3}
                disabled={isLoadingAiFeedback} // Disable while AI is processing
              />
              <div
                className={primmStyles.inputGroup}
                style={{ marginTop: "0.75rem" }}
              >
                <label
                  className={primmStyles.inputLabel}
                  style={{ marginBottom: "0.25rem" }}
                >
                  Your Confidence:
                </label>
                <div className={primmStyles.confidenceSelectContainer}>
                  {CONFIDENCE_OPTIONS.map((opt) => (
                    <label key={opt.value}>
                      <input
                        type="radio"
                        name={`confidence-${currentExample.id}`}
                        value={opt.value}
                        checked={
                          currentExampleUserState.userPredictionConfidence ===
                          opt.value
                        }
                        onChange={() =>
                          updatePersistedExampleState({
                            userPredictionConfidence: opt.value,
                          })
                        }
                        disabled={currentExampleUserState.isPredictionLocked} // Keep disabled if locked
                      />{" "}
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={handleRunCode}
                disabled={
                  !isPredictionInputValid ||
                  isPyodideLoading ||
                  currentExampleUserState.isPredictionLocked
                }
                className={primmStyles.primmButton}
              >
                {isPyodideLoading ? "Python Loading..." : "Run Code"}
              </button>
              {pyodideError && (
                <p style={{ color: "red", marginTop: "0.5rem" }}>
                  Pyodide Error: {pyodideError.message}
                </p>
              )}
            </div>
          )}

          {currentExampleUserState.currentUiStep === "EXPLAIN_AFTER_RUN" && (
            <div className={primmStyles.inputGroup}>
              <label
                htmlFor={`explanation-${currentExample.id}`}
                className={primmStyles.inputLabel}
              >
                Your Reflection/Explanation:
              </label>
              <textarea
                id={`explanation-${currentExample.id}`}
                value={currentExampleUserState.userExplanationText}
                onChange={(e) =>
                  updatePersistedExampleState({
                    userExplanationText: e.target.value,
                  })
                }
                placeholder="Explain the code's behavior and your initial prediction..."
                className={primmStyles.explanationTextarea}
                rows={4}
                disabled={isLoadingAiFeedback} // Disable while AI is processing
              />
              <button
                onClick={handleGetAIFeedback}
                disabled={
                  !isExplanationInputValid ||
                  isLoadingAiFeedback ||
                  !isAuthenticated
                }
                className={primmStyles.getFeedbackButton}
                title={
                  !isAuthenticated
                    ? "Please log in to get AI feedback"
                    : !isExplanationInputValid
                    ? "Complete your explanation"
                    : "Get AI Feedback"
                }
              >
                {isLoadingAiFeedback
                  ? "Getting Feedback..."
                  : !isAuthenticated
                  ? "Please log in to Get AI Feedback"
                  : "Get AI Feedback"}
              </button>
            </div>
          )}

          {currentExampleUserState.currentUiStep === "VIEW_AI_FEEDBACK" &&
            isSectionOverallComplete && ( // Show completion message in this step too
              <p
                style={{
                  color: "green",
                  fontWeight: "bold",
                  marginTop: "1rem",
                  textAlign: "center",
                }}
              >
                {section.conclusion || "This PRIMM activity is complete!"}
              </p>
            )}
          {submitActionError && (
            <p
              className={styles.apiError} // Using global apiError style for consistency
              style={{ color: "red", marginTop: "1rem" }}
            >
              {submitActionError}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default PRIMMSection;
