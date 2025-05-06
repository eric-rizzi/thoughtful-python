// src/hooks/useInteractiveExample.ts (NEW FILE)
import { useState, useCallback, useEffect } from "react";
import { usePyodide } from "../contexts/PyodideContext";
import { loadProgress, saveProgress } from "../lib/localStorageUtils"; // If persisting code

interface UseInteractiveExampleProps {
  exampleId: string;
  initialCode: string;
  lessonId: string; // For localStorage key if persisting
  sectionId: string; // For localStorage key if persisting
  persistCode?: boolean; // Flag to enable/disable code persistence
  storageKeyPrefix?: string; // e.g., "observeCode" or "testCode"
}

export const useInteractiveExample = ({
  exampleId,
  initialCode,
  lessonId,
  sectionId,
  persistCode = false,
  storageKeyPrefix = "exampleCode",
}: UseInteractiveExampleProps) => {
  const {
    runPythonCode,
    isLoading: isPyodideLoading,
    error: pyodideError,
  } = usePyodide();
  const [code, setCode] = useState<string>(initialCode);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasBeenRun, setHasBeenRun] = useState<boolean>(false); // From ObservationSection

  const fullStorageKey = persistCode
    ? `${storageKeyPrefix}_${lessonId}_${sectionId}_${exampleId}` // More granular key per example
    : null;

  // Load persisted code if applicable
  useEffect(() => {
    console.log("dereps");
    if (persistCode && fullStorageKey) {
      const savedState = loadProgress<{ code: string }>(fullStorageKey);
      if (savedState?.code !== undefined) {
        setCode(savedState.code);
        // console.log(`Loaded code for ${exampleId}:`, savedState.code);
      } else {
        setCode(initialCode); // Fallback to initial if nothing saved for this specific example
      }
    } else {
      setCode(initialCode); // Ensure code is set if not persisting or key parts missing
    }
  }, [initialCode, exampleId, persistCode, fullStorageKey]); // Rerun if initialCode or key parts change

  const onCodeChange = useCallback(
    (newCode: string) => {
      console.log(newCode);
      setCode(newCode);
      if (persistCode && fullStorageKey) {
        saveProgress(fullStorageKey, { code: newCode });
      }
    },
    [persistCode, fullStorageKey]
  );

  const onRunCode = useCallback(async () => {
    if (isPyodideLoading || pyodideError) {
      setOutput("Python environment is not ready.");
      return { output: "", error: "Python environment is not ready." };
    }
    setIsRunning(true);
    setHasBeenRun(true);
    setOutput("Running...");

    const result = await runPythonCode(code);
    setOutput(
      result.error
        ? `Error:\n${result.error}${
            result.output ? `\nOutput before error:\n${result.output}` : ""
          }`
        : result.output || "Code executed (no output)."
    );
    setIsRunning(false);
    return result; // Return the full result { output, error }
  }, [code, isPyodideLoading, pyodideError, runPythonCode]);

  return {
    code,
    output,
    isRunning,
    hasBeenRun,
    isPyodideLoading,
    pyodideError,
    onCodeChange,
    onRunCode,
    setOutput, // Expose setOutput if direct manipulation is needed (e.g., for test results before run)
  };
};
