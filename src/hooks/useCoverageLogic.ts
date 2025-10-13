import { useState, useMemo, useCallback } from "react";
import type {
  UnitId,
  LessonId,
  SectionId,
  CoverageChallenge,
  InputParam,
  SavedCoverageState,
} from "../types/data";
import { usePyodide } from "../contexts/PyodideContext";
import { useSectionProgress } from "./useSectionProgress";

interface UseCoverageLogicProps {
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
  codeToRun: string;
  inputParams: InputParam[];
  coverageChallenges: CoverageChallenge[];
}

export const useCoverageLogic = ({
  unitId,
  lessonId,
  sectionId,
  codeToRun,
  inputParams,
  coverageChallenges,
}: UseCoverageLogicProps) => {
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const storageKey = `coverageState_${unitId}_${lessonId}_${sectionId}`;

  const initialHookState = useMemo((): SavedCoverageState => {
    const initialChallengeStates: SavedCoverageState["challengeStates"] = {};
    coverageChallenges.forEach((challenge) => {
      const initialInputs: { [paramName: string]: string } = {};
      inputParams.forEach((param) => {
        initialInputs[param.name] = "";
      });
      initialChallengeStates[challenge.id] = {
        inputs: initialInputs,
        actualOutput: null,
        isCorrect: null,
      };
    });
    return { challengeStates: initialChallengeStates };
  }, [coverageChallenges, inputParams]);

  const checkCompletion = useCallback(
    (state: SavedCoverageState): boolean => {
      if (coverageChallenges.length === 0) return false;
      return coverageChallenges.every(
        (challenge) => state.challengeStates[challenge.id]?.isCorrect === true
      );
    },
    [coverageChallenges]
  );

  const [savedState, setSavedState, isSectionComplete] =
    useSectionProgress<SavedCoverageState>(
      unitId,
      lessonId,
      sectionId,
      storageKey,
      initialHookState,
      checkCompletion
    );

  const [runningStates, setRunningStates] = useState<{ [id: string]: boolean }>(
    {}
  );

  const handleInputChange = useCallback(
    (challengeId: string, paramName: string, value: string) => {
      setSavedState((prev) => ({
        ...prev,
        challengeStates: {
          ...prev.challengeStates,
          [challengeId]: {
            ...(prev.challengeStates[challengeId] ||
              initialHookState.challengeStates[challengeId]),
            inputs: {
              ...prev.challengeStates[challengeId].inputs,
              [paramName]: value,
            },
            actualOutput: null,
            isCorrect: null,
          },
        },
      }));
    },
    [setSavedState, initialHookState]
  );

  const runChallenge = useCallback(
    async (challenge: CoverageChallenge) => {
      setRunningStates((prev) => ({ ...prev, [challenge.id]: true }));

      const currentInputs = savedState.challengeStates[challenge.id].inputs;
      let outputText: string | null = null;
      let isCorrect = false;

      try {
        const assignments = inputParams
          .map((param) => {
            const rawValue = currentInputs[param.name] || "";
            let pyValue: string;
            if (param.type === "number") {
              const num = parseFloat(rawValue);
              pyValue = isNaN(num) ? "None" : String(num);
            } else {
              const escapedValue = rawValue
                .replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"');
              pyValue = `"${escapedValue}"`;
            }
            return `${param.name} = ${pyValue}`;
          })
          .join("\n");

        const pythonCode = `${assignments}\n\n${codeToRun}`;
        const result = await runPythonCode(pythonCode);

        outputText = result.error
          ? `Error: ${result.error}`
          : (result.output?.trim() ?? "");
        isCorrect =
          !result.error && outputText === challenge.expectedOutput.trim();
      } catch (err) {
        outputText =
          err instanceof Error
            ? `Error: ${err.message}`
            : `Error: ${String(err)}`;
        isCorrect = false;
      } finally {
        setSavedState((prev) => ({
          ...prev,
          challengeStates: {
            ...prev.challengeStates,
            [challenge.id]: {
              ...prev.challengeStates[challenge.id],
              actualOutput: outputText,
              isCorrect,
            },
          },
        }));
        setRunningStates((prev) => ({ ...prev, [challenge.id]: false }));
      }
    },
    [
      savedState.challengeStates,
      inputParams,
      codeToRun,
      runPythonCode,
      setSavedState,
    ]
  );

  return {
    challengeStates: savedState.challengeStates,
    isSectionComplete,
    runningStates,
    isLoading: isPyodideLoading,
    pyodideError,
    handleInputChange,
    runChallenge,
  };
};
