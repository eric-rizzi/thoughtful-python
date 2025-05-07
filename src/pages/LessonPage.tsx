// src/pages/LessonPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchLessonData, fetchUnitsData } from "../lib/dataLoader";
import type { Lesson, LessonSection } from "../types/data";

// Import Section Components
import InformationSection from "../components/sections/InformationSection";
import ObservationSection from "../components/sections/ObservationSection";
import TestingSection from "../components/sections/TestingSection";
import PredictionSection from "../components/sections/PredictionSection";
import MultipleChoiceSection from "../components/sections/MultipleChoiceSection";
import MultipleSelectionSection from "../components/sections/MultipleSelectionSection";
import TurtleSection from "../components/sections/TurtleSection";
import ReflectionSection from "../components/sections/ReflectionSection";
import CoverageSection from "../components/sections/CoverageSection";
import PRIMMSection from "../components/sections/PRIMMSection";

// Import LessonNavigation (it's rendered here now)
import LessonNavigation from "../components/LessonNavigation";
import LessonSidebar from "../components/LessonSidebar";

import styles from "./LessonPage.module.css";
import { useCompletedSectionsForLesson } from "../stores/progressStore";

const LessonPage: React.FC = () => {
  const params = useParams();
  const lessonPath = params["*"];

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [parentUnitId, setParentUnitId] = useState<string | null>(null);
  const [unitLessons, setUnitLessons] = useState<string[]>([]);
  const [currentIndexInUnit, setCurrentIndexInUnit] = useState<number>(-1);

  // Use lessonPath (derived from params['*']) in the dependency array and logic
  const completedSectionsArray = useCompletedSectionsForLesson(lessonPath);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      // Use lessonPath here
      if (!lessonPath) {
        if (isMounted) {
          setError("No Lesson Path provided in URL.");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      setLesson(null);
      setUnitLessons([]);
      setCurrentIndexInUnit(-1);
      setParentUnitId(null);

      // Use lessonPath when logging and fetching
      console.log(`LessonPage: Attempting to fetch lesson ${lessonPath}`);
      try {
        const [fetchedLesson, unitsData] = await Promise.all([
          fetchLessonData(lessonPath), // Pass the full path here
          fetchUnitsData(),
        ]);

        if (!isMounted) return;

        setLesson(fetchedLesson);
        document.title = `${fetchedLesson.title} - Python Lesson`;
        console.log(`LessonPage: Successfully fetched ${lessonPath}`);

        let foundUnitLessons: string[] | null = null;
        let foundIndex = -1;
        let foundUnitId: string | null = null;

        for (const unit of unitsData.units) {
          // Use lessonPath when searching the unit's lessons array
          const index = unit.lessons.indexOf(lessonPath);
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
            `LessonPage: Found unit context for ${lessonPath} in unit ${foundUnitId}`
          );
        } else {
          console.warn(`Could not find unit context for lesson ${lessonPath}`);
        }
      } catch (err) {
        console.error(`LessonPage Error fetching data for ${lessonPath}:`, err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : `An unknown error occurred loading lesson ${lessonPath}`
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
    };
  }, [lessonPath]); // Dependency is now lessonPath

  // ... (rest of the component logic: completedSectionsSet, informationSections, prev/next calculation, renderSection) ...
  // Ensure lessonPath is passed down correctly where lessonId was previously used
  // e.g., to section components if needed, although most use the lessonId prop for keys/storage

  const completedSectionsSet = useMemo(
    () => new Set(completedSectionsArray),
    [completedSectionsArray]
  );
  const informationSections: Set<string> = useMemo(() => {
    if (!lesson) return new Set<string>();
    return new Set(
      lesson.sections.filter((s) => s.kind === "Information").map((s) => s.id)
    );
  }, [lesson]);

  const prevLessonId =
    currentIndexInUnit > 0 ? unitLessons[currentIndexInUnit - 1] : null;
  const nextLessonId =
    currentIndexInUnit !== -1 && currentIndexInUnit < unitLessons.length - 1
      ? unitLessons[currentIndexInUnit + 1]
      : null;
  const currentPositionInUnit = currentIndexInUnit + 1;
  const totalLessonsInUnit = unitLessons.length;

  const renderSection = (section: LessonSection) => {
    // Pass lessonPath as lessonId prop to children
    const currentLessonId = lessonPath || "unknown"; // Fallback if lessonPath is somehow undefined
    switch (section.kind) {
      case "Information":
        return <InformationSection key={section.id} section={section} />;
      case "Observation":
        return (
          <ObservationSection
            key={section.id}
            lessonId={currentLessonId}
            section={section}
          />
        );
      case "Testing":
        return (
          <TestingSection
            key={section.id}
            lessonId={currentLessonId}
            section={section}
          />
        );
      case "Prediction":
        return (
          <PredictionSection
            key={section.id}
            lessonId={currentLessonId}
            section={section as any}
          />
        );
      case "MultipleChoice":
        return (
          <MultipleChoiceSection
            key={section.id}
            lessonId={currentLessonId}
            section={section as any}
          />
        );
      case "MultipleSelection":
        return (
          <MultipleSelectionSection
            key={section.id}
            lessonId={currentLessonId}
            section={section as any}
          />
        );
      case "Turtle":
        return (
          <TurtleSection
            key={section.id}
            lessonId={currentLessonId}
            section={section as any}
          />
        );
      case "Reflection":
        return (
          <ReflectionSection
            key={section.id}
            lessonId={currentLessonId}
            section={section as any}
          />
        );
      case "Coverage":
        return (
          <CoverageSection
            key={section.id}
            lessonId={currentLessonId}
            section={section as any}
          />
        );
      case "PRIMM":
        return (
          <PRIMMSection
            key={section.id}
            lessonId={currentLessonId}
            section={section as any}
          />
        );
      default:
        console.warn(`Unknown section kind: ${section.kind}`);
        return (
          <div key={section.id} className={styles.error}>
            Unsupported section
          </div>
        );
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    /* ... loading JSX ... */
    return (
      <div className={styles.loading}>
        <p>Loading lesson content for '{lessonPath}'...</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }
  if (error) {
    /* ... error JSX ... */
    return (
      <div className={styles.error}>
        <h2>Error Loading Lesson</h2>
        <p>{error}</p>
        {parentUnitId ? (
          <Link to={`/unit/${parentUnitId}`} className={styles.backLink}>
            &larr; Back to Unit
          </Link>
        ) : (
          <Link to="/" className={styles.backLink}>
            &larr; Back to Home
          </Link>
        )}
      </div>
    );
  }
  if (!lesson) {
    /* ... not found JSX ... */
    return (
      <div className={styles.error}>
        <h2>Lesson Not Found</h2>
        <p>Could not find data for lesson '{lessonPath}'.</p>
        {parentUnitId ? (
          <Link to={`/unit/${parentUnitId}`} className={styles.backLink}>
            &larr; Back to Unit
          </Link>
        ) : (
          <Link to="/" className={styles.backLink}>
            &larr; Back to Home
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={styles.lessonContainer}>
      <aside className={styles.lessonSidebar}>
        {parentUnitId && (
          <Link to={`/unit/${parentUnitId}`} className={styles.backToUnitLink}>
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
        <div className={styles.lessonHeader}>
          <h1 className={styles.lessonTitle}>{lesson.title}</h1>
          {totalLessonsInUnit > 0 && (
            <LessonNavigation
              lessonId={lessonPath!}
              prevLessonId={prevLessonId}
              nextLessonId={nextLessonId}
              currentPosition={currentPositionInUnit}
              totalInUnit={totalLessonsInUnit}
            />
          )}
        </div>

        {/* Render Lesson Sections Below Header */}
        {lesson.sections.map((section) => renderSection(section))}

        {/* Optional: Bottom Navigation */}
        {totalLessonsInUnit > 0 && (
          <div
            className={styles.lessonHeader}
            style={{
              marginTop: "2rem",
              borderTop: "2px solid #eee",
              borderBottom: "none",
              paddingBottom: 0,
            }}
          >
            {" "}
            {/* Reuse header style for layout */}
            {/* Invisible spacer to push nav right if title isn't needed */}
            <div style={{ flexGrow: 1 }}></div>
            <LessonNavigation
              lessonId={lessonPath!}
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
