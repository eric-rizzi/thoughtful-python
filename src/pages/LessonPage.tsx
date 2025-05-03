// src/pages/LessonPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchLessonData } from '../lib/dataLoader';
import type { Lesson, LessonSection } from '../types/data'; // Import base types
import styles from './LessonPage.module.css';
import { BASE_PATH } from '../config';

// Import the actual sidebar component
import LessonSidebar from '../components/LessonSidebar';

// --- Import ALL Section Components ---
import InformationSection from '../components/sections/InformationSection';
import ObservationSection from '../components/sections/ObservationSection';
import TestingSection from '../components/sections/TestingSection';
import PredictionSection from '../components/sections/PredictionSection';
import MultipleChoiceSection from '../components/sections/MultipleChoiceSection';
import MultipleSelectionSection from '../components/sections/MultipleSelectionSection';
import TurtleSection from '../components/sections/TurtleSection';
import ReflectionSection from '../components/sections/ReflectionSection';
import CoverageSection from '../components/sections/CoverageSection';

const LessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  // Effect for loading initial completion status (from Step 10)
  useEffect(() => {
      if (!lessonId) return;
      try {
          const storageKey = `python_${lessonId}_completed`;
          const storedData = localStorage.getItem(storageKey);
          const completedIds = storedData ? JSON.parse(storedData) : [];
          if (Array.isArray(completedIds)) {
              setCompletedSections(new Set(completedIds));
          } else { setCompletedSections(new Set<string>()); }
      } catch (e) { setCompletedSections(new Set<string>()); }

      // Optional listener for dynamic updates
      const handleProgressUpdate = (event: Event) => { /* ... as before ... */ };
      window.addEventListener('lessonProgressUpdated', handleProgressUpdate);
      return () => window.removeEventListener('lessonProgressUpdated', handleProgressUpdate);
  }, [lessonId]);

  // Effect for loading lesson data (from Step 9)
  useEffect(() => {
    const loadData = async () => {
      // ... (fetch logic as implemented in Step 9) ...
      if (!lessonId) { /* ... */ return; }
      setIsLoading(true);
      setError(null);
      setLesson(null);
      try {
        const fetchedLesson = await fetchLessonData(lessonId);
        setLesson(fetchedLesson);
        document.title = `${fetchedLesson.title} - Python Lesson`;
      } catch (err) { /* ... */ setError(/* ... */); }
      finally { setIsLoading(false); }
    };
    loadData();
  }, [lessonId]);

  // --- Helper Function to Render Sections ---
  const renderSection = (section: LessonSection) => {
      // Based on the section kind, return the appropriate component
      // We pass the whole section object as a prop.
      // TypeScript's structural typing helps here, but for components
      // requiring specific properties (like PredictionSectionData), ensure
      // the JSON data provides them or handle potential undefined values
      // within the specific section component.
      switch (section.kind) {
          case 'Information':
              return <InformationSection section={section} />;
          case 'Observation':
              return <ObservationSection section={section} />;
          case 'Testing':
              return <TestingSection section={section} />;
          case 'Prediction':
              // Cast section type for components expecting more specific props
              return <PredictionSection section={section as any} />;
          case 'MultipleChoice':
              return <MultipleChoiceSection section={section as any} />;
          case 'MultiSelection':
              return <MultipleSelectionSection section={section as any} />;
          case 'Turtle':
              return <TurtleSection section={section as any} />;
          case 'Reflection':
              return <ReflectionSection section={section as any} />;
          case 'Coverage':
              return <CoverageSection section={section as any} />;
          default:
              console.warn(`Unknown section kind encountered: ${section.kind}`);
              return <div className={styles.error}>Unsupported section type: {section.kind}</div>;
      }
  };

  // --- Main Rendering Logic ---

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <p>Loading lesson content...</p>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error loading lesson: {error}</p>
        <Link to={`${BASE_PATH}/`} >&larr; Back to Home</Link>
      </div>
    );
  }

  if (!lesson) {
    return <div className={styles.loading}><p>Lesson data could not be loaded.</p></div>;
  }

  // Render the main two-column layout
  return (
    <div className={styles.lessonContainer}>
      <aside className={styles.lessonSidebar}>
        {/* Render the actual LessonSidebar component */}
        <LessonSidebar
            sections={lesson.sections}
            completedSections={completedSections}
        />
      </aside>
      <div className={styles.lessonContent}>
        {/* --- DYNAMIC SECTION RENDERING --- */}
        {lesson.sections.map((section) => (
          // Use the helper function to render the correct component
          // Use section.id as the key for efficient list rendering
          <React.Fragment key={section.id}>
            {renderSection(section)}
          </React.Fragment>
        ))}
        {/* --- END DYNAMIC SECTION RENDERING --- */}
      </div>
    </div>
  );
};

export default LessonPage;