// src/hooks/useSectionProgress.ts
import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import {
  loadProgress as loadFromStorage,
  saveProgress as saveToStorage,
} from "../lib/localStorageUtils";
import { useProgressActions } from "../stores/progressStore"; // Removed useAllCompletions as it's not used in this hook directly
import { useAuthStore } from "../stores/authStore";

type HookSetStateAction<S> = S | ((prevState: S) => S);

export function useSectionProgress<TState>(
  lessonId: string,
  sectionId: string,
  storageSubKey: string,
  initialState: TState, // This prop must be a stable reference from the caller
  checkCompletion: (state: TState) => boolean
): [TState, Dispatch<HookSetStateAction<TState>>, boolean] {
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userIdForEffect = authUser ? authUser.id : null;

  const [state, setStateInternal] = useState<TState>(() => {
    const savedState = loadFromStorage<TState>(storageSubKey);
    return savedState !== null ? savedState : initialState;
  });

  const { completeSection } = useProgressActions();
  const [isLocallyComplete, setIsLocallyComplete] = useState<boolean>(() =>
    checkCompletion(state)
  );

  const setPersistedState = useCallback(
    (valueOrFn: HookSetStateAction<TState>) => {
      setStateInternal((prevState) => {
        const newState =
          typeof valueOrFn === "function"
            ? (valueOrFn as (prevState: TState) => TState)(prevState)
            : valueOrFn;
        saveToStorage<TState>(storageSubKey, newState);
        return newState;
      });
    },
    [storageSubKey]
  );

  useEffect(() => {
    const isNowComplete = checkCompletion(state);
    setIsLocallyComplete(isNowComplete);
    if (isNowComplete) {
      completeSection(lessonId, sectionId);
    }
  }, [state, lessonId, sectionId, checkCompletion, completeSection]);

  // CRITICAL: Effect to re-load state when authentication status changes
  useEffect(() => {
    // console.log(`Auth state or storageSubKey changed. Reloading state for subKey: ${storageSubKey}, User: ${userIdForEffect}, InitialStateRef: ${initialState}`);
    const reloadedStateFromStorage = loadFromStorage<TState>(storageSubKey);
    const newEffectiveState =
      reloadedStateFromStorage !== null
        ? reloadedStateFromStorage
        : initialState;

    setStateInternal((currentState) => {
      // Only update if the new state is actually different to prevent infinite loops.
      // This is a common pattern when dealing with states that might be objects/arrays.
      // For complex states, a deep comparison library might be used,
      // but for typical JSON-serializable state, stringify is a pragmatic approach.
      if (
        typeof newEffectiveState === "object" &&
        newEffectiveState !== null &&
        typeof currentState === "object" &&
        currentState !== null
      ) {
        if (
          JSON.stringify(newEffectiveState) === JSON.stringify(currentState)
        ) {
          return currentState; // No actual change in value, return current state reference
        }
      } else if (newEffectiveState === currentState) {
        return currentState; // No change for primitives or identical references
      }
      return newEffectiveState; // Update with the new state
    });
  }, [isAuthenticated, userIdForEffect, storageSubKey, initialState]); // `initialState` here MUST be a stable reference from the calling component.

  return [state, setPersistedState, isLocallyComplete];
}
