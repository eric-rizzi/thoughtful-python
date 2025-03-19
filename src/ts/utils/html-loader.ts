/**
 * Utility for dynamically loading HTML components
 */
import { generateHeader, generateFooter } from './html-components';

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
  
  // Note: We're no longer initializing the lesson progress tracker here
  // The functionality is now handled by DynamicLessonController
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