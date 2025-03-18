/**
 * Utility for tracking overall lesson completion status
 */

// Define the necessary sections for each lesson to be considered complete
const REQUIRED_SECTIONS: { [key: string]: string[] } = {
  'lesson_1': ['print-function', 'comments', 'basic-math', 'exercises'],
  'lesson_2': ['functions', 'temperature', 'challenge'],
  'lesson_3': [] // Add required sections when lesson 3 is implemented
};

/**
 * Checks if a lesson is completely finished
 * @param lessonId - The lesson identifier (e.g., "lesson_1")
 * @returns boolean indicating if all required sections are completed
 */
export function isLessonComplete(lessonId: string): boolean {
  try {
    const storageKey = `python_${lessonId}_completed`;
    const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Get the required sections for this lesson
    const requiredSections = REQUIRED_SECTIONS[lessonId] || [];
    
    // If no sections are defined, lesson is not completable
    if (requiredSections.length === 0) {
      return false;
    }
    
    // Check if all required sections are completed
    return requiredSections.every(section => completedSections.includes(section));
  } catch (error) {
    console.warn(`Failed to check lesson completion status for ${lessonId}:`, error);
    return false;
  }
}

/**
 * Updates the lesson completion status in the navigation
 */
export function updateLessonCompletionStatus(): void {
  // Check each lesson
  for (const lessonId of Object.keys(REQUIRED_SECTIONS)) {
    const isComplete = isLessonComplete(lessonId);
    
    // Find the nav link for this lesson
    const navLink = document.querySelector(`nav li a[href="${lessonId}.html"]`);
    if (navLink) {
      if (isComplete) {
        // Add completed class to the li element
        const parentLi = navLink.parentElement;
        if (parentLi && !parentLi.classList.contains('nav-completed')) {
          parentLi.classList.add('nav-completed');
        }
      }
    }
  }
}

/**
 * Initializes the lesson progress tracker
 * This should be called when the DOM is ready
 */
export function initializeLessonProgressTracker(): void {
  updateLessonCompletionStatus();
  
  // Listen for storage events to update when progress changes
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('python_') && event.key.endsWith('_completed')) {
      updateLessonCompletionStatus();
    }
  });
}