// main.ts - Modified to include lesson_5
// Import CSS files in the correct order
import '../css/base.css';       // Base styles first
import '../css/lessons.css';    // Lesson-specific styles second
import '../css/exercises.css';  // Exercise styles last

// Import utility for page layout
import { initializePageLayout } from './utils/html-loader';
import { createLessonController } from './lesson-factory';

document.addEventListener('DOMContentLoaded', () => {
  // Determine current page from URL
  const currentPath = window.location.pathname;
  let currentPage = 'index';
  
  // Extract lesson ID from path
  const lessonMatch = currentPath.match(/lesson_(\d+)/);
  if (lessonMatch) {
    currentPage = `lesson_${lessonMatch[1]}`;
    
    // Create the appropriate controller
    createLessonController(currentPage);
  }
  
  // Initialize common page components
  initializePageLayout(currentPage);
});