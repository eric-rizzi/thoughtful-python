// src/components/LessonNavigation.tsx
import React from "react";
import { NavLink } from "react-router-dom";
// Import the new CSS Module
import styles from "./LessonNavigation.module.css";
import { LessonId } from "../types/data";

interface LessonNavigationProps {
  lessonId: LessonId;
  prevLessonId: LessonId | null;
  nextLessonId: LessonId | null;
  currentPosition: number;
  totalInUnit: number;
}

const LessonNavigation: React.FC<LessonNavigationProps> = ({
  // lessonId,
  prevLessonId,
  nextLessonId,
  currentPosition,
  totalInUnit,
}) => {
  // Helper to get link classes (including disabled state)
  const getNavLinkClass = (isTargetAvailable: boolean): string => {
    let classes = styles.navLink;
    if (!isTargetAvailable) {
      classes += ` ${styles.navLinkDisabled}`;
    }
    return classes;
  };

  if (totalInUnit <= 0) {
    return null;
  }

  return (
    // Use the container class from the new CSS module
    <div className={styles.navigationContainer}>
      {prevLessonId ? (
        <NavLink
          // Use path relative to basename
          to={`/lesson/${prevLessonId}`}
          className={getNavLinkClass(true)}
          aria-label="Previous Lesson"
        >
          &larr; Previous
        </NavLink>
      ) : (
        // Use span for non-link disabled elements
        <span className={getNavLinkClass(false)}>&larr; Previous</span>
      )}

      <span className={styles.lessonCurrentIndicator}>
        Lesson {currentPosition} of {totalInUnit}
      </span>

      {nextLessonId ? (
        <NavLink
          // Use path relative to basename
          to={`/lesson/${nextLessonId}`}
          className={getNavLinkClass(true)}
          aria-label="Next Lesson"
        >
          Next &rarr;
        </NavLink>
      ) : (
        <span className={getNavLinkClass(false)}>Next &rarr;</span>
      )}
    </div>
  );
};

export default LessonNavigation;
