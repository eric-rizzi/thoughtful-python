// src/hooks/useSectionProgress.ts
import { useState, useEffect, useCallback, Dispatch } from "react";
import { loadProgress, saveProgress } from "../lib/localStorageUtils";
import { useProgressActions } from "../stores/progressStore";

type SetStateAction<S> = S | ((prevState: S) => S);

/**
 * A custom hook to manage the state, persistence, and completion tracking for a lesson section.
 *
 * @param lessonId - The ID of the current lesson.
 * @param sectionId - The ID of the current section.
 * @param storageKey - The unique localStorage key for this section's state.
 * @param initialState - The initial state for the section if nothing is found in localStorage.
 * @param checkCompletion - A function that takes the current state and returns true if the section is considered complete.
 * @returns A tuple: [currentState, setStateAndUpdateProgress, isLocallyComplete]
 * - currentState: The current state of the section.
 * - setStateAndUpdateProgress: A function to update the state (also saves to localStorage and checks completion).
 * - isLocallyComplete: A boolean indicating if the current state meets the completion criteria.
 */
export function useSectionProgress<TState>(
  lessonId: string,
  sectionId: string,
  storageKey: string,
  initialState: TState,
  checkCompletion: (state: TState) => boolean
): [TState, Dispatch<SetStateAction<TState>>, boolean] {
  const [state, setStateInternal] = useState<TState>(() => {
    const savedState = loadProgress<TState>(storageKey);
    // Ensure that if savedState is loaded, it's a complete object.
    // If initialState has more keys than a partially saved state, merge might be needed,
    // but for now, we assume savedState is either complete or null.
    return savedState !== null ? savedState : initialState;
  });

  const { completeSection } = useProgressActions();
  const [isLocallyComplete, setIsLocallyComplete] = useState<boolean>(() =>
    checkCompletion(state)
  );

  // Wrapped setState to also save to localStorage
  // Renamed to avoid confusion with the returned setState
  const setPersistedState = useCallback(
    (valueOrFn: SetStateAction<TState>) => {
      setStateInternal((prevState) => {
        const newState =
          typeof valueOrFn === "function"
            ? (valueOrFn as (prevState: TState) => TState)(prevState)
            : valueOrFn;
        saveProgress<TState>(storageKey, newState);
        return newState;
      });
    },
    [storageKey]
  );

  // Effect to check completion status and update global progress store when state changes
  useEffect(() => {
    const isNowComplete = checkCompletion(state);
    setIsLocallyComplete(isNowComplete);
    if (isNowComplete) {
      // console.log(`useSectionProgress: Section ${sectionId} in lesson ${lessonId} is complete. Marking in global store.`);
      completeSection(lessonId, sectionId);
    }
    // This effect runs whenever 'state' changes, or if the criteria/identifiers change.
  }, [state, lessonId, sectionId, checkCompletion, completeSection]);

  return [state, setPersistedState, isLocallyComplete];
}
