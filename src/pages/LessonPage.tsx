// src/pages/LessonPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';

// --- Data Loading & Types ---
import { fetchLessonData } from '../lib/dataLoader';
import { saveProgress, loadProgress } from '../lib/localStorageUtils';
import type {
    Lesson,
    LessonSection,
    PredictionSection as PredictionSectionData,
    MultipleChoiceSection as MultipleChoiceSectionData,
    MultipleSelectionSection as MultipleSelectionSectionData,
    TurtleSection as TurtleSectionData,
    ReflectionSection as ReflectionSectionData,
    CoverageSection as CoverageSectionData
    // Add other specific section data types if defined/needed
} from '../types/data';

// --- Configuration ---
import { BASE_PATH } from '../config';

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

// ======================================================================
// LessonPage Component
// ======================================================================
const LessonPage: React.FC = () => {
  // --- Hooks ---
  const { lessonId } = useParams<{ lessonId: string }>(); // Get lesson ID from router

  // --- State ---
  const [lesson, setLesson] = useState<Lesson | null>(null); // Holds the loaded lesson data
  const [isLoading, setIsLoading] = useState<boolean>(true); // Tracks loading state for lesson data
  const [error, setError] = useState<string | null>(null);  // Holds any data loading error message
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set()); // Tracks completed sections for this lesson

  // --- Effects ---

  // Effect 1: Load initial completion status from localStorage when lessonId changes
  useEffect(() => {
    if (!lessonId) return; // Don't run if lessonId isn't available yet

    let isMounted = true; // Flag to prevent state update if component unmounts quickly
    const storageKey = `python_${lessonId}_completed`;
    console.log(`LessonPage: Checking localStorage for key: ${storageKey}`);

    try {
      const storedData = localStorage.getItem(storageKey);
      const completedIds = storedData ? JSON.parse(storedData) : [];

      if (isMounted) {
        if (Array.isArray(completedIds) && completedIds.every(id => typeof id === 'string')) {
          setCompletedSections(new Set(completedIds));
          console.log(`LessonPage: Loaded ${completedIds.length} completed sections for ${lessonId}:`, completedIds);
        } else {
          console.warn(`Invalid completion data found in localStorage for ${lessonId}. Resetting.`);
          setCompletedSections(new Set<string>());
          localStorage.removeItem(storageKey); // Clear invalid data
        }
      }
    } catch (e) {
      console.error(`Failed to load or parse completion status from localStorage for ${lessonId}`, e);
      if (isMounted) {
        setCompletedSections(new Set<string>()); // Start fresh on error
        localStorage.removeItem(storageKey); // Clear potentially corrupted data
      }
    }

    // Optional: Listener for dynamic updates from other components/tabs (if needed)
    const handleProgressUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Check if the update is for the current lesson
      if (customEvent.detail?.lessonId === lessonId && customEvent.detail?.sectionId) {
        console.log(`LessonPage: Received progress update for section ${customEvent.detail.sectionId}, updating state.`);
        // Ensure state update happens correctly even if event fires rapidly
        setCompletedSections(prev => {
            if (prev.has(customEvent.detail.sectionId)) return prev; // Avoid redundant updates
            return new Set(prev).add(customEvent.detail.sectionId);
        });
      }
    };
    window.addEventListener('lessonProgressUpdated', handleProgressUpdate);

    // Cleanup function
    return () => {
      isMounted = false; // Mark as unmounted
      window.removeEventListener('lessonProgressUpdated', handleProgressUpdate);
      console.log(`LessonPage: Unmounting or lessonId changing (${lessonId}), cleanup listener.`);
    };

  }, [lessonId]); // Rerun only when the lessonId from the URL changes


  // Effect 2: Load lesson data from JSON when lessonId changes
  useEffect(() => {
    let isMounted = true; // Prevent state update if component unmounts during fetch

    const loadData = async () => {
      if (!lessonId) {
        setError("No Lesson ID provided in URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setLesson(null); // Clear previous lesson data
      console.log(`LessonPage: Attempting to fetch lesson ${lessonId}`);

      try {
        const fetchedLesson = await fetchLessonData(lessonId);
        if (isMounted) {
          setLesson(fetchedLesson);
          document.title = `${fetchedLesson.title} - Python Lesson`; // Update page title
          console.log(`LessonPage: Successfully fetched ${lessonId}`);
        }
      } catch (err) {
        console.error(`LessonPage Error fetching ${lessonId}:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : `An unknown error occurred loading lesson ${lessonId}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    // Cleanup function
    return () => {
        isMounted = false;
        console.log(`LessonPage: Unmounting or lessonId changing (${lessonId}), cleanup fetch.`);
    };
  }, [lessonId]); // Re-run effect if lessonId changes


  // --- Callbacks ---

  // Callback passed to interactive sections to report completion
  const handleSectionComplete = useCallback((sectionId: string) => {
    // Use functional update to ensure we have the latest state
    setCompletedSections(prevCompletedSections => {
      // Avoid unnecessary state updates and saves if already completed
      if (prevCompletedSections.has(sectionId)) {
        return prevCompletedSections;
      }

      console.log(`LessonPage: Section ${sectionId} reported complete! Updating state and localStorage.`);
      const newCompletedSet = new Set(prevCompletedSections).add(sectionId);

      // Persist updated completion status to localStorage
      if (lessonId) {
        const storageKey = `python_${lessonId}_completed`;
        saveProgress(storageKey, Array.from(newCompletedSet)); // Save as array

        // Optionally dispatch event for other listeners
        window.dispatchEvent(new CustomEvent('lessonProgressUpdated', {
            detail: { lessonId, sectionId }
        }));
      }
      return newCompletedSet; // Return the new set for the state update
    });
  }, [lessonId]); // lessonId is needed for the storage key


  // --- Rendering ---

  // Helper function to render the correct section component
  const renderSection = (section: LessonSection) => {
    // Props common to most interactive sections that need completion logic
    const commonInteractiveProps = {
      lessonId: lessonId!, // Assert non-null as lessonId is checked before this render path
      onSectionComplete: handleSectionComplete,
    };

    switch (section.kind) {
      case 'Information':
        return <InformationSection key={section.id} section={section} />;
      case 'Observation':
        return <ObservationSection key={section.id} {...commonInteractiveProps} section={section} />;
      case 'Testing':
        return <TestingSection key={section.id} {...commonInteractiveProps} section={section} />;
      case 'Prediction':
        return <PredictionSection key={section.id} {...commonInteractiveProps} section={section as PredictionSectionData} />;
      case 'MultipleChoice':
        return <MultipleChoiceSection key={section.id} {...commonInteractiveProps} section={section as MultipleChoiceSectionData} />;
      case 'MultiSelection':
        return <MultipleSelectionSection key={section.id} {...commonInteractiveProps} section={section as MultipleSelectionSectionData} />;
      case 'Turtle':
        return <TurtleSection key={section.id} {...commonInteractiveProps} section={section as TurtleSectionData} />;
      case 'Reflection':
        return <ReflectionSection key={section.id} {...commonInteractiveProps} section={section as ReflectionSectionData} />;
      case 'Coverage':
        return <CoverageSection key={section.id} {...commonInteractiveProps} section={section as CoverageSectionData} />;
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
      {/* Sidebar Area */}
      <aside className={styles.lessonSidebar}>
        <LessonSidebar
          sections={lesson.sections}
          completedSections={completedSections} // Pass current completion state
        />
      </aside>

      {/* Main Content Area */}
      <div className={styles.lessonContent}>
        {/* Map over sections and render using the helper */}
        {lesson.sections.map(section => renderSection(section))}
      </div>
    </div>
  );
};

export default LessonPage;