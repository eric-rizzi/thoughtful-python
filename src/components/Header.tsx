// src/components/Header.tsx
import React from "react";
import { NavLink, useLocation, useParams } from "react-router-dom";
import styles from "./Header.module.css";

// Placeholder for dynamic lesson navigation
const LessonNavigationPlaceholder: React.FC = () => {
  const { lessonId } = useParams<{ lessonId?: string }>();
  const location = useLocation();
  const isLessonPage = location.pathname.includes("/lesson/");

  if (!isLessonPage || !lessonId) {
    return null; // Only show on lesson pages
  }

  // Placeholder - Real implementation needs current lesson number, total, prev/next logic
  return (
    <div className={styles.lessonNavigation}>
      <span> Lesson: {lessonId.replace("lesson_", "")} (Nav Placeholder)</span>
    </div>
  );
};

const Header: React.FC = () => {
  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>Learn Python in the Browser</h1>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {/* Use paths relative to the application root */}
            <li>
              <NavLink to="/" className={getNavLinkClass} end>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/unit/intro_python" className={getNavLinkClass}>
                Learning Paths
              </NavLink>
            </li>
            <li>
              <NavLink to="/editor" className={getNavLinkClass}>
                Code Editor
              </NavLink>
            </li>{" "}
            <li>
              <NavLink to="/learning-entries" className={getNavLinkClass}>
                Learning Entries
              </NavLink>
            </li>
            {/* ... */}
          </ul>
          <LessonNavigationPlaceholder />
        </nav>
      </div>
    </header>
  );
};

export default Header;
