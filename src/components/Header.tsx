// src/components/Header.tsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import styles from "./Header.module.css";
import { BASE_PATH } from "../config";
import LessonNavigation from "./LessonNavigation";

const Header: React.FC = () => {
  const location = useLocation();
  // Check if the current path starts with '/lesson/'
  const isLessonPage = location.pathname.startsWith(`${BASE_PATH}lesson/`);

  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>Thoughtful Python</h1>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <NavLink to={`${BASE_PATH}`} className={getNavLinkClass} end>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${BASE_PATH}unit/intro_python`}
                className={getNavLinkClass}
              >
                Learning Paths
              </NavLink>
            </li>
            {!isLessonPage && (
              <li>
                <NavLink to={`${BASE_PATH}editor`} className={getNavLinkClass}>
                  Code Editor
                </NavLink>
              </li>
            )}
            <li>
              <NavLink
                to={`${BASE_PATH}learning-entries`}
                className={getNavLinkClass}
              >
                Learning Entries
              </NavLink>
            </li>
          </ul>
          <LessonNavigation />
        </nav>
      </div>
    </header>
  );
};

export default Header;
