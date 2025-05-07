// src/components/Header.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Header.module.css";
import { BASE_PATH } from "../config";
import LessonNavigation from "./LessonNavigation";

const Header: React.FC = () => {
  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.title}>Learn Python in the Browser</h1>
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
            <li>
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
          <LessonNavigation />
        </nav>
      </div>
    </header>
  );
};

export default Header;
