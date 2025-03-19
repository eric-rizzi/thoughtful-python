/**
 * Utility functions for generating common HTML components across lessons
 */

import { BASE_PATH, LESSON_CONTROLLER_TYPES, LESSON_TITLES } from "../config";

/**
 * Generates the common header HTML with navigation
 * @param currentPage - The ID of the current page (e.g., 'index', 'unit', 'lesson_1')
 * @param unitId - Optional unit ID for unit and lesson pages
 * @returns HTML string for the header
 */
export function generateHeader(currentPage: string, unitId?: string): string {
  let navItems = '';
  
  // Check if we're on a lesson or unit page
  const isLessonPage = currentPage.startsWith('lesson_');
  const isUnitPage = currentPage === 'unit';

  if (isLessonPage || isUnitPage) {
    // Lesson or Unit page - we'll show the lessons in this unit
    // Note: This will be populated dynamically later via JavaScript
    navItems = `
      <li><a href="${BASE_PATH}/index.html">Home</a></li>
      <li><a href="${BASE_PATH}/unit.html?id=${unitId || 'intro_python'}" ${isUnitPage ? 'class="active"' : ''}>Unit Overview</a></li>
      <li class="nav-separator">|</li>
      <!-- Lessons will be populated dynamically -->
      <li class="dynamic-lessons-placeholder"></li>
    `;
  } else {
    // Main index page - show the main navigation
    navItems = `
      <li><a href="${BASE_PATH}/index.html" ${currentPage === 'index' ? 'class="active"' : ''}>Home</a></li>
      <li><a href="${BASE_PATH}/unit.html?id=intro_python">Learning Paths</a></li>
      <li><a href="${BASE_PATH}/code-editor.html" class="disabled">Interactive Code Editor</a></li>
      <li><a href="${BASE_PATH}/feedback.html" class="disabled">Instant Feedback</a></li>
      <li><a href="${BASE_PATH}/about.html" class="disabled">About Us</a></li>
    `;
  }
  
  return `
  <header>
    <div class="container">
      <h1>Learn Python in the Browser</h1>
      <nav>
        <ul>
          ${navItems}
        </ul>
      </nav>
    </div>
  </header>`;
}

/**
 * Generates the common footer HTML
 * @returns HTML string for the footer
 */
export function generateFooter(): string {
  const currentYear = new Date().getFullYear();
  return `
  <footer>
    <div class="container">
      <p>&copy; ${currentYear} Python Browser Lessons</p>
    </div>
  </footer>`;
}

/**
 * Dynamically updates the header navigation for unit and lesson pages
 * @param unitId - The ID of the current unit
 * @param lessons - Array of lesson IDs in this unit
 * @param currentLessonId - The ID of the current lesson (if on a lesson page)
 */
export function updateHeaderWithLessons(unitId: string, lessons: string[], currentLessonId?: string): void {
  // Find the placeholder in the DOM
  const placeholder = document.querySelector('.dynamic-lessons-placeholder');
  if (!placeholder) return;
  
  // Create the lesson navigation items
  const lessonNavItems = lessons.map((lessonId, index) => {
    const isActive = lessonId === currentLessonId ? 'class="active"' : '';
    const title = LESSON_TITLES[lessonId] || `Lesson ${index + 1}`;
    return `<li><a href="${BASE_PATH}/${lessonId}.html" ${isActive}>Lesson ${index + 1}: ${title}</a></li>`;
  }).join('');
  
  // Replace the placeholder with the actual lesson navigation
  placeholder.outerHTML = lessonNavItems;
}

/**
 * Generates common head content for all pages
 * @param title - The page title
 * @returns HTML string for the head content
 */
export function generateHeadContent(title: string): string {
  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Python in the Browser</title>
  <!-- CSS is injected by webpack -->
  
  <!-- Add CodeMirror for code editing -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/python/python.min.js"></script>`;
}

export function showError(message: string): void {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.prepend(errorDiv);
}