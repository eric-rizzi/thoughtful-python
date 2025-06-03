// src/hooks/useInteractiveExample.ts
import { useState, useCallback, useEffect, useMemo } from "react";
import { usePyodide } from "../contexts/PyodideContext";
import {
  loadProgress,
  saveProgress,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../lib/localStorageUtils";
import { useAuthStore } from "../stores/authStore";
import { LessonId, SectionId } from "../types/data";

interface UseInteractiveExampleProps {
  exampleId: string;
  initialCode: string;
  lessonId: LessonId;
  sectionId: SectionId;
  persistCode?: boolean;
  storageKeyPrefix?: string;
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

  const authUser = useAuthStore((state) => state.user); // Get auth state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated); // Get auth state

  const currentStorageUserId = useMemo(() => {
    // Memoize to prevent unnecessary re-runs if called in deps
    return isAuthenticated && authUser
      ? authUser.id
      : ANONYMOUS_USER_ID_PLACEHOLDER;
  }, [isAuthenticated, authUser]);

  const fullStorageKey = persistCode
    ? `${storageKeyPrefix}_${lessonId}_${sectionId}_${exampleId}`
    : null;

  const [code, setCode] = useState<string>(() => {
    // Initialize code state
    if (persistCode && fullStorageKey) {
      const savedState = loadProgress<{ code: string }>(
        currentStorageUserId,
        fullStorageKey
      );
      if (savedState?.code !== undefined) {
        return savedState.code;
      }
    }
    return initialCode;
  });

  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasBeenRun, setHasBeenRun] = useState<boolean>(false);

  // Effect for re-loading persisted code if auth state or key parts change
  useEffect(() => {
    if (persistCode && fullStorageKey) {
      const savedState = loadProgress<{ code: string }>(
        currentStorageUserId,
        fullStorageKey
      );
      if (savedState?.code !== undefined) {
        setCode(savedState.code);
      } else {
        setCode(initialCode); // Fallback to initial if nothing saved for this specific example
      }
    } else if (!persistCode) {
      // If persistence is turned off, ensure it uses initial code
      setCode(initialCode);
    }
    // This effect should also reset hasBeenRun and output if code source changes significantly
    setHasBeenRun(false);
    setOutput("");
  }, [initialCode, persistCode, fullStorageKey, currentStorageUserId]); // Add currentStorageUserId

  const onCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      if (persistCode && fullStorageKey) {
        saveProgress(currentStorageUserId, fullStorageKey, { code: newCode });
      }
    },
    [persistCode, fullStorageKey, currentStorageUserId] // Add currentStorageUserId
  );

  const onRunCode = useCallback(async () => {
    // ... (rest of onRunCode remains the same)
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
    return result;
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
    setOutput,
  };
};
