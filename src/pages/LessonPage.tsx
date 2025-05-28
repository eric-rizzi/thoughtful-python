// src/pages/LessonPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchLessonData, fetchUnitsData } from "../lib/dataLoader";
import type { Lesson, AnyLessonSectionData } from "../types/data";

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
import DebuggerSection from "../components/sections/DebuggerSection";

import LessonNavigation from "../components/LessonNavigation";
import LessonSidebar from "../components/LessonSidebar";
import LoadingSpinner from "../components/LoadingSpinner";

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

  const completedSectionsMap = useCompletedSectionsForLesson(lessonPath);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
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

      try {
        const [fetchedLesson, unitsData] = await Promise.all([
          fetchLessonData(lessonPath),
          fetchUnitsData(),
        ]);

        if (!isMounted) return;

        setLesson(fetchedLesson);
        document.title = `${fetchedLesson.title} - Python Lesson`;

        let foundUnitLessons: string[] | null = null;
        let foundIndex = -1;
        let foundUnitId: string | null = null;

        for (const unit of unitsData.units) {
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
  }, [lessonPath]);

  const completedSectionsSet = useMemo(() => {
    if (!completedSectionsMap) {
      return new Set<string>();
    }
    return new Set(Object.keys(completedSectionsMap));
  }, [completedSectionsMap]);

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

  const renderSection = (sectionData: AnyLessonSectionData) => {
    const currentLessonId = lessonPath || "unknown";
    switch (sectionData.kind) {
      case "Information":
        return (
          <InformationSection key={sectionData.id} section={sectionData} />
        );
      case "Observation":
        return (
          <ObservationSection
            key={sectionData.id}
            lessonId={currentLessonId}
            section={sectionData}
          />
        );
      case "Testing":
        return (
          <TestingSection
            key={sectionData.id}
            lessonId={currentLessonId}
            section={sectionData}
          />
        );
      case "Prediction":
        return (
          <PredictionSection
            key={sectionData.id}
            lessonId={currentLessonId}
            section={sectionData}
          />
        );
      case "MultipleChoice":
        return (
          <MultipleChoiceSection
            key={sectionData.id}
            lessonId={currentLessonId}
            section={sectionData}
          />
        );
      case "MultipleSelection":
        return (
          <MultipleSelectionSection
            key={sectionData.id}
            lessonId={currentLessonId}
            section={sectionData}
          />
        );
      case "Turtle":
        return (
          <TurtleSection
            key={sectionData.id}
            lessonId={currentLessonId}
            section={sectionData}
          />
        );
      case "Reflection":
        return (
          <ReflectionSection
            key={sectionData.id}
            lessonId={currentLessonId}
            section={sectionData}
          />
        );
      case "Coverage":
        return (
          <CoverageSection
            key={sectionData.id}
            lessonId={currentLessonId}
            section={sectionData}
          />
        );
      case "PRIMM":
        return (
          <PRIMMSection
            key={sectionData.id}
            lessonId={currentLessonId}
            section={sectionData}
          />
        );
      case "Debugger":
        return <DebuggerSection key={sectionData.id} section={sectionData} />;
      default:
        const _exhaustiveCheck: never = sectionData;
        console.warn(`Unknown section kind: ${(_exhaustiveCheck as any).kind}`);
        return (
          <div key={(_exhaustiveCheck as any).id} className={styles.error}>
            Unsupported section kind: {(_exhaustiveCheck as any).kind}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <LoadingSpinner
        message={`Loading lesson content for '${lessonPath}'...`}
      />
    );
  }
  if (error) {
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
          <h1 className={styles.lessonTitle}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {lesson.title}
            </ReactMarkdown>
          </h1>
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

        {lesson.sections.map((sectionItem) => renderSection(sectionItem))}

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
