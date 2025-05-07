// src/components/LessonNavigation.tsx
import React from "react";
import { NavLink, useParams, useLocation } from "react-router-dom";
import styles from "./Header.module.css"; // Reuse header styles for consistency
import { TOTAL_LESSONS, BASE_PATH } from "../config"; // Import TOTAL_LESSONS

const LessonNavigation: React.FC = () => {
  const { lessonId: currentLessonId } = useParams<{ lessonId?: string }>();
  const location = useLocation();

  // Only show navigation if we are on a lesson page and have a lessonId
  if (!location.pathname.includes("/lesson/") || !currentLessonId) {
    return null;
  }

  const lessonNumberMatch = currentLessonId.match(/^lesson_(\d+)$/);
  if (!lessonNumberMatch || !lessonNumberMatch[1]) {
    console.warn(
      `LessonNavigation: Could not parse lesson number from ${currentLessonId}`
    );
    return null; // Or some error display
  }

  const currentLessonNum = parseInt(lessonNumberMatch[1], 10);

  let prevLessonId: string | null = null;
  let nextLessonId: string | null = null;

  if (currentLessonNum > 1) {
    prevLessonId = `lesson_${currentLessonNum - 1}`;
  }

  if (currentLessonNum < TOTAL_LESSONS) {
    nextLessonId = `lesson_${currentLessonNum + 1}`;
  }

  const getNavLinkClass = (isActive: boolean, isDisabled: boolean): string => {
    if (isDisabled) {
      return `${styles.navLink} ${styles.navLinkDisabled}`;
    }
    return isActive
      ? `${styles.navLink} ${styles.navLinkActive}`
      : styles.navLink;
  };

  return (
    <div className={styles.lessonNavigation}>
      {prevLessonId ? (
        <NavLink
          to={`${BASE_PATH}lesson/${prevLessonId}`}
          className={({ isActive }) => getNavLinkClass(isActive, false)}
          aria-label="Previous Lesson"
        >
          &larr; Previous
        </NavLink>
      ) : (
        <span className={`${styles.navLink} ${styles.navLinkDisabled}`}>
          &larr; Previous
        </span>
      )}

      <span className={styles.lessonCurrentIndicator}>
        Lesson {currentLessonNum} of {TOTAL_LESSONS}
      </span>

      {nextLessonId ? (
        <NavLink
          to={`${BASE_PATH}lesson/${nextLessonId}`}
          className={({ isActive }) => getNavLinkClass(isActive, false)}
          aria-label="Next Lesson"
        >
          Next &rarr;
        </NavLink>
      ) : (
        <span className={`${styles.navLink} ${styles.navLinkDisabled}`}>
          Next &rarr;
        </span>
      )}
    </div>
  );
};

export default LessonNavigation;
