// src/components/Header.tsx
import React from "react";
import { NavLink } from "react-router-dom"; // Removed useLocation
import styles from "./Header.module.css";
import { BASE_PATH } from "../config";

const Header: React.FC = () => {
  // Removed useLocation and isLessonPage check

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
                to={`${BASE_PATH}unit/intro_python`} // Example link
                className={(navData) =>
                  getNavLinkClass(navData) +
                  (location.pathname.startsWith(`${BASE_PATH}unit/`)
                    ? ` ${styles.navLinkActive}`
                    : "")
                } // Highlight if on any unit page
              >
                Learning Paths
              </NavLink>
            </li>
            <li>
              {/* This can always be shown now, or hidden based on other criteria */}
              <NavLink to={`${BASE_PATH}editor`} className={getNavLinkClass}>
                Code Editor
              </NavLink>
            </li>
            <li>
              <NavLink
                to={`${BASE_PATH}learning-entries`}
                className={getNavLinkClass}
              >
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
