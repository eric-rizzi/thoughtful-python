// src/pages/UnitPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchUnitById, fetchLessonData, getRequiredSectionsForLesson } from '../lib/dataLoader';
import type { Unit, Lesson } from '../types/data';
import styles from './UnitPage.module.css';
import { BASE_PATH } from '../config'; // For back link

// Define completion status type
type CompletionStatus = {
    text: string;
    class: string;
};

const UnitPage: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [lessonsData, setLessonsData] = useState<Map<string, Lesson | null>>(new Map()); // Store lesson data or null if failed
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUnitAndLessons = async () => {
      if (!unitId) {
        setError("No Unit ID provided in URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setLessonsData(new Map()); // Reset lessons data on unitId change

      try {
        const fetchedUnit = await fetchUnitById(unitId);
        if (!fetchedUnit) {
          throw new Error(`Unit with ID "${unitId}" not found.`);
        }
        setUnit(fetchedUnit);
        document.title = `${fetchedUnit.title} - Python Lessons`; // Update page title

        // Fetch all lessons for this unit concurrently
        const lessonPromises = fetchedUnit.lessons.map(lessonId =>
          fetchLessonData(lessonId)
            .then(data => ({ id: lessonId, status: 'fulfilled', value: data }))
            .catch(err => ({ id: lessonId, status: 'rejected', reason: err }))
        );

        const results = await Promise.allSettled(lessonPromises);
        const loadedLessons = new Map<string, Lesson | null>();
        results.forEach(result => {
           // Check if result is promise and fulfilled or rejected
            if (result.status === 'fulfilled') {
                // Now result.value has the structure { id: string, status: string, value: Lesson }
                const lessonResult = result.value as { id: string, status: 'fulfilled', value: Lesson };
                 loadedLessons.set(lessonResult.id, lessonResult.value);
            } else {
                 // Result is promise and rejected
                const lessonResult = result as { id: string, status: 'rejected', reason: any };
                 console.error(`Failed to load lesson ${lessonResult.id}:`, lessonResult.reason);
                 loadedLessons.set(lessonResult.id, null); // Mark as failed to load
            }
        });
        setLessonsData(loadedLessons);

      } catch (err) {
        console.error("Error loading unit page:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setUnit(null); // Clear unit data on error
      } finally {
        setIsLoading(false);
      }
    };

    loadUnitAndLessons();
  }, [unitId]); // Re-run effect if unitId changes

  // Function to calculate completion status for a single lesson
  const calculateLessonStatus = (lessonId: string): CompletionStatus => {
    const lesson = lessonsData.get(lessonId);
    if (!lesson) {
        // Handle case where lesson data failed to load or isn't available yet
        return { text: 'Info unavailable', class: 'not-started' };
    }

    try {
      const storageKey = `python_${lessonId}_completed`;
      const completedSections: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const requiredSections = getRequiredSectionsForLesson(lesson); // Use helper

      if (requiredSections.length === 0) {
          // If lesson has no sections requiring active completion, consider it 'viewed' if visited?
          // Or maybe just 'Not Started' until explicitly marked otherwise. Let's use 'Not Started'.
          return { text: 'Not applicable', class: 'not-started' };
      }

      if (completedSections.length === 0) {
        return { text: 'Not started', class: 'not-started' };
      }

      const completedRequiredCount = requiredSections.filter(sectionId =>
        completedSections.includes(sectionId)
      ).length;

      if (completedRequiredCount >= requiredSections.length) {
        return { text: 'Completed', class: 'completed' };
      } else if (completedRequiredCount > 0) {
        const percentage = Math.round((completedRequiredCount / requiredSections.length) * 100);
        return { text: `${percentage}% complete`, class: 'in-progress' };
      } else {
        return { text: 'Started', class: 'in-progress' }; // Started but no required sections done yet
      }
    } catch (e) {
      console.error(`Error calculating status for ${lessonId}:`, e);
      return { text: 'Error checking status', class: 'not-started' };
    }
  };

  // Memoize lesson statuses to avoid recalculating on every render
  const lessonStatuses = useMemo(() => {
    const statuses = new Map<string, CompletionStatus>();
    if (unit) {
        unit.lessons.forEach(lessonId => {
            statuses.set(lessonId, calculateLessonStatus(lessonId));
        });
    }
    return statuses;
    // Recalculate only when unit or lessonsData changes
  }, [unit, lessonsData]);


  // --- Rendering Logic ---

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <p>Loading unit content...</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
        <div className={styles.error}>
            <p>Error loading unit: {error}</p>
             <Link to={`${BASE_PATH}/`} className={styles.backLink}>&larr; Back to Learning Paths</Link>
        </div>
    );
  }

  if (!unit) {
    // Should be covered by error state, but as a fallback
    return <div className={styles.loading}><p>Unit data could not be loaded.</p></div>;
  }

  // Main render
  return (
    <div className={styles.unitContainer}>
      <Link to={`${BASE_PATH}/`} className={styles.backLink}>&larr; Back to Learning Paths</Link>

      <div className={styles.unitHeader}>
        <h2 className={styles.unitTitle}>{unit.title}</h2>
        <p className={styles.unitDescription}>{unit.description}</p>
      </div>

      <div className={styles.lessonsList}>
        {unit.lessons.map((lessonId, index) => {
          const lesson = lessonsData.get(lessonId);
          const status = lessonStatuses.get(lessonId) || { text: 'Loading...', class: 'not-started' };

          // Handle case where lesson data failed to load
          if (lesson === null) {
            return (
              <div key={lessonId} className={`${styles.lessonCard} ${styles.lessonCardError}`}>
                  <div className={styles.lessonNumber}>Lesson {index + 1}</div>
                  <h3 className={styles.lessonTitle}>Lesson Unavailable</h3>
                  <p className={styles.lessonDescription}>Could not load data for {lessonId}.</p>
              </div>
            );
          }
          // Handle case where lesson data is still loading (should be brief)
          if (!lesson) {
            return (
              <div key={lessonId} className={styles.lessonCard}>
                  <div className={styles.lessonNumber}>Lesson {index + 1}</div>
                   <h3 className={styles.lessonTitle}>Loading...</h3>
              </div>
            );
          }

          // Render normal lesson card
          return (
            <Link to={`${BASE_PATH}lesson/${lessonId}`} key={lessonId} className={styles.lessonCardLink}>
              <div className={styles.lessonCard}>
                <div className={styles.lessonNumber}>Lesson {index + 1}</div>
                <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                <p className={styles.lessonDescription}>{lesson.description}</p>
                <div className={styles.lessonStatus}>
                  <span className={`${styles.statusDot} ${styles[status.class]}`}></span>
                  {status.text}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default UnitPage;