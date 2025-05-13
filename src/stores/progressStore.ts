// src/stores/progressStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define a constant empty array outside the hook
const EMPTY_COMPLETED_SECTIONS: string[] = [];
const PENALTY_DURATION_MS = 15 * 1000; // 15 seconds

interface ProgressState {
  completion: {
    [lessonId: string]: string[];
  };
  penaltyEndTime: number | null; // Timestamp when the penalty ends, or null
  actions: {
    completeSection: (lessonId: string, sectionId: string) => void;
    isSectionComplete: (lessonId: string, sectionId: string) => boolean;
    getCompletedSections: (lessonId: string) => string[];
    resetLessonProgress: (lessonId: string) => void;
    resetAllProgress: () => void;
    startPenalty: () => void; // Starts a 10-second penalty
    clearPenalty: () => void; // Clears any active penalty
  };
}

// Create the store using Zustand's create function and persist middleware
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
        resetAllProgress: () => set({ completion: {} }),
        startPenalty: () =>
          set({ penaltyEndTime: Date.now() + PENALTY_DURATION_MS }),
        clearPenalty: () => set({ penaltyEndTime: null }),
      },
    }),
    {
      name: "lesson-progress-storage-v2", // Updated name to include penalty
      storage: createJSONStorage(() => localStorage),
      // Persist both completion and penaltyEndTime
      partialize: (state) => ({
        completion: state.completion,
        penaltyEndTime: state.penaltyEndTime,
      }),
    }
  )
);

// Export actions separately for convenience
export const useProgressActions = () =>
  useProgressStore((state) => state.actions);

// Selector hook for getting completed sections for a specific lesson
export const useCompletedSectionsForLesson = (
  lessonId: string | undefined
): string[] => {
  return useProgressStore((state) =>
    lessonId
      ? state.completion[lessonId] || EMPTY_COMPLETED_SECTIONS
      : EMPTY_COMPLETED_SECTIONS
  );
};

// Selector hook for getting all completion data
export const useAllCompletions = () =>
  useProgressStore((state) => state.completion);

// Selector hook to check if a penalty is currently active
export const useIsPenaltyActive = (): boolean => {
  return useProgressStore(
    (state) =>
      state.penaltyEndTime !== null && Date.now() < state.penaltyEndTime
  );
};

// Selector hook to get the remaining penalty time in seconds
export const useRemainingPenaltyTime = (): number => {
  const penaltyEndTime = useProgressStore((state) => state.penaltyEndTime);
  if (penaltyEndTime === null || Date.now() >= penaltyEndTime) {
    return 0;
  }
  return Math.ceil((penaltyEndTime - Date.now()) / 1000);
};
