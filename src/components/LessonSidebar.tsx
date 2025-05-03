// src/components/LessonSidebar.tsx
import React from 'react';
import type { LessonSection } from '../types/data';
import styles from './LessonSidebar.module.css';

interface LessonSidebarProps {
  sections: LessonSection[];
  completedSections: Set<string>; // Use a Set for efficient lookup
  // Optional: Add onClick handler for smooth scrolling later
  // onLinkClick?: (sectionId: string) => void;
}

const LessonSidebar: React.FC<LessonSidebarProps> = ({
  sections,
  completedSections,
  // onLinkClick
}) => {

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    // Prevent default jump
    event.preventDefault();
    // Find target element
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
        // Smooth scroll (optional)
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update URL hash manually if needed, without triggering full navigation
        // window.history.pushState(null, '', `#${sectionId}`);
    }
    // Call prop handler if provided
    // onLinkClick?.(sectionId);
  };


  if (!sections || sections.length === 0) {
    return (
      <aside className={styles.sidebar}>
        <h3 className={styles.title}>In This Lesson</h3>
        <p className={styles.loading}>Loading sections...</p>
      </aside>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.title}>In This Lesson</h3>
      <ul className={styles.sectionList}>
        {sections.map((section) => {
          const isCompleted = completedSections.has(section.id);
          const itemClass = isCompleted
            ? `${styles.sectionItem} ${styles.sectionItemCompleted}`
            : styles.sectionItem;

          return (
            <li key={section.id} className={itemClass} data-section-id={section.id}>
              <a
                href={`#${section.id}`}
                className={styles.sectionLink}
                // Add onClick for optional smooth scrolling later
                onClick={(e) => handleLinkClick(e, section.id)}
              >
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>
      {/* Placeholder for Progress Saved notification - could be added here or managed globally */}
      {/* <div id="progress-saved-indicator"></div> */}
    </aside>
  );
};

export default LessonSidebar;