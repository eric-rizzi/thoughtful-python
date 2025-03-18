/**
 * Utility for tracking overall lesson completion status
 */

// Define the necessary sections for each lesson to be considered complete
const REQUIRED_SECTIONS: { [key: string]: string[] } = {
  'lesson_1': ['print-function', 'comments', 'basic-math', 'exercises'],
  'lesson_2': ['functions', 'temperature', 'challenge'],
  'lesson_3': ['prediction'],
  'lesson_4': [] // This will be populated dynamically from the JSON data
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
      const parentLi = navLink.parentElement;
      
      if (isComplete) {
        // Add completed class to the li element
        if (parentLi && !parentLi.classList.contains('nav-completed')) {
          parentLi.classList.add('nav-completed');
          console.log(`Added nav-completed class to ${lessonId} nav item`);
        }
      } else {
        // Remove completed class if not complete (in case user cleared progress)
        if (parentLi && parentLi.classList.contains('nav-completed')) {
          parentLi.classList.remove('nav-completed');
          console.log(`Removed nav-completed class from ${lessonId} nav item`);
        }
      }
    } else {
      console.warn(`Could not find nav item for lesson: ${lessonId}`);
    }
  }
}

/**
 * Modified initializeLessonProgressTracker function
 */
export function initializeLessonProgressTracker(): void {
  // Update status immediately
  updateLessonCompletionStatus();
  
  // Listen for custom events from lesson controllers
  window.addEventListener('lessonProgressUpdated', () => {
    console.log('Progress update event received, updating navigation');
    updateLessonCompletionStatus();
  });
  
  // Also listen for storage events (useful for multi-tab scenarios)
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('python_') && event.key.endsWith('_completed')) {
      console.log('Storage event detected, updating navigation');
      updateLessonCompletionStatus();
    }
  });
}