// src/components/Header.tsx
import React from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import styles from './Header.module.css'; // Import CSS Module
// Assuming BASE_PATH is defined or imported from a config file if needed for production on GitHub Pages
// import { BASE_PATH } from '../config'; // Example import

// Placeholder for dynamic lesson navigation - needs state/props later
const LessonNavigationPlaceholder: React.FC = () => {
  const { lessonId } = useParams<{ lessonId?: string }>();
  const location = useLocation();
  const isLessonPage = location.pathname.includes('/lesson/');

  if (!isLessonPage || !lessonId) {
    return null; // Only show on lesson pages
  }

  // Placeholder - Real implementation needs current lesson number, total, prev/next logic
  return (
    <div className={styles.lessonNavigation}>
      <span> Lesson: {lessonId.replace('lesson_', '')} (Nav Placeholder)</span>
    </div>
  );
};


const Header: React.FC = () => {
  // Function to apply active class using CSS Modules
  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  // You might need BASE_PATH if deploying to GitHub Pages subdirectory
  const BASE_PATH = '/thoughtful-python'; // Example, adjust as needed or import from config

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>Learn Python in the Browser</h1>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li><NavLink to={`${BASE_PATH}/`} className={getNavLinkClass} end>Home</NavLink></li>
            <li><NavLink to={`${BASE_PATH}/unit/intro_python`} className={getNavLinkClass}>Learning Paths</NavLink></li>
            <li><NavLink to={`${BASE_PATH}/learning-entries`} className={getNavLinkClass}>Learning Entries</NavLink></li>
             <li>
                {/* Example of a disabled-looking link */}
               <span className={styles.navLinkDisabled}>
                 Code Editor (soon)
               </span>
             </li>
          </ul>
          <LessonNavigationPlaceholder />
        </nav>
      </div>
    </header>
  );
};

export default Header;