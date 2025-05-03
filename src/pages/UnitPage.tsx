// src/pages/UnitPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

const UnitPage: React.FC = () => {
  const { unitId } = useParams<{ unitId: string }>(); // Get unitId from URL

  return (
    <div>
      <h2>Unit Page</h2>
      <p>Displaying lessons for Unit ID: <strong>{unitId}</strong></p>
      {/* Link examples (will be functional later) */}
      <a href={`/lesson/lesson_1?unitId=${unitId}`}>Go to Lesson 1</a><br/>
      <a href={`/lesson/lesson_2?unitId=${unitId}`}>Go to Lesson 2</a>
    </div>
  );
};

export default UnitPage;