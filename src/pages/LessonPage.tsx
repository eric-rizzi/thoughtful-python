// src/pages/LessonPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchLessonData } from '../lib/dataLoader';
import type {
    Lesson,
    LessonSection,
    PredictionSection as PredictionSectionData,
    MultipleChoiceSection as MultipleChoiceSectionData,
    MultipleSelectionSection as MultipleSelectionSectionData,
    TurtleSection as TurtleSectionData,
    ReflectionSection as ReflectionSectionData,
    CoverageSection as CoverageSectionData
} from '../types/data';

// --- Child Components ---
import LessonSidebar from '../components/LessonSidebar';
import InformationSection from '../components/sections/InformationSection';
import ObservationSection from '../components/sections/ObservationSection';
import TestingSection from '../components/sections/TestingSection';
import PredictionSection from '../components/sections/PredictionSection';
import MultipleChoiceSection from '../components/sections/MultipleChoiceSection';
import MultipleSelectionSection from '../components/sections/MultipleSelectionSection';
import TurtleSection from '../components/sections/TurtleSection';
import ReflectionSection from '../components/sections/ReflectionSection';
import CoverageSection from '../components/sections/CoverageSection';

// --- Styling ---
import styles from './LessonPage.module.css';

import { useCompletedSectionsForLesson } from '../stores/progressStore';
import { BASE_PATH } from '../config';

// ======================================================================
// LessonPage Component
// ======================================================================
const LessonPage: React.FC = () => {
  // --- Hooks ---
  const { lessonId } = useParams<{ lessonId: string }>();

  // --- State ---
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Effects ---

  // Effect 1: Load lesson data (remains the same)
  useEffect(() => {
    console.log("Use effect")
    let isMounted = true;
    const loadData = async () => {
      if (!lessonId) {
        setError("No Lesson ID provided in URL.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      setLesson(null);
      console.log(`LessonPage: Attempting to fetch lesson ${lessonId}`);
      try {
        const fetchedLesson = await fetchLessonData(lessonId);
        console.log("fetched")
        if (isMounted) {
          setLesson(fetchedLesson);
          document.title = `${fetchedLesson.title} - Python Lesson`;
          console.log(`LessonPage: Successfully fetched ${lessonId}`);
        }
      } catch (err) {
        console.error(`LessonPage Error fetching ${lessonId}:`, err);
        if (isMounted) {
          console.log("Mounting error")
          setError(err instanceof Error ? err.message : `An unknown error occurred loading lesson ${lessonId}`);
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
        console.log(`LessonPage: Unmounting or lessonId changing (${lessonId}), cleanup fetch.`);
    };
  }, [lessonId]);

  // Helper function to render the correct section component
  const renderSection = (section: LessonSection) => {
    switch (section.kind) {
      case 'Information':
        return <InformationSection key={section.id} section={section} />;
      // Pass only necessary props (lessonId, section)
      case 'Observation':
        return <ObservationSection key={section.id} lessonId={lessonId!} section={section} />;
      case 'Testing':
        return <TestingSection key={section.id} lessonId={lessonId!} section={section} />;
      case 'Prediction':
        return <PredictionSection key={section.id} lessonId={lessonId!} section={section as PredictionSectionData} />;
      case 'MultipleChoice':
        return <MultipleChoiceSection key={section.id} lessonId={lessonId!} section={section as MultipleChoiceSectionData} />;
      case 'MultiSelection':
        return <MultipleSelectionSection key={section.id} lessonId={lessonId!} section={section as MultipleSelectionSectionData} />;
      // case 'Turtle':
      //  return <TurtleSection key={section.id} lessonId={lessonId!} section={section as TurtleSectionData} />;
      case 'Reflection':
        return <ReflectionSection key={section.id} lessonId={lessonId!} section={section as ReflectionSectionData} />;
      case 'Coverage':
        return <CoverageSection key={section.id} lessonId={lessonId!} section={section as CoverageSectionData} />;
      default:
        console.warn(`Unknown section kind encountered: ${section.kind} for section ID: ${section.id}`);
        return (
            <div key={section.id} className={styles.error}>
              Unsupported section type: {(section as any).kind || 'Unknown'}
            </div>
          );
    }
  };

  // Handle Loading State
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <p>Loading lesson content for '{lessonId}'...</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  // Handle Error State
  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error Loading Lesson</h2>
        <p>{error}</p>
        <Link to={`${BASE_PATH}/`} className={styles.backLink}>&larr; Back to Home</Link>
      </div>
    );
  }

  // Handle Lesson Not Found (should be caught by error, but good failsafe)
  if (!lesson) {
    return (
      <div className={styles.error}>
          <h2>Lesson Not Found</h2>
          <p>Could not find data for lesson '{lessonId}'.</p>
          <Link to={`${BASE_PATH}/`} className={styles.backLink}>&larr; Back to Home</Link>
      </div>
    );
  }

  // --- Render Main Lesson Layout ---
  return (
    <div className={styles.lessonContainer}>
      <aside className={styles.lessonSidebar}>
        <LessonSidebar
          sections={lesson.sections}
          completedSections={new Set()} // Use the Set derived from Zustand state
          informationSections={new Set()}
        />
      </aside>
      <div className={styles.lessonContent}>
        {lesson.sections.map(section => renderSection(section))}
      </div>
    </div>
  );
};

export default LessonPage;