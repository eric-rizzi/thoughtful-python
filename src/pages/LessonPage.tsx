// src/pages/LessonPage.tsx
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const LessonPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>(); // Get lessonId from URL
  const [searchParams] = useSearchParams();
  const unitId = searchParams.get('unitId') ?? 'unknown'; // Get unitId from query param

  return (
    <div>
      <h2>Lesson Page</h2>
      <p>Displaying content for Lesson ID: <strong>{lessonId}</strong></p>
      <p>(Part of Unit: {unitId})</p>
      <p>Sidebar and interactive lesson sections will go here.</p>
    </div>
  );
};

export default LessonPage;