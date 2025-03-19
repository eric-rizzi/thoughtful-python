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
  
  // Check if we're on a lesson page
  const isLessonPage = currentPage.startsWith('lesson_');
  const isUnitPage = currentPage === 'unit';

  if (isLessonPage) {
    // Get the lesson number for basic navigation
    const lessonNumber = parseInt(currentPage.replace('lesson_', ''), 10);
    const prevLessonNumber = lessonNumber > 1 ? lessonNumber - 1 : null;
    const nextLessonNumber = lessonNumber < 7 ? lessonNumber + 1 : null; // Assuming 7 lessons
    
    // Build navigation elements
    const prevLink = prevLessonNumber 
      ? `<a href="${BASE_PATH}/lesson_${prevLessonNumber}.html" class="nav-button">← Previous</a>` 
      : `<span class="nav-button disabled">← Previous</span>`;
      
    const nextLink = nextLessonNumber 
      ? `<a href="${BASE_PATH}/lesson_${nextLessonNumber}.html" class="nav-button">Next →</a>` 
      : `<span class="nav-button disabled">Next →</span>`;
    
    navItems = `
      <li><a href="${BASE_PATH}/index.html">Home</a></li>
      <li><a href="${BASE_PATH}/unit.html?id=${unitId || 'intro_python'}">Unit Overview</a></li>
      <li class="nav-separator">|</li>
      <li class="lesson-progress">Lesson ${lessonNumber} of 7</li>
      <li class="prev-next-container">
        ${prevLink}
        ${nextLink}
      </li>
    `;
  } else if (isUnitPage) {
    // Unit page - show home and unit title
    navItems = `
      <li><a href="${BASE_PATH}/index.html">Home</a></li>
      <li><a href="${BASE_PATH}/unit.html?id=${unitId || 'intro_python'}" class="active">Unit Overview</a></li>
    `;
  } else {
    // Main index page - show the main navigation
    navItems = `
      <li><a href="${BASE_PATH}/index.html" ${currentPage === 'index' ? 'class="active"' : ''}>Home</a></li>
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