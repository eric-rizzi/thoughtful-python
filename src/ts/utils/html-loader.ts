/**
 * Utility for dynamically loading HTML components
 */
import { generateHeader, generateFooter } from './html-components';

/**
 * Injects common HTML components into the page
 * @param currentPage - The ID of the current page
 * @param unitId - Optional unit ID for unit and lesson pages
 */
export function injectCommonComponents(currentPage: string, unitId?: string): void {
  // Replace the header
  const headerPlaceholder = document.querySelector('header');
  if (headerPlaceholder) {
    headerPlaceholder.outerHTML = generateHeader(currentPage, unitId);
  }

  // Replace the footer
  const footerPlaceholder = document.querySelector('footer');
  if (footerPlaceholder) {
    footerPlaceholder.outerHTML = generateFooter();
  }
}

/**
 * Gets the unit ID from the URL query parameter
 * @returns The unit ID or null if not found
 */
export function getUnitIdFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

/**
 * Gets the lesson ID from the current URL
 * @returns The lesson ID or null if not a lesson page
 */
export function getLessonIdFromUrl(): string | null {
  const path = window.location.pathname;
  const match = path.match(/lesson_(\d+)\.html$/);
  return match ? `lesson_${match[1]}` : null;
}

/**
 * Initializes the page layout by injecting all common components
 * @param currentPage - The ID of the current page
 */
export function initializePageLayout(currentPage: string): void {
  // Get unit ID if available
  const unitId = getUnitIdFromUrl();
  const lessonId = getLessonIdFromUrl();

  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectCommonComponents(currentPage, unitId || (lessonId ? 'intro_python' : undefined));
    });
  } else {
    // DOM already loaded
    injectCommonComponents(currentPage, unitId || (lessonId ? 'intro_python' : undefined));
  }
}