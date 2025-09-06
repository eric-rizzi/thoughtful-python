import { useState, useCallback } from "react";
import { usePyodide } from "../contexts/PyodideContext";
import type { UnitId, LessonId, SectionId } from "../types/data";
import { useProgressStore, useProgressActions } from "../stores/progressStore";

// Define the props the hook will accept
interface UseInteractiveExampleProps {
  unitId: UnitId;
  lessonId: LessonId;
  sectionId: SectionId;
  autoComplete?: boolean;
}

export const useInteractiveExample = ({
  unitId,
  lessonId,
  sectionId,
  autoComplete = true,
}: UseInteractiveExampleProps) => {
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const [output, setOutput] = useState<string>(""); // Changed from string | null
  const { completeSection } = useProgressActions();

  const runCode = useCallback(
    async (code: string) => {
      setOutput(""); // Reset to empty string instead of null
      const result = await runPythonCode(code);
      const resultOutput = result.output || result.error || "";
      setOutput(resultOutput);

      // On a successful run (even with a Python error), mark the section as complete.
      if (result && autoComplete) {
        completeSection(unitId, lessonId, sectionId);
      }

      // Return the result to satisfy the component's prop type
      return { output: resultOutput, error: result.error };
    },
    [runPythonCode, completeSection, unitId, lessonId, sectionId]
  );

  const isSectionComplete = useProgressStore(
    (state) => state.completion[unitId]?.[lessonId]?.[sectionId] || false
  );

  return {
    runCode,
    isLoading: isPyodideLoading,
    output,
    error: pyodideError,
    isSectionComplete,
  };
};
