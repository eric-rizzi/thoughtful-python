// main.ts - Modified to fix CSS import order
// Import CSS files in the correct order
import '../css/base.css';       // Base styles first

// Import utility for page layout
import { initializePageLayout } from './utils/html-loader';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Python in the Browser application initialized');
  
  // Determine current page from URL
  const currentPath = window.location.pathname;
  let currentPage = 'index';
  
  if (currentPath.includes('lesson_1')) {
    currentPage = 'lesson_1';
  } else if (currentPath.includes('lesson_2')) {
    currentPage = 'lesson_2';
  } else if (currentPath.includes('lesson_3')) {
    currentPage = 'lesson_3';
  } else if (currentPath.includes('lesson_4')) {
    currentPage = 'lesson_4';
  }
  
  // Initialize common page components
  initializePageLayout(currentPage);
});