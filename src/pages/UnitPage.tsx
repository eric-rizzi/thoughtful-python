// src/pages/UnitPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  fetchUnitById,
  fetchLessonData,
  getRequiredSectionsForLesson,
} from "../lib/dataLoader";
import type { Unit, Lesson, UnitId, LessonId } from "../types/data";
import styles from "./UnitPage.module.css";
import { useAllCompletions } from "../stores/progressStore";
import LoadingSpinner from "../components/LoadingSpinner";

type CompletionStatus = {
  text: string;
  class: string;
};

const UnitPage: React.FC = () => {
  const { unitId } = useParams<{ unitId: UnitId }>();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [lessonsData, setLessonsData] = useState<Map<LessonId, Lesson | null>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

        const lessonPromises = fetchedUnit.lessons.map((lessonReference) =>
          fetchLessonData(lessonReference.guid)
            .then((data) => ({
              guid: lessonReference.guid,
              status: "fulfilled",
              value: data,
            }))
            .catch((err) => ({
              guid: lessonReference.guid,
              status: "rejected",
              reason: err,
            }))
        );

        const results = await Promise.all(lessonPromises);
        const loadedLessons = new Map<LessonId, Lesson | null>();
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            loadedLessons.set(result.guid, result.value);
          } else {
            console.error(
              `Failed to load lesson ${result.guid}:`,
              result.reason
            );
            loadedLessons.set(result.guid, null);
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

  const lessonStatuses = useMemo(() => {
    const statuses = new Map<LessonId, CompletionStatus>();
    if (unit) {
      unit.lessons.forEach((lessonReference) => {
        let status: CompletionStatus = {
          text: "Loading info...",
          class: "not-started",
        };
        const lesson = lessonsData.get(lessonReference.guid);

        if (lesson === null) {
          status = { text: "Info unavailable", class: "not-started" };
        } else if (lesson) {
          try {
            let completedSectionsForThisLesson = new Set<string>();
            if (allCompletions && lessonReference.guid in allCompletions) {
              completedSectionsForThisLesson = new Set(
                Object.keys(allCompletions[lessonReference.guid])
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
            console.error(
              `Error calculating status for ${lessonReference.guid}:`,
              e
            );
            status = { text: "Status Error", class: "not-started" };
          }
        }
        statuses.set(lessonReference.guid, status);
      });
    }
    return statuses;
  }, [unit, lessonsData, allCompletions]);

  if (isLoading) {
    return <LoadingSpinner message="Loading unit content..." />;
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
    return (
      <div className={styles.error}>
        <p>Unit data could not be loaded.</p>
        <Link to="/" className={styles.backLink}>
          &larr; Back to Learning Paths
        </Link>
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
        <p className={styles.unitDescription}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {unit.description}
          </ReactMarkdown>
        </p>
      </div>
      <div className={styles.lessonsList}>
        {unit.lessons.map((lessonReference, index) => {
          const lesson = lessonsData.get(lessonReference.guid);
          const status = lessonStatuses.get(lessonReference.guid) || {
            text: "Loading...",
            class: "not-started",
          };

          if (lesson === null) {
            return (
              <div
                key={lessonReference.guid}
                className={`${styles.lessonCard} ${styles.lessonCardError}`}
              >
                <div className={styles.lessonNumber}>Lesson {index + 1}</div>
                <h3 className={styles.lessonTitle}>Lesson Unavailable</h3>
                <p className={styles.lessonDescription}>
                  Could not load data for {lessonReference.guid}.
                </p>
              </div>
            );
          }
          if (!lesson) {
            return (
              <div key={lessonReference.guid} className={styles.lessonCard}>
                <div className={styles.lessonNumber}>Lesson {index + 1}</div>
                <h3 className={styles.lessonTitle}>Loading...</h3>
              </div>
            );
          }

          return (
            <Link
              to={`/lesson/${lessonReference.guid}`}
              key={lessonReference.guid}
              className={styles.lessonCardLink}
            >
              <div className={styles.lessonCard}>
                <div className={styles.lessonNumber}>Lesson {index + 1}</div>
                <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                <p className={styles.lessonDescription}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {lesson.description}
                  </ReactMarkdown>
                </p>
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
                  <span>{status.text}</span>
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
