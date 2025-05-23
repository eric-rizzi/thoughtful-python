// src/pages/ProgressPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  fetchUnitsData,
  fetchLessonData,
  getRequiredSectionsForLesson,
} from "../lib/dataLoader";
import { useAllCompletions } from "../stores/progressStore";
import type { Unit, Lesson } from "../types/data"; // Import Lesson type
import styles from "./ProgressPage.module.css"; // New CSS module

interface LessonCompletionStatus {
  lessonId: string;
  title: string;
  isCompleted: boolean;
}

interface UnitProgress {
  unitId: string;
  title: string;
  lessons: LessonCompletionStatus[];
}

const ProgressPage: React.FC = () => {
  const [unitsProgress, setUnitsProgress] = useState<UnitProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const allCompletions = useAllCompletions(); // Get all completed sections from Zustand

  useEffect(() => {
    let isMounted = true;

    const loadProgressData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const unitsData = await fetchUnitsData();
        const fetchedUnits = unitsData.units;

        const unitProgressPromises = fetchedUnits.map(async (unit) => {
          const lessonPromises = unit.lessons.map(async (lessonPath) => {
            let lesson: Lesson | null = null;
            try {
              lesson = await fetchLessonData(lessonPath);
            } catch (lessonError) {
              console.error(
                `Failed to load lesson data for ${lessonPath}:`,
                lessonError
              );
              // If a lesson can't be loaded, treat it as incomplete for progress display
              return {
                lessonId: lessonPath,
                title: `Lesson ${
                  lessonPath.split("/").pop()?.replace("lesson_", "") || "N/A"
                } (Unavailable)`,
                isCompleted: false,
              };
            }

            // Get completed sections for this specific lesson from the global store
            const completedSectionsForLesson = new Set(
              allCompletions[lessonPath] || []
            );
            const requiredSections = lesson
              ? getRequiredSectionsForLesson(lesson)
              : [];

            // A lesson is complete ONLY if all required sections are completed
            const isLessonComplete =
              requiredSections.length > 0 &&
              requiredSections.every((sectionId) =>
                completedSectionsForLesson.has(sectionId)
              );

            return {
              lessonId: lessonPath,
              title:
                lesson?.title ||
                `Lesson ${
                  lessonPath.split("/").pop()?.replace("lesson_", "") || "N/A"
                }`,
              isCompleted: isLessonComplete,
            };
          });

          const lessons = await Promise.all(lessonPromises);
          return {
            unitId: unit.id,
            title: unit.title,
            lessons: lessons,
          };
        });

        const results = await Promise.all(unitProgressPromises);
        if (isMounted) {
          setUnitsProgress(results);
        }
      } catch (err) {
        console.error("Error loading progress data:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load progress data."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProgressData();

    return () => {
      isMounted = false; // Cleanup for unmounted component
    };
  }, [allCompletions]); // Re-run if global completion state changes

  const renderUnitProgress = (unit: UnitProgress) => {
    return (
      <div key={unit.unitId} className={styles.unitProgressContainer}>
        <h3 className={styles.unitTitle}>{unit.title}</h3>
        <div className={styles.lessonsCircles}>
          {unit.lessons.map((lesson, index) => (
            <Link
              to={`/lesson/${lesson.lessonId}`}
              key={lesson.lessonId}
              className={styles.lessonCircleLink}
              title={`${lesson.title} (${
                lesson.isCompleted ? "Completed" : "In Progress"
              })`}
            >
              <div
                className={`${styles.lessonCircle} ${
                  lesson.isCompleted
                    ? styles.completedCircle
                    : styles.incompleteCircle
                }`}
              >
                {index + 1} {/* Display lesson number inside circle */}
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.progressPageContainer}>
        <div className={styles.loadingMessage}>
          <p>Loading your progress...</p>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.progressPageContainer}>
        <div className={styles.errorMessage}>
          <h2>Error Loading Progress</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (unitsProgress.length === 0) {
    return (
      <div className={styles.progressPageContainer}>
        <div className={styles.noProgressMessage}>
          <p>No learning units found or no progress recorded yet.</p>
          <Link to="/" className={styles.primaryButton}>
            Start Learning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.progressPageContainer}>
      <h2>Your Learning Progress</h2>
      <p className={styles.introText}>
        Track your progress through the Python learning units.
      </p>
      {unitsProgress.map(renderUnitProgress)}
    </div>
  );
};

export default ProgressPage;
