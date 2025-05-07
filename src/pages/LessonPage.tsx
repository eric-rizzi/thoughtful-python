// src/pages/LessonPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom"; // Added useLocation
import { fetchLessonData, fetchUnitsData } from "../lib/dataLoader"; // Added fetchUnitsData
import type { Lesson, LessonSection } from "../types/data";

import LessonSidebar from "../components/LessonSidebar";
import InformationSection from "../components/sections/InformationSection";
import ObservationSection from "../components/sections/ObservationSection";
import TestingSection from "../components/sections/TestingSection";
import PredictionSection from "../components/sections/PredictionSection";
import MultipleChoiceSection from "../components/sections/MultipleChoiceSection";
import MultipleSelectionSection from "../components/sections/MultipleSelectionSection";
import TurtleSection from "../components/sections/TurtleSection";
import ReflectionSection from "../components/sections/ReflectionSection";
import CoverageSection from "../components/sections/CoverageSection";
import PRIMMSection from "../components/sections/PRIMMSection"; // Assuming this exists now
import LessonNavigation from "../components/LessonNavigation"; // IMPORT LessonNavigation

import styles from "./LessonPage.module.css";
import { useCompletedSectionsForLesson } from "../stores/progressStore";
import { BASE_PATH } from "../config";

const LessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unitLessons, setUnitLessons] = useState<string[]>([]);
  const [currentIndexInUnit, setCurrentIndexInUnit] = useState<number>(-1);
  const [parentUnitId, setParentUnitId] = useState<string | null>(null); // Optional: Store parent unit ID

  const completedSectionsArray = useCompletedSectionsForLesson(lessonId);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!lessonId) {
        if (isMounted) {
          setError("No Lesson ID provided in URL.");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      setLesson(null);
      setUnitLessons([]); // Reset unit context
      setCurrentIndexInUnit(-1);
      setParentUnitId(null);

      console.log(`LessonPage: Attempting to fetch lesson ${lessonId}`);
      try {
        // Fetch lesson and unit data concurrently
        const [fetchedLesson, unitsData] = await Promise.all([
          fetchLessonData(lessonId),
          fetchUnitsData(),
        ]);

        if (!isMounted) return; // Check mount status after awaits

        // Process lesson data
        setLesson(fetchedLesson);
        document.title = `${fetchedLesson.title} - Python Lesson`;
        console.log(`LessonPage: Successfully fetched ${lessonId}`);

        // Find unit context
        let foundUnitLessons: string[] | null = null;
        let foundIndex = -1;
        let foundUnitId: string | null = null;

        for (const unit of unitsData.units) {
          const index = unit.lessons.indexOf(lessonId);
          if (index !== -1) {
            foundUnitLessons = unit.lessons;
            foundIndex = index;
            foundUnitId = unit.id;
            break;
          }
        }

        if (foundUnitLessons) {
          setUnitLessons(foundUnitLessons);
          setCurrentIndexInUnit(foundIndex);
          setParentUnitId(foundUnitId);
          console.log(
            `LessonPage: Found unit context for ${lessonId} in unit ${foundUnitId}`
          );
        } else {
          console.warn(`Could not find unit context for lesson ${lessonId}`);
        }
      } catch (err) {
        console.error(`LessonPage Error fetching data for ${lessonId}:`, err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : `An unknown error occurred loading lesson ${lessonId}`
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
      console.log(
        `LessonPage: Unmounting or lessonId changing (${lessonId}), cleanup fetch.`
      );
    };
  }, [lessonId]); // Rerun effect if lessonId changes

  const completedSectionsSet = useMemo(() => {
    return new Set(completedSectionsArray);
  }, [completedSectionsArray]);

  const informationSections: Set<string> = useMemo(() => {
    if (!lesson) return new Set<string>();
    return new Set(
      lesson.sections
        .filter((section) => section.kind === "Information")
        .map((infoSection) => infoSection.id)
    );
  }, [lesson]);

  // Calculate prev/next based on unit context
  const prevLessonId =
    currentIndexInUnit > 0 ? unitLessons[currentIndexInUnit - 1] : null;
  const nextLessonId =
    currentIndexInUnit !== -1 && currentIndexInUnit < unitLessons.length - 1
      ? unitLessons[currentIndexInUnit + 1]
      : null;
  const currentPositionInUnit = currentIndexInUnit + 1; // 1-based index for display
  const totalLessonsInUnit = unitLessons.length;

  // Helper function to render the correct section component
  const renderSection = (section: LessonSection) => {
    switch (section.kind) {
      case "Information":
        return <InformationSection key={section.id} section={section} />;
      case "Observation":
        return (
          <ObservationSection
            key={section.id}
            lessonId={lessonId!}
            section={section}
          />
        );
      case "Testing":
        return (
          <TestingSection
            key={section.id}
            lessonId={lessonId!}
            section={section}
          />
        );
      case "Prediction":
        return (
          <PredictionSection
            key={section.id}
            lessonId={lessonId!}
            section={section as any}
          />
        ); // Use specific types if available
      case "MultipleChoice":
        return (
          <MultipleChoiceSection
            key={section.id}
            lessonId={lessonId!}
            section={section as any}
          />
        );
      case "MultiSelection":
        return (
          <MultipleSelectionSection
            key={section.id}
            lessonId={lessonId!}
            section={section as any}
          />
        );
      case "Turtle":
        return (
          <TurtleSection
            key={section.id}
            lessonId={lessonId!}
            section={section as any}
          />
        );
      case "Reflection":
        return (
          <ReflectionSection
            key={section.id}
            lessonId={lessonId!}
            section={section as any}
          />
        );
      case "Coverage":
        return (
          <CoverageSection
            key={section.id}
            lessonId={lessonId!}
            section={section as any}
          />
        );
      case "PRIMM":
        return (
          <PRIMMSection
            key={section.id}
            lessonId={lessonId!}
            section={section as any}
          />
        ); // Added PRIMM
      default:
        console.warn(`Unknown section kind: ${section.kind}`);
        return (
          <div key={section.id} className={styles.error}>
            Unsupported section
          </div>
        );
    }
  };

  if (isLoading) {
    // ... loading state JSX ...
    return (
      <div className={styles.loading}>
        <p>Loading lesson content for '{lessonId}'...</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    // ... error state JSX ...
    return (
      <div className={styles.error}>
        <h2>Error Loading Lesson</h2>
        <p>{error}</p>
        {/* Link back to the unit page if possible, otherwise home */}
        {parentUnitId ? (
          <Link
            to={`${BASE_PATH}unit/${parentUnitId}`}
            className={styles.backLink}
          >
            &larr; Back to Unit
          </Link>
        ) : (
          <Link to={`${BASE_PATH}/`} className={styles.backLink}>
            &larr; Back to Home
          </Link>
        )}
      </div>
    );
  }

  if (!lesson) {
    // ... not found state JSX ...
    return (
      <div className={styles.error}>
        <h2>Lesson Not Found</h2>
        <p>Could not find data for lesson '{lessonId}'.</p>
        {parentUnitId ? (
          <Link
            to={`${BASE_PATH}unit/${parentUnitId}`}
            className={styles.backLink}
          >
            &larr; Back to Unit
          </Link>
        ) : (
          <Link to={`${BASE_PATH}/`} className={styles.backLink}>
            &larr; Back to Home
          </Link>
        )}
      </div>
    );
  }

  // --- Render Main Lesson Layout ---
  return (
    <div className={styles.lessonContainer}>
      <aside className={styles.lessonSidebar}>
        {/* Optional: Link back to Unit Page */}
        {parentUnitId && (
          <Link
            to={`${BASE_PATH}unit/${parentUnitId}`}
            className={styles.backToUnitLink}
          >
            &larr; Back to Unit Overview
          </Link>
        )}
        <LessonSidebar
          sections={lesson.sections}
          completedSections={completedSectionsSet}
          informationSections={informationSections}
        />
      </aside>
      <div className={styles.lessonContent}>
        {/* Render LessonNavigation AT THE TOP of the content area */}
        {totalLessonsInUnit > 0 && ( // Only render if unit context was found
          <LessonNavigation
            lessonId={lessonId!} // Pass current lessonId for potential highlighting
            prevLessonId={prevLessonId}
            nextLessonId={nextLessonId}
            currentPosition={currentPositionInUnit}
            totalInUnit={totalLessonsInUnit}
          />
        )}

        {/* Render Lesson Sections */}
        {lesson.sections.map((section) => renderSection(section))}

        {/* Optionally render LessonNavigation at the bottom as well */}
        {totalLessonsInUnit > 0 && (
          <div style={{ marginTop: "2rem" }}>
            {" "}
            {/* Add spacing */}
            <LessonNavigation
              lessonId={lessonId!}
              prevLessonId={prevLessonId}
              nextLessonId={nextLessonId}
              currentPosition={currentPositionInUnit}
              totalInUnit={totalLessonsInUnit}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonPage;
