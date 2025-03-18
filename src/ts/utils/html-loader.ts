/**
 * Utility for dynamically loading HTML components
 */
import { generateHeader, generateFooter } from './html-components';
import { initializeLessonProgressTracker } from './lesson-progress-tracker';

/**
 * Injects common HTML components into the page
 * @param currentPage - The ID of the current page
 */
export function injectCommonComponents(currentPage: string): void {
  // Replace the header
  const headerPlaceholder = document.querySelector('header');
  if (headerPlaceholder) {
    headerPlaceholder.outerHTML = generateHeader(currentPage);
  }

  // Replace the footer
  const footerPlaceholder = document.querySelector('footer');
  if (footerPlaceholder) {
    footerPlaceholder.outerHTML = generateFooter();
  }
  
  // Initialize the lesson progress tracker AFTER header is injected
  // This ensures navigation elements exist when we try to update them
  setTimeout(() => {
    initializeLessonProgressTracker();
  }, 0);
}

/**
 * Initializes the page layout by injecting all common components
 * @param currentPage - The ID of the current page
 */
export function initializePageLayout(currentPage: string): void {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectCommonComponents(currentPage);
    });
  } else {
    // DOM already loaded
    injectCommonComponents(currentPage);
  }
}