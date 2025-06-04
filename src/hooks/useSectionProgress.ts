// src/hooks/useSectionProgress.ts
import { useState, useEffect, useCallback, useMemo, Dispatch } from "react";
import {
  loadProgress as loadFromStorage,
  saveProgress as saveToStorage,
  ANONYMOUS_USER_ID_PLACEHOLDER,
} from "../lib/localStorageUtils";
import { useProgressActions } from "../stores/progressStore";
import { useAuthStore } from "../stores/authStore";
import { LessonId, SectionId, UnitId } from "../types/data";

type HookSetStateAction<S> = S | ((prevState: S) => S);

export function useSectionProgress<TState extends object>(
  unitId: UnitId,
  lessonId: LessonId,
  sectionId: SectionId,
  storageSubKey: string,
  initialState: TState,
  checkCompletion: (state: TState) => boolean
): [TState, Dispatch<HookSetStateAction<TState>>, boolean] {
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Determine the userId to be used for storage keys.
  // This value will react to auth changes due to useAuthStore.
  const currentStorageUserId = useMemo(() => {
    return isAuthenticated && authUser
      ? authUser.userId
      : ANONYMOUS_USER_ID_PLACEHOLDER;
  }, [isAuthenticated, authUser]);

  const [state, setStateInternal] = useState<TState>(() => {
    // Pass currentStorageUserId at initialization time
    const savedFromStorage = loadFromStorage<Partial<TState>>(
      currentStorageUserId,
      storageSubKey
    );
    if (savedFromStorage !== null && typeof savedFromStorage === "object") {
      return { ...initialState, ...savedFromStorage } as TState;
    }
    return initialState;
  });

  const { completeSection } = useProgressActions();
  const [isLocallyComplete, setIsLocallyComplete] = useState<boolean>(() =>
    checkCompletion(state)
  );

  const setPersistedState = useCallback(
    (valueOrFn: HookSetStateAction<TState>) => {
      // currentStorageUserId from the hook's scope will be up-to-date here
      // due to the nature of useCallback dependencies (though not explicitly needed for currentStorageUserId here
      // as it's derived from store values that would trigger re-render of consumer, re-creating this callback if needed)
      // However, to be absolutely sure it uses the latest, it could be a dependency, or obtained fresh if worried.
      // For simplicity, assuming the component re-renders if currentStorageUserId changes, making this callback fresh.
      // A safer approach is to pass currentStorageUserId to saveToStorage if it could change between renders
      // without this callback being recreated.
      // Let's ensure it uses the up-to-date ID by including currentStorageUserId in dependencies.

      setStateInternal((prevState) => {
        const newState =
          typeof valueOrFn === "function"
            ? (valueOrFn as (prevState: TState) => TState)(prevState)
            : valueOrFn;
        saveToStorage<TState>(currentStorageUserId, storageSubKey, newState);
        return newState;
      });
    },
    [storageSubKey, currentStorageUserId] // Added currentStorageUserId as a dependency
  );

  useEffect(() => {
    const isNowComplete = checkCompletion(state);
    setIsLocallyComplete(isNowComplete);
    if (isNowComplete) {
      completeSection(unitId, lessonId, sectionId);
    }
  }, [state, unitId, lessonId, sectionId, checkCompletion, completeSection]);

  // Effect to re-load state when authentication status or relevant storage key parts change
  useEffect(() => {
    // currentStorageUserId will be up-to-date here due to being derived from store values
    const reloadedStateFromStorage = loadFromStorage<Partial<TState>>(
      currentStorageUserId,
      storageSubKey
    );
    let newEffectiveState: TState;

    if (
      reloadedStateFromStorage !== null &&
      typeof reloadedStateFromStorage === "object"
    ) {
      newEffectiveState = {
        ...initialState,
        ...reloadedStateFromStorage,
      } as TState;
    } else {
      newEffectiveState = initialState;
    }

    setStateInternal((currentState) => {
      if (
        typeof newEffectiveState === "object" &&
        newEffectiveState !== null &&
        typeof currentState === "object" &&
        currentState !== null
      ) {
        if (
          JSON.stringify(newEffectiveState) === JSON.stringify(currentState)
        ) {
          return currentState;
        }
      } else if (newEffectiveState === currentState) {
        return currentState;
      }
      return newEffectiveState;
    });
  }, [currentStorageUserId, storageSubKey, initialState]); // Use currentStorageUserId instead of isAuthenticated/userIdForEffect

  return [state, setPersistedState, isLocallyComplete];
}
