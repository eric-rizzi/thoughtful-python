// src/components/Header.tsx
import React from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import styles from './Header.module.css'; // Import CSS Module

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

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.title}>Learn Python in the Browser</h1>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {/* Use paths relative to the application root */}
            <li><NavLink to="/" className={getNavLinkClass} end>Home</NavLink></li>
            <li><NavLink to="/unit/intro_python" className={getNavLinkClass}>Learning Paths</NavLink></li>
            <li><NavLink to="/learning-entries" className={getNavLinkClass}>Learning Entries</NavLink></li>
             <li>
               <span className={styles.navLinkDisabled}>
                 Code Editor (soon)
               </span>
             </li>
             {/* Add other NavLinks similarly, e.g., <NavLink to="/about" ...> */}
          </ul> 
          <LessonNavigationPlaceholder />
        </nav>
      </div>
    </header>
  );
};

export default Header;