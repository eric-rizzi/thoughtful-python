// src/components/Header.tsx
import React from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
// Assuming styles from base.css are available globally or ported to Header.module.css
// import styles from './Header.module.css';
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
    <div className="lesson-navigation" style={{ marginLeft: 'auto', color: 'rgba(255, 255, 255, 0.8)' }}>
      <span>{/* Placeholder for: ← Prev | Lesson X of Y | Next → */}</span>
      <span> Lesson: {lessonId.replace('lesson_', '')} (Nav Placeholder)</span>
    </div>
  );
};


const Header: React.FC = () => {
  const navLinkStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
    fontWeight: isActive ? 600 : 400,
  });

  // You might need BASE_PATH if deploying to GitHub Pages subdirectory
  const BASE_PATH = '/thoughtful-python'; // Example, adjust as needed or import from config

  return (
    // Use className={styles.header} if using CSS Modules
    <header style={{ backgroundColor: '#4b8bbe', color: 'white', padding: '1rem 0', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}> {/* Assuming 'container' class */}
        <h1 style={{ fontSize: '1.8rem', margin: '0', marginRight: '2rem' }}>Learn Python in the Browser</h1>
        <nav style={{ display: 'flex', flexGrow: 1 }}>
          <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem', padding: 0, margin: 0, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Use NavLink for links that need an 'active' state */}
            <li><NavLink to={`${BASE_PATH}/`} style={navLinkStyle} end>Home</NavLink></li>
            <li><NavLink to={`${BASE_PATH}/unit/intro_python`} style={navLinkStyle}>Learning Paths</NavLink></li>
            <li><NavLink to={`${BASE_PATH}/learning-entries`} style={navLinkStyle}>Learning Entries</NavLink></li>
            {/* Add other main links as needed, potentially disabling them */}
             <li>
               <span style={{ opacity: 0.6, cursor: 'not-allowed', padding: '0.5rem 0.75rem' }}>
                 Code Editor (soon)
               </span>
             </li>
          </ul>
          {/* Placeholder for context-specific lesson navigation */}
          <LessonNavigationPlaceholder />
        </nav>
      </div>
    </header>
  );
};

export default Header;