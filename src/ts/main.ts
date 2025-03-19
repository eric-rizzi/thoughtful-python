// main.ts - Modified for GitHub Pages
// Import CSS files in the correct order
import '../css/base.css';       // Base styles first
import '../css/lessons.css';    // Lesson-specific styles second
import '../css/exercises.css';  // Exercise styles last

// Import utility for page layout
import { initializePageLayout } from './utils/html-loader';
import { createLessonController } from './lesson-factory';
import { BASE_PATH } from './config';

document.addEventListener('DOMContentLoaded', () => {
  // Determine current page from URL
  const currentPath = window.location.pathname;
  
  // Remove base path from the pathname
  const relativePath = currentPath.replace(BASE_PATH, '').replace(/^\//, '');
  
  let currentPage = 'index';
  
  // Extract lesson ID from path
  const lessonMatch = relativePath.match(/lesson_(\d+)\.html/);
  if (lessonMatch) {
    currentPage = `lesson_${lessonMatch[1]}`;
    
    // Create the appropriate controller
    createLessonController(currentPage);
  }
  
  // Initialize common page components
  initializePageLayout(currentPage);
});