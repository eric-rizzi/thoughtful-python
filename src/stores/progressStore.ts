// src/stores/progressStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define a constant empty array outside the hook
const EMPTY_COMPLETED_SECTIONS: string[] = [];

interface ProgressState {
  // Store completed sections as an object where keys are lessonIds
  // and values are arrays of completed sectionIds for that lesson.
  // Using an array is easier for JSON serialization with persist middleware.
  completion: {
    [lessonId: string]: string[]; // e.g., { "lesson_1": ["intro", "code-example"], "lesson_2": ["challenge"] }
  };
  actions: {
    completeSection: (lessonId: string, sectionId: string) => void;
    isSectionComplete: (lessonId: string, sectionId: string) => boolean;
    getCompletedSections: (lessonId: string) => string[];
    resetLessonProgress: (lessonId: string) => void;
    resetAllProgress: () => void;
  };
}

// Create the store using Zustand's create function and persist middleware
export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completion: {},
      actions: {
        completeSection: (lessonId, sectionId) => set((state) => {
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
            return get().completion[lessonId] || EMPTY_COMPLETED_SECTIONS; // Use stable empty array
        },
        resetLessonProgress: (lessonId) => set((state) => {
            const newCompletion = { ...state.completion };
            delete newCompletion[lessonId];
            return { completion: newCompletion };
        }),
        resetAllProgress: () => set({ completion: {} }),
      },
    }),
    {
      name: 'lesson-progress-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ completion: state.completion }),
    }
  )
);

// Export actions separately for convenience (optional but common pattern)
export const useProgressActions = () => useProgressStore((state) => state.actions);

// Selector hook for getting completed sections for a specific lesson (memoized)
// This helps components re-render only when the specific lesson's progress changes
export const useCompletedSectionsForLesson = (lessonId: string | undefined): string[] => {
  return useProgressStore((state) =>
    lessonId
      ? state.completion[lessonId] || EMPTY_COMPLETED_SECTIONS // Return stable empty array
      : EMPTY_COMPLETED_SECTIONS // Return stable empty array for undefined lessonId
  );
};

export const useAllCompletions = () => useProgressStore((state) => state.completion);
