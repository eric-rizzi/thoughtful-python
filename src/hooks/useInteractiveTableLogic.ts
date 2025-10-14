import { useState, useCallback, useMemo } from "react";
import type {
  UnitId,
  LessonId,
  SectionId,
  InputParam,
  CoverageTableRow,
  PredictionTableRow,
  SavedCoverageState,
  SavedPredictionState,
  TestMode,
} from "../types/data";
import { usePyodide } from "../contexts/PyodideContext";
// useSectionProgress is no longer needed

type SectionMode = "coverage" | "prediction";

interface UseInteractiveTableLogicProps {
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
  mode: SectionMode;
  testMode: TestMode;
  functionCode: string;
  functionToTest: string;
  columns: InputParam[];
  rows: (CoverageTableRow | PredictionTableRow)[];
}

type TableState = SavedCoverageState | SavedPredictionState;

export const useInteractiveTableLogic = ({
  unitId,
  lessonId,
  sectionId,
  mode,
  testMode,
  functionCode,
  functionToTest,
  columns,
  rows,
}: UseInteractiveTableLogicProps) => {
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();

  const initialState = useMemo((): TableState => {
    if (mode === "coverage") {
      const initialChallengeStates: SavedCoverageState["challengeStates"] = {};
      rows.forEach((_, rowIndex) => {
        const initialInputs: { [paramName: string]: string } = {};
        columns.forEach((param) => {
          initialInputs[param.variableName] = "";
        });
        initialChallengeStates[rowIndex] = {
          inputs: initialInputs,
          actualOutput: null,
          isCorrect: null,
        };
      });
      return { challengeStates: initialChallengeStates };
    } else {
      const initialPredictions: SavedPredictionState["predictions"] = {};
      rows.forEach((_, rowIndex) => {
        initialPredictions[rowIndex] = {
          userAnswer: "",
          actualOutput: null,
          isCorrect: null,
        };
      });
      return { predictions: initialPredictions };
    }
  }, [rows, columns, mode]);

  // Replace useSectionProgress with a simple useState
  const [state, setState] = useState<TableState>(initialState);
  const [runningStates, setRunningStates] = useState<{
    [rowIndex: number]: boolean;
  }>({});

  const runRow = useCallback(
    async (rowIndex: number) => {
      setRunningStates((prev) => ({ ...prev, [rowIndex]: true }));

      const row = rows[rowIndex];
      let inputs: any[];
      let userValue: string;

      if (mode === "coverage") {
        const challengeState = (state as SavedCoverageState).challengeStates?.[
          rowIndex
        ];
        inputs = columns.map((col) => {
          const rawValue = challengeState?.inputs?.[col.variableName] || "";
          if (col.variableType === "number") return parseFloat(rawValue) || 0;
          return rawValue;
        });
        userValue = (row as CoverageTableRow).expectedOutput;
      } else {
        inputs = (row as PredictionTableRow).inputs;
        userValue =
          (state as SavedPredictionState).predictions?.[rowIndex]?.userAnswer ??
          "";
      }

      let actualOutput: string | null = null;
      let isCorrect = false;

      try {
        const functionCall = `${functionToTest}(${inputs
          .map((val) => JSON.stringify(val))
          .join(", ")})`;

        let script: string;
        if (testMode === "function") {
          // Functions return values - need to print them to capture output
          script = `${functionCode}\n\nprint(${functionCall})`;
        } else {
          // Procedures print internally - just call them
          script = `${functionCode}\n\n${functionCall}`;
        }

        const result = await runPythonCode(script);
        actualOutput = result.error
          ? `Error: ${result.error}`
          : (result.output?.trim() ?? "None");
        isCorrect = !result.error && actualOutput === userValue.trim();
      } catch (err) {
        actualOutput =
          err instanceof Error
            ? `Error: ${err.message}`
            : `Error: ${String(err)}`;
        isCorrect = false;
      } finally {
        setState((prev) => {
          if (mode === "coverage") {
            const prevStates =
              (prev as SavedCoverageState)?.challengeStates || {};
            return {
              ...prev,
              challengeStates: {
                ...prevStates,
                [rowIndex]: {
                  ...prevStates[rowIndex],
                  actualOutput,
                  isCorrect,
                },
              },
            };
          } else {
            const prevPreds = (prev as SavedPredictionState)?.predictions || {};
            return {
              ...prev,
              predictions: {
                ...prevPreds,
                [rowIndex]: { ...prevPreds[rowIndex], actualOutput, isCorrect },
              },
            };
          }
        });
        setRunningStates((prev) => ({ ...prev, [rowIndex]: false }));
      }
    },
    [
      rows,
      mode,
      state,
      testMode,
      functionToTest,
      functionCode,
      runPythonCode,
      setState,
      columns,
    ]
  );

  const handleUserInputChange = useCallback(
    (rowIndex: number, value: string, paramName?: string) => {
      setState((prevState) => {
        const currentState = prevState || initialState;

        if (mode === "coverage" && paramName) {
          const prevCoverageState = currentState as SavedCoverageState;
          const existingStates = prevCoverageState.challengeStates || {};
          const currentRow =
            existingStates[rowIndex] ||
            (initialState as SavedCoverageState).challengeStates[rowIndex];

          return {
            ...prevCoverageState,
            challengeStates: {
              ...existingStates,
              [rowIndex]: {
                ...currentRow,
                inputs: {
                  ...(currentRow.inputs || {}),
                  [paramName]: value,
                },
                actualOutput: null,
                isCorrect: null,
              },
            },
          };
        }

        if (mode === "prediction") {
          const prevPredictionState = currentState as SavedPredictionState;
          const existingPreds = prevPredictionState.predictions || {};
          const currentPred =
            existingPreds[rowIndex] ||
            (initialState as SavedPredictionState).predictions[rowIndex];

          return {
            ...prevPredictionState,
            predictions: {
              ...existingPreds,
              [rowIndex]: {
                ...currentPred,
                userAnswer: value,
                actualOutput: null,
                isCorrect: null,
              },
            },
          };
        }

        return currentState;
      });
    },
    [mode, setState, initialState]
  );

  return {
    savedState: state, // Renamed for consistency in consuming components
    runningStates,
    isLoading: isPyodideLoading,
    pyodideError,
    handleUserInputChange,
    runRow,
  };
};
