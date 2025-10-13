import { useState, useCallback, useMemo } from "react";
import type {
  UnitId,
  LessonId,
  SectionId,
  PredictionTableRow,
  SavedPredictionState,
} from "../types/data";
import { usePyodide } from "../contexts/PyodideContext";
import { useSectionProgress } from "./useSectionProgress";

interface UsePredictionLogicProps {
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
  functionCode: string;
  predictionRows: PredictionTableRow[];
}

export const usePredictionLogic = ({
  unitId,
  lessonId,
  sectionId,
  functionCode,
  predictionRows,
}: UsePredictionLogicProps) => {
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const storageKey = `predictionState_${unitId}_${lessonId}_${sectionId}`;

  const checkCompletion = useCallback(
    (state: SavedPredictionState): boolean => {
      if (predictionRows.length === 0) return false;
      return predictionRows.every(
        (_, index) => state.predictions[index]?.isCorrect === true
      );
    },
    [predictionRows]
  );

  const [savedState, setSavedState, isSectionComplete] =
    useSectionProgress<SavedPredictionState>(
      unitId,
      lessonId,
      sectionId,
      storageKey,
      { predictions: {} },
      checkCompletion
    );

  const [runningStates, setRunningStates] = useState<{
    [rowIndex: number]: boolean;
  }>({});

  const handlePredictionChange = useCallback(
    (rowIndex: number, newValue: string) => {
      setSavedState((prev) => ({
        ...prev,
        predictions: {
          ...prev.predictions,
          [rowIndex]: {
            ...(prev.predictions[rowIndex] || {
              isCorrect: null,
              actualOutput: null,
            }),
            userAnswer: newValue,
            isCorrect: null, // Reset correctness on change
            actualOutput: null,
          },
        },
      }));
    },
    [setSavedState]
  );

  const runPrediction = useCallback(
    async (rowIndex: number) => {
      setRunningStates((prev) => ({ ...prev, [rowIndex]: true }));
      const row = predictionRows[rowIndex];
      const userPrediction = savedState.predictions[rowIndex]?.userAnswer ?? "";

      let actualOutput: string | null = null;
      let isCorrect = false;

      try {
        const functionNameMatch = functionCode.match(/def\s+(\w+)/);
        if (!functionNameMatch)
          throw new Error("Could not parse function name.");
        const functionName = functionNameMatch[1];

        const functionCall = `${functionName}(${row.inputs
          .map((val) => JSON.stringify(val))
          .join(", ")})`;
        const script = `${functionCode}\n\nprint(${functionCall})`;

        const result = await runPythonCode(script);
        actualOutput = result.error
          ? `Error: ${result.error}`
          : (result.output?.trim() ?? "None");
        isCorrect = !result.error && actualOutput === userPrediction.trim();
      } catch (err) {
        actualOutput =
          err instanceof Error
            ? `Error: ${err.message}`
            : `Error: ${String(err)}`;
        isCorrect = false;
      } finally {
        setSavedState((prev) => ({
          ...prev,
          predictions: {
            ...prev.predictions,
            [rowIndex]: {
              ...prev.predictions[rowIndex],
              isCorrect,
              actualOutput,
            },
          },
        }));
        setRunningStates((prev) => ({ ...prev, [rowIndex]: false }));
      }
    },
    [
      predictionRows,
      savedState.predictions,
      functionCode,
      runPythonCode,
      setSavedState,
    ]
  );

  return {
    predictions: savedState.predictions,
    isSectionComplete,
    runningStates,
    isLoading: isPyodideLoading,
    pyodideError,
    handlePredictionChange,
    runPrediction,
  };
};
