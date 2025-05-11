// src/components/Header.tsx
import React from "react";
import { NavLink } from "react-router-dom"; // Removed useLocation
import styles from "./Header.module.css";
import { useSettingsStore } from "../stores/settingsStore";

const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15A1.65 1.65 0 0 0 19.4 15z"></path>
  </svg>
);

const Header: React.FC = () => {
  const profileImageUrl = useSettingsStore((state) => state.profileImageUrl);
  const getNavLinkClass = ({ isActive }: { isActive: boolean }): string =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

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
        <div className={styles.settingsArea}>
          <NavLink
            to="/configure"
            className={styles.settingsLink}
            title="Configure Settings"
          >
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                className={styles.profileImage}
              />
            ) : (
              <SettingsIcon /> // Or use text: "Settings"
            )}
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default Header;
