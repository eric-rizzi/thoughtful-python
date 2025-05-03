// src/pages/LessonPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchLessonData } from '../lib/dataLoader';
import type { Lesson } from '../types/data';
import styles from './LessonPage.module.css';
import { BASE_PATH } from '../config';

// Import the actual sidebar component
import LessonSidebar from '../components/LessonSidebar';

// Placeholder for Section Renderer (Step 12+)
const SectionRendererPlaceholder: React.FC<{ sections: Lesson['sections'] }> = ({ sections }) => {
     return (
        <div style={{ border: '1px dashed blue', padding: '1rem', minHeight: '300px' }}>
            <h4>Section Renderer (Step 12+)</h4>
            <p>Will render {sections?.length || 0} sections here based on their 'kind'.</p>
            {/* Example: Render section titles to verify data is passed */}
            {/* {sections?.map(s => <h5 key={s.id} id={s.id}>{s.title} (Kind: {s.kind})</h5>)} */}
        </div>
    );
};


const LessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- TEMPORARY State for Completion Tracking ---
  // This will be replaced by a proper state management solution (Step 22/23)
  // For now, we load from localStorage on mount and store it in state.
  // We use a Set for efficient checking in the Sidebar prop.
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
      if (!lessonId) return;
      // Load initial completion status from localStorage
      try {
          const storageKey = `python_${lessonId}_completed`;
          const storedData = localStorage.getItem(storageKey);
          const completedIds = storedData ? JSON.parse(storedData) : [];
          if (Array.isArray(completedIds)) {
              setCompletedSections(new Set(completedIds));
              console.log(`LessonPage: Loaded ${completedIds.length} completed sections for ${lessonId}`);
          } else {
              console.warn(`Invalid completion data found in localStorage for ${lessonId}`);
              setCompletedSections(new Set()); // Start fresh if data is invalid
          }
      } catch (e) {
          console.error("Failed to load completion status from localStorage", e);
          setCompletedSections(new Set()); // Start fresh on error
      }

      // --- OPTIONAL: Listener for updates from other components ---
      // This allows the sidebar to update if a section is completed
      // This assumes utils/progress-utils.ts (or equivalent) dispatches this event
      const handleProgressUpdate = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.lessonId === lessonId && customEvent.detail?.sectionId) {
            console.log(`LessonPage: Received progress update for section ${customEvent.detail.sectionId}`);
            setCompletedSections(prev => new Set(prev).add(customEvent.detail.sectionId));
        }
      };
      window.addEventListener('lessonProgressUpdated', handleProgressUpdate);
      // Cleanup listener on component unmount or lessonId change
      return () => {
        window.removeEventListener('lessonProgressUpdated', handleProgressUpdate);
      };
      // --- End Optional Listener ---

  }, [lessonId]); // Rerun only when lessonId changes

  // --- End TEMPORARY State ---


  useEffect(() => {
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
        setLesson(fetchedLesson);
        document.title = `${fetchedLesson.title} - Python Lesson`;
        console.log(`LessonPage: Successfully fetched ${lessonId}`);
      } catch (err) {
        console.error(`LessonPage Error fetching ${lessonId}:`, err);
        setError(err instanceof Error ? err.message : `An unknown error occurred loading lesson ${lessonId}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [lessonId]); // Re-run effect if lessonId changes

  // --- Rendering Logic ---

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
        {/* Use the actual LessonSidebar component */}
        <LessonSidebar
            sections={lesson.sections}
            completedSections={completedSections} // Pass the state here
        />
      </aside>
      <div className={styles.lessonContent}>
        {/* Placeholder for Section Renderer logic/components (Step 12+) */}
        <SectionRendererPlaceholder sections={lesson.sections} />
      </div>
    </div>
  );
};

export default LessonPage;