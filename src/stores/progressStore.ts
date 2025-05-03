// src/stores/progressStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the structure of the state
interface ProgressState {
  // Store completed sections as an object where keys are lessonIds
  // and values are arrays of completed sectionIds for that lesson.
  // Using an array is easier for JSON serialization with persist middleware.
  completion: {
    [lessonId: string]: string[]; // e.g., { "lesson_1": ["intro", "code-example"], "lesson_2": ["challenge"] }
  };

  // Define actions to modify the state
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
    // Setup function defining initial state and actions
    (set, get) => ({
      // Initial State
      completion: {},
      actions: {
        completeSection: (lessonId, sectionId) => set((state) => {
          const lessonCompletion = state.completion[lessonId] || [];
          if (!lessonCompletion.includes(sectionId)) {
            const newCompletion = {
              ...state.completion,
              [lessonId]: [...lessonCompletion, sectionId],
            };
            console.log(`ProgressStore: Marking ${lessonId} - ${sectionId} complete. New state:`, newCompletion);
            return { completion: newCompletion };
          }
          return state;
        }),

        // Helper function to check completion status (accessed via state)
        isSectionComplete: (lessonId, sectionId) => {
            const lessonCompletion = get().completion[lessonId] || [];
            return lessonCompletion.includes(sectionId);
        },

        // Helper to get completed sections for a lesson
        getCompletedSections: (lessonId) => {
            return get().completion[lessonId] || [];
        },

        // Action to reset progress for a single lesson
        resetLessonProgress: (lessonId) => set((state) => {
            // Don't modify state directly, create a new object
            const newCompletion = { ...state.completion };
            delete newCompletion[lessonId]; // Remove the key for the lesson
            console.log(`ProgressStore: Reset progress for ${lessonId}. New state:`, newCompletion);
            return { completion: newCompletion };
        }),

        // Action to reset all progress
        resetAllProgress: () => set({ completion: {} }),

      },
    }),
    // Configuration for the persist middleware
    {
      name: 'lesson-progress-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage
      partialize: (state) => ({ completion: state.completion }), // Only persist the 'completion' part of the state
      // Optional: migration logic if state structure changes later
      // version: 1, // State version
      // migrate: (persistedState, version) => { ... }
    }
  )
);

// Export actions separately for convenience (optional but common pattern)
export const useProgressActions = () => useProgressStore((state) => state.actions);

// Selector hook for getting completed sections for a specific lesson (memoized)
// This helps components re-render only when the specific lesson's progress changes
export const useCompletedSectionsForLesson = (lessonId: string | undefined): string[] => {
  return useProgressStore((state) => (lessonId ? state.completion[lessonId] || [] : []));
  // Note: This will cause re-renders if *any* part of the state changes,
  // unless Zustand's default shallow equality works or you add an equality fn.
  // For better performance if needed later, you might use:
  // return useProgressStore(state => state.completion[lessonId || ''] || [], shallow);
  // Requires importing shallow: import { shallow } from 'zustand/shallow'
};

// Selector hook for getting the entire completion map
export const useAllCompletions = () => useProgressStore((state) => state.completion);
