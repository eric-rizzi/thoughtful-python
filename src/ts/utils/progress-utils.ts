/**
 * Utility functions for tracking and displaying user progress in lessons
 */

/**
 * Marks a sidebar section as completed
 * @param sectionName - The ID of the section to mark as completed
 * @param lessonId - The lesson identifier (e.g., "lesson_1")
 */
export function markSectionCompleted(sectionName: string, lessonId: string): void {
  // Find the sidebar link for this section
  const sidebarLink = document.querySelector(`.lesson-sidebar a[href="#${sectionName}"]`);
  if (!sidebarLink) {
    console.warn(`Could not find sidebar link for section: ${sectionName}`);
    return;
  }
  
  // Add completed class to parent li element
  const parentLi = sidebarLink.parentElement;
  if (parentLi && !parentLi.classList.contains('completed')) {
    parentLi.classList.add('completed');
    
    // Show temporary notification
    showProgressSavedNotification();
    
    // Store completion in localStorage
    saveCompletionToStorage(sectionName, lessonId);
  }
}

/**
 * Shows a temporary notification that progress was saved
 */
export function showProgressSavedNotification(): void {
  // Check if notification already exists
  let notification = document.querySelector('.progress-saved');
  
  if (!notification) {
    // Create new notification
    notification = document.createElement('div');
    notification.className = 'progress-saved';
    notification.textContent = 'Progress saved ✓';
    
    // Add to sidebar
    const sidebar = document.querySelector('.lesson-sidebar');
    if (sidebar) {
      sidebar.appendChild(notification);
    }
  } else {
    // Reset animation if notification exists
    notification.classList.remove('fade-out');
    // Force reflow - need to cast to HTMLElement to access offsetWidth
    (notification as HTMLElement).offsetWidth;
  }
  
  // Fade out after 2 seconds
  setTimeout(() => {
    notification?.classList.add('fade-out');
  }, 2000);
}

/**
 * Saves section completion status to localStorage
 * @param sectionName - The section name/ID to save
 * @param lessonId - The lesson identifier
 */
export function saveCompletionToStorage(sectionName: string, lessonId: string): void {
  try {
    // Get existing completed sections
    const storageKey = `python_${lessonId}_completed`;
    const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Add this section if not already included
    if (!completedSections.includes(sectionName)) {
      completedSections.push(sectionName);
      localStorage.setItem(storageKey, JSON.stringify(completedSections));
      
      // Dispatch a custom event to notify that progress has been updated
      window.dispatchEvent(new CustomEvent('lessonProgressUpdated', {
        detail: { lessonId, sectionName }
      }));
    }
  } catch (error) {
    console.warn('Failed to save progress to localStorage:', error);
  }
}

/**
 * Loads completion status from localStorage and updates UI
 * @param lessonId - The lesson identifier
 */
export function loadCompletionFromStorage(lessonId: string): void {
  try {
    const storageKey = `python_${lessonId}_completed`;
    const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Mark each completed section
    completedSections.forEach((sectionName: string) => {
      const sidebarLink = document.querySelector(`.lesson-sidebar a[href="#${sectionName}"]`);
      if (sidebarLink && sidebarLink.parentElement) {
        sidebarLink.parentElement.classList.add('completed');
      }
    });
  } catch (error) {
    console.warn('Failed to load progress from localStorage:', error);
  }
}
