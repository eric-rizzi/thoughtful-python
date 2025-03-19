/**
 * Utility functions for generating common HTML components across lessons
 */

/**
 * Generates the common header HTML with navigation
 * @param currentPage - The ID of the current page (e.g., 'lesson_1', 'lesson_2')
 * @returns HTML string for the header
 */
export function generateHeader(currentPage: string): string {
  return `
  <header>
    <div class="container">
      <h1>Learn Python in the Browser</h1>
      <nav>
        <ul>
          <li><a href="index.html" ${currentPage === 'index' ? 'class="active"' : ''}>Home</a></li>
          <li><a href="lesson_1.html" ${currentPage === 'lesson_1' ? 'class="active"' : ''}>Lesson 1: Basics</a></li>
          <li><a href="lesson_2.html" ${currentPage === 'lesson_2' ? 'class="active"' : ''}>Lesson 2: Functions</a></li>
          <li><a href="lesson_3.html" ${currentPage === 'lesson_3' ? 'class="active"' : ''}>Lesson 3: Control Flow</a></li>
          <li><a href="lesson_4.html" ${currentPage === 'lesson_4' ? 'class="active"' : ''}>Lesson 4: Data Structures</a></li>
          <li><a href="lesson_5.html" ${currentPage === 'lesson_5' ? 'class="active"' : ''}>Lesson 5: Python Quiz</a></li>
          <li><a href="lesson_6.html" ${currentPage === 'lesson_6' ? 'class="active"' : ''}>Lesson 6: Turtles!</a></li>
          <li><a href="lesson_7.html" ${currentPage === 'lesson_7' ? 'class="active"' : ''}>Lesson 7: Reflection!</a></li>
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