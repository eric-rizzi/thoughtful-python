// src/stores/progressStore.ts
import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { useAuthStore } from "./authStore";
import { ANONYMOUS_USER_ID_PLACEHOLDER } from "../lib/localStorageUtils";

const BASE_PROGRESS_STORE_KEY = "lesson-progress-storage-v2";

const EMPTY_COMPLETED_SECTIONS: string[] = [];
const PENALTY_DURATION_MS = 15 * 1000;

interface ProgressState {
  completion: {
    [lessonId: string]: string[];
  };
  penaltyEndTime: number | null;
  actions: {
    completeSection: (lessonId: string, sectionId: string) => void;
    isSectionComplete: (lessonId: string, sectionId: string) => boolean;
    getCompletedSections: (lessonId: string) => string[];
    resetLessonProgress: (lessonId: string) => void;
    resetAllProgress: () => void;
    startPenalty: () => void;
    clearPenalty: () => void;
  };
}

const createUserSpecificStorage = (baseKey: string): StateStorage => {
  const getEffectiveKey = (): string => {
    const authState = useAuthStore.getState();
    const userId =
      authState.isAuthenticated && authState.user
        ? authState.user.id
        : ANONYMOUS_USER_ID_PLACEHOLDER;
    const effectiveKeyResult = `${userId}_${baseKey}`;
    // Log the components of the key
    // console.log(`[Debug getEffectiveKey] authState.isAuthenticated: ${authState.isAuthenticated}, authState.user.id: ${authState.user?.id}, ANONYMOUS_USER_ID_PLACEHOLDER: ${ANONYMOUS_USER_ID_PLACEHOLDER}, baseKey: ${baseKey}, Result: ${effectiveKeyResult}`);
    return effectiveKeyResult;
  };

  return {
    getItem: (namePassedByPersist) => {
      // `namePassedByPersist` will be BASE_PROGRESS_STORE_KEY
      const effectiveKey = getEffectiveKey();
      console.log(
        `[ProgressStore Custom Storage] getItem: Attempting to get from effectiveKey="${effectiveKey}" (persist's name was "${namePassedByPersist}")`
      );
      const value = localStorage.getItem(effectiveKey);
      console.log(
        `[ProgressStore Custom Storage] getItem: Value for "${effectiveKey}" is ${
          value ? `"${value.substring(0, 70)}..."` : null
        }`
      );
      return value;
    },
    setItem: (namePassedByPersist, value) => {
      const effectiveKey = getEffectiveKey();
      console.log(
        `[ProgressStore Custom Storage] setItem: Attempting to set for effectiveKey="${effectiveKey}" (persist's name was "${namePassedByPersist}"), value="${value.substring(
          0,
          70
        )}..."`
      );
      localStorage.setItem(effectiveKey, value);
    },
    removeItem: (namePassedByPersist) => {
      const effectiveKey = getEffectiveKey();
      console.log(
        `[ProgressStore Custom Storage] removeItem: Attempting to remove for effectiveKey="${effectiveKey}" (persist's name was "${namePassedByPersist}")`
      );
      localStorage.removeItem(effectiveKey);
    },
  };
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completion: {},
      penaltyEndTime: null,
      actions: {
        completeSection: (lessonId, sectionId) =>
          set((state) => {
            const lessonCompletion = state.completion[lessonId] || [];
            if (!lessonCompletion.includes(sectionId)) {
              const newCompletion = {
                ...state.completion,
                [lessonId]: [...lessonCompletion, sectionId],
              };
              return { completion: newCompletion };
            }
            return state;
          }),
        isSectionComplete: (lessonId, sectionId) => {
          const lessonCompletion = get().completion[lessonId] || [];
          return lessonCompletion.includes(sectionId);
        },
        getCompletedSections: (lessonId) => {
          return get().completion[lessonId] || EMPTY_COMPLETED_SECTIONS;
        },
        resetLessonProgress: (lessonId) =>
          set((state) => {
            const newCompletion = { ...state.completion };
            delete newCompletion[lessonId];
            return { completion: newCompletion };
          }),
        resetAllProgress: () => set({ completion: {}, penaltyEndTime: null }),
        startPenalty: () =>
          set({ penaltyEndTime: Date.now() + PENALTY_DURATION_MS }),
        clearPenalty: () => set({ penaltyEndTime: null }),
      },
    }),
    {
      name: BASE_PROGRESS_STORE_KEY, // This is passed as `namePassedByPersist`
      storage: createJSONStorage(() =>
        createUserSpecificStorage(BASE_PROGRESS_STORE_KEY)
      ),
      partialize: (state) => ({
        completion: state.completion,
        penaltyEndTime: state.penaltyEndTime,
      }),
    }
  )
);

// ... rest of the file (selectors)
export const useProgressActions = () =>
  useProgressStore((state) => state.actions);

export const useCompletedSectionsForLesson = (
  lessonId: string | undefined
): string[] => {
  return useProgressStore((state) =>
    lessonId
      ? state.completion[lessonId] || EMPTY_COMPLETED_SECTIONS
      : EMPTY_COMPLETED_SECTIONS
  );
};

export const useAllCompletions = () =>
  useProgressStore((state) => state.completion);

export const useIsPenaltyActive = (): boolean => {
  return useProgressStore(
    (state) =>
      state.penaltyEndTime !== null && Date.now() < state.penaltyEndTime
  );
};

export const useRemainingPenaltyTime = (): number => {
  const penaltyEndTime = useProgressStore((state) => state.penaltyEndTime);
  if (penaltyEndTime === null || Date.now() >= penaltyEndTime) {
    return 0;
  }
  return Math.ceil((penaltyEndTime - Date.now()) / 1000);
};
