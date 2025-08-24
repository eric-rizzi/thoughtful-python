import { useState, useCallback, useMemo } from "react";
import type {
  UnitId,
  LessonId,
  SectionId,
  EnhancedPRIMMExampleUserState,
  SavedEnhancedPRIMMSectionState,
} from "../types/data";
import type { PrimmEvaluationRequest } from "../types/apiServiceTypes";
import { useSectionProgress } from "./useSectionProgress";
import { useAuthStore } from "../stores/authStore";
import * as apiService from "../lib/apiService";
import { ApiError } from "../lib/apiService";
import { API_GATEWAY_BASE_URL } from "../config";

interface UseEnhancedPRIMMProps {
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
  exampleId: string;
  predictPrompt: string; // Added this prop
}

// Corrected initial state to include all required properties
const initialSingleExampleState: EnhancedPRIMMExampleUserState = {
  userEnglishPrediction: "",
  isPredictionLocked: false,
  actualPyodideOutput: null,
  keyOutputSnippet: null,
  userExplanationText: "",
  aiEvaluationResult: null,
  currentUiStep: "PREDICT",
  isComplete: false,
};

export const useEnhancedPRIMM = ({
  unitId,
  lessonId,
  sectionId,
  exampleId,
  predictPrompt, // Get the new prop
}: UseEnhancedPRIMMProps) => {
  const { isAuthenticated } = useAuthStore();
  const apiGatewayUrl = API_GATEWAY_BASE_URL;

  const storageKey = `primmEnhanced_${unitId}_${lessonId}_${sectionId}_${exampleId}`;

  const checkCompletion = useCallback(
    (state: SavedEnhancedPRIMMSectionState): boolean => {
      return state.exampleStates[exampleId]?.isComplete === true;
    },
    [exampleId]
  );

  const [savedState, setSavedState, isSectionComplete] =
    useSectionProgress<SavedEnhancedPRIMMSectionState>(
      unitId,
      lessonId,
      sectionId,
      storageKey,
      { exampleStates: { [exampleId]: initialSingleExampleState } },
      checkCompletion
    );

  const state = useMemo(
    () => savedState.exampleStates[exampleId] || initialSingleExampleState,
    [savedState, exampleId]
  );

  const [isLoadingAiFeedback, setIsLoadingAiFeedback] = useState(false);
  const [aiFeedbackError, setAiFeedbackError] = useState<string | null>(null);

  const updateState = useCallback(
    (newState: Partial<EnhancedPRIMMExampleUserState>) => {
      setSavedState((prev) => ({
        ...prev,
        exampleStates: {
          ...prev.exampleStates,
          [exampleId]: {
            ...(prev.exampleStates[exampleId] || initialSingleExampleState),
            ...newState,
          },
        },
      }));
    },
    [setSavedState, exampleId]
  );

  const actions = useMemo(
    () => ({
      setUserPrediction: (text: string) => {
        updateState({ userEnglishPrediction: text });
      },
      lockPrediction: () => {
        updateState({ isPredictionLocked: true, currentUiStep: "RUN" });
      },
      setActualOutput: (output: string) => {
        updateState({ actualPyodideOutput: output });
      },
      moveToExplain: () => {
        updateState({ currentUiStep: "EXPLAIN" });
      },
      setUserExplanation: (text: string) => {
        updateState({ userExplanationText: text });
      },
      submitForFeedback: async (codeSnippet: string) => {
        if (!isAuthenticated || !apiGatewayUrl) {
          setAiFeedbackError("Authentication or configuration error.");
          return;
        }
        setIsLoadingAiFeedback(true);
        setAiFeedbackError(null);

        // Corrected payload to include all required fields
        const payload: PrimmEvaluationRequest = {
          lessonId,
          sectionId,
          primmExampleId: exampleId,
          codeSnippet,
          userPredictionPromptText: predictPrompt,
          userPredictionText: state.userEnglishPrediction,
          userPredictionConfidence: 2, // Using a default value as before
          actualOutputSummary: state.actualPyodideOutput,
          userExplanationText: state.userExplanationText,
        };

        try {
          const aiResponse = await apiService.submitPrimmEvaluation(
            apiGatewayUrl,
            payload
          );
          updateState({
            aiEvaluationResult: aiResponse,
            currentUiStep: "VIEW_AI_FEEDBACK",
            isComplete: true,
          });
        } catch (err) {
          const defaultMessage = "Failed to get AI evaluation";
          if (err instanceof ApiError) {
            if (err.status === 429) {
              setAiFeedbackError(
                "You've submitted feedback too frequently. Please wait a moment before trying again."
              );
            } else {
              setAiFeedbackError(err.data.message || err.message);
            }
          } else if (err instanceof Error) {
            setAiFeedbackError(`${defaultMessage}: ${err.message}`);
          } else {
            setAiFeedbackError(`${defaultMessage}: An unknown error occurred.`);
          }
        } finally {
          setIsLoadingAiFeedback(false);
        }
      },
    }),
    [
      updateState,
      isAuthenticated,
      apiGatewayUrl,
      lessonId,
      sectionId,
      exampleId,
      state,
      predictPrompt,
    ]
  );

  return {
    state,
    actions,
    isSectionComplete,
    isLoadingAiFeedback,
    aiFeedbackError,
  };
};
