// src/pages/UnitPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchUnitById,
  fetchLessonData,
  getRequiredSectionsForLesson,
} from "../lib/dataLoader";
import type { Unit, Lesson } from "../types/data";
import styles from "./UnitPage.module.css";
import { useAllCompletions } from "../stores/progressStore";

type CompletionStatus = {
  text: string;
  class: string;
};

const UnitPage: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [lessonsData, setLessonsData] = useState<Map<string, Lesson | null>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get all completion data from the Zustand store
  const allCompletions = useAllCompletions();

  useEffect(() => {
    const loadUnitAndLessons = async () => {
      if (!unitId) {
        setError("No Unit ID provided in URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setLessonsData(new Map());

      try {
        const fetchedUnit = await fetchUnitById(unitId);
        if (!fetchedUnit) {
          throw new Error(`Unit with ID "${unitId}" not found.`);
        }
        setUnit(fetchedUnit);
        document.title = `${fetchedUnit.title} - Python Lessons`;

        // Fetch all lessons for this unit concurrently
        const lessonPromises = fetchedUnit.lessons.map((lessonId) =>
          fetchLessonData(lessonId)
            .then((data) => ({
              id: lessonId,
              status: "fulfilled",
              value: data,
            }))
            .catch((err) => ({ id: lessonId, status: "rejected", reason: err }))
        );

        // Use Promise.all to await all lesson fetches
        const results = await Promise.all(lessonPromises);
        const loadedLessons = new Map<string, Lesson | null>();
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            loadedLessons.set(result.id, result.value);
          } else {
            console.error(`Failed to load lesson ${result.id}:`, result.reason);
            loadedLessons.set(result.id, null);
          }
        });
        setLessonsData(loadedLessons);
      } catch (err) {
        console.error("Error loading unit page:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setUnit(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUnitAndLessons();
  }, [unitId]);

  // Memoize lesson statuses using data from Zustand store
  const lessonStatuses = useMemo(() => {
    console.log(
      "UnitPage: Recalculating lesson statuses based on Zustand. Current allCompletions:",
      allCompletions
    );
    const statuses = new Map<string, CompletionStatus>();
    if (unit) {
      unit.lessons.forEach((lessonId) => {
        let status: CompletionStatus = {
          text: "Loading info...",
          class: "not-started",
        }; // Default
        const lesson = lessonsData.get(lessonId);

        if (lesson === null) {
          // Failed to load lesson data
          status = { text: "Info unavailable", class: "not-started" };
        } else if (lesson) {
          // Lesson data is available
          try {
            // Get completed sections for *this* lessonId from the Zustand state
            let completedSectionsForThisLesson = new Set<string>();
            if (allCompletions && lessonId in allCompletions) {
              completedSectionsForThisLesson = new Set(
                Object.keys(allCompletions[lessonId])
              );
            }

            const requiredSections = getRequiredSectionsForLesson(lesson);

            if (requiredSections.length === 0) {
              status = { text: "Not applicable", class: "not-started" };
            } else if (completedSectionsForThisLesson.size === 0) {
              status = { text: "Not started", class: "not-started" };
            } else {
              const completedRequiredCount = requiredSections.filter(
                (sectionId) => completedSectionsForThisLesson.has(sectionId)
              ).length;

              if (completedRequiredCount >= requiredSections.length) {
                status = { text: "Completed", class: "completed" };
              } else if (completedRequiredCount > 0) {
                const percentage = Math.round(
                  (completedRequiredCount / requiredSections.length) * 100
                );
                status = {
                  text: `${percentage}% complete`,
                  class: "in-progress",
                };
              } else {
                status = { text: "Started", class: "in-progress" };
              }
            }
          } catch (e) {
            console.error(`Error calculating status for ${lessonId}:`, e);
            status = { text: "Status Error", class: "not-started" };
          }
        }
        statuses.set(lessonId, status);
      });
    }
    return statuses;
  }, [unit, lessonsData, allCompletions]); // Re-calculate when unit, lessonsData, OR allCompletions from Zustand changes

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
        <Link to="/" className={styles.backLink}>
          &larr; Back to Learning Paths
        </Link>
      </div>
    );
  }

  if (!unit) {
    // Should be covered by error state, but as a fallback
    return (
      <div className={styles.loading}>
        <p>Unit data could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className={styles.unitContainer}>
      <Link to="/" className={styles.backLink}>
        &larr; Back to Learning Paths
      </Link>
      <div className={styles.unitHeader}>
        <h2 className={styles.unitTitle}>{unit.title}</h2>
        <p className={styles.unitDescription}>{unit.description}</p>
      </div>
      <div className={styles.lessonsList}>
        {unit.lessons.map((lessonPath, index) => {
          const lesson = lessonsData.get(lessonPath);
          const status = lessonStatuses.get(lessonPath) || {
            text: "Loading...",
            class: "not-started",
          };

          // Handle case where lesson data failed to load
          if (lesson === null) {
            return (
              <div
                key={lessonPath}
                className={`${styles.lessonCard} ${styles.lessonCardError}`}
              >
                <div className={styles.lessonNumber}>Lesson {index + 1}</div>
                <h3 className={styles.lessonTitle}>Lesson Unavailable</h3>
                <p className={styles.lessonDescription}>
                  Could not load data for {lessonPath}.
                </p>
              </div>
            );
          }
          // Handle case where lesson data is still loading (should be brief)
          if (!lesson) {
            return (
              <div key={lessonPath} className={styles.lessonCard}>
                <div className={styles.lessonNumber}>Lesson {index + 1}</div>
                <h3 className={styles.lessonTitle}>Loading...</h3>
              </div>
            );
          }

          // Render normal lesson card
          return (
            <Link
              // lessonPath is used here to build the link URL
              to={`/lesson/${lessonPath}`}
              // lessonPath is used here as the unique React key
              key={lessonPath}
              className={styles.lessonCardLink}
            >
              <div className={styles.lessonCard}>
                <div className={styles.lessonNumber}>Lesson {index + 1}</div>
                <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                <p className={styles.lessonDescription}>{lesson.description}</p>
                <div className={styles.lessonStatus}>
                  {status.class === "completed" ? (
                    <span
                      className={`${styles.checkmarkIcon} ${styles.statusCompleted}`}
                    >
                      ✓
                    </span>
                  ) : (
                    <span
                      className={`${styles.statusDot} ${styles[status.class]}`}
                    ></span>
                  )}
                  <span>{status.text}</span>{" "}
                  {/* Added span around status.text for consistent styling if needed */}
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
