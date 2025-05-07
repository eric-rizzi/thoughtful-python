// src/components/Header.tsx
import React from "react";
import { NavLink } from "react-router-dom"; // Removed useLocation
import styles from "./Header.module.css";

const Header: React.FC = () => {
  // Removed useLocation and isLessonPage check

  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  const getLearningPathsClass = ({
    isActive,
  }: {
    isActive: boolean;
  }): string => {
    let classes = styles.navLink;
    // Check if current path starts with /unit/ (relative to basename)
    if (isActive || location.pathname.startsWith(`/unit/`)) {
      classes += ` ${styles.navLinkActive}`;
    }
    return classes;
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>Thoughtful Python</h1>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <NavLink to="/" className={getNavLinkClass} end>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/unit/intro_python"
                className={getLearningPathsClass}
              >
                Learning Paths
              </NavLink>
            </li>
            <li>
              <NavLink to="/editor" className={getNavLinkClass}>
                Code Editor
              </NavLink>
            </li>
            <li>
              <NavLink to="/learning-entries" className={getNavLinkClass}>
                Learning Entries
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
