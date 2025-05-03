// src/pages/LessonPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchLessonData } from '../lib/dataLoader';
import type { Lesson } from '../types/data';
import styles from './LessonPage.module.css';
import { BASE_PATH } from '../config'; // For potential back links

// Import placeholder components or define inline for now
// These will be implemented in later steps
const LessonSidebarPlaceholder: React.FC<{ sections: Lesson['sections'] }> = ({ sections }) => {
    return (
        <div style={{ border: '1px dashed gray', padding: '1rem', minHeight: '300px' }}>
            <h4>Lesson Sidebar (Step 10)</h4>
            <p>Will list {sections?.length || 0} sections:</p>
            <ul>
                {sections?.map(s => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}
            </ul>
        </div>
    );
};

const SectionRendererPlaceholder: React.FC<{ sections: Lesson['sections'] }> = ({ sections }) => {
     return (
        <div style={{ border: '1px dashed blue', padding: '1rem', minHeight: '300px' }}>
            <h4>Section Renderer (Step 12+)</h4>
            <p>Will render {sections?.length || 0} sections here based on their 'kind'.</p>
        </div>
    );
};


const LessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!lessonId) {
        setError("No Lesson ID provided in URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      console.log(`LessonPage: Attempting to fetch lesson ${lessonId}`);

      try {
        const fetchedLesson = await fetchLessonData(lessonId);
        setLesson(fetchedLesson);
        document.title = `${fetchedLesson.title} - Python Lesson`; // Update page title
        console.log(`LessonPage: Successfully fetched ${lessonId}`);
      } catch (err) {
        console.error(`LessonPage Error fetching ${lessonId}:`, err);
        setError(err instanceof Error ? err.message : `An unknown error occurred loading lesson ${lessonId}`);
        setLesson(null); // Clear lesson data on error
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // Dependency array includes lessonId to refetch if the user navigates
    // directly from one lesson page to another (e.g., via prev/next buttons)
  }, [lessonId]);

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
        {/* Provide a link back, maybe to the unit page if possible, or home */}
        <Link to={`${BASE_PATH}/`} >&larr; Back to Home</Link>
      </div>
    );
  }

  if (!lesson) {
    // This case should ideally be covered by the error state after fetch
    return <div className={styles.loading}><p>Lesson data could not be loaded.</p></div>;
  }

  // Render the main two-column layout
  return (
    <div className={styles.lessonContainer}>
      <aside className={styles.lessonSidebar}>
        {/* Placeholder for LessonSidebar component (Step 10) */}
        <LessonSidebarPlaceholder sections={lesson.sections} />
      </aside>
      <div className={styles.lessonContent}>
        {/* Placeholder for Section Renderer logic/components (Step 12+) */}
        <SectionRendererPlaceholder sections={lesson.sections} />
      </div>
    </div>
  );
};

export default LessonPage;