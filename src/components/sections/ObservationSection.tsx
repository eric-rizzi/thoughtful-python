// src/components/sections/ObservationSection.tsx
import React from 'react'; // Removed unused useState, useEffect, useCallback
import type { LessonSection, LessonExample } from '../../types/data';
import styles from './Section.module.css';
import { useProgressActions } from '../../stores/progressStore';
import { useInteractiveExample } from '../../hooks/useInteractiveExample'; // IMPORT NEW HOOK
import InteractiveExampleDisplay from './InteractiveExampleDisplay'; // IMPORT NEW COMPONENT

interface ObservationSectionProps {
  section: LessonSection; // Expects a generic LessonSection, but examples are key
  lessonId: string;
  onSectionComplete: (sectionId: string) => void; // Callback for completion
}

// Helper component for each example to use the hook
const ObservationExample: React.FC<{
  example: LessonExample;
  lessonId: string;
  sectionId: string;
  onSectionComplete: (sectionId: string) => void;
}> = ({ example, lessonId, sectionId, onSectionComplete }) => {
  const { completeSection } = useProgressActions();
  const exampleHook = useInteractiveExample({
    exampleId: example.id,
    initialCode: example.code,
    lessonId,
    sectionId,
    persistCode: true, // Enable code persistence for Observation
    storageKeyPrefix: 'observeCode',
  });

  const handleRunAndComplete = async () => {
    const result = await exampleHook.executeCode();
    if (!result.error) {
      console.log(`Observation section ${sectionId} - example ${example.id} run successfully. Marking complete.`);
      completeSection(lessonId, sectionId);
      onSectionComplete(sectionId);
    }
  };

  return (
    <InteractiveExampleDisplay
      example={example}
      {...exampleHook}
      onRunCode={handleRunAndComplete}
    />
  );
};

const ObservationSection: React.FC<ObservationSectionProps> = ({ section, lessonId, onSectionComplete }) => {
  if (!section.examples || section.examples.length === 0) {
    return (
      <section id={section.id} className={styles.section}>
        <h2 className={styles.title}>{section.title}</h2>
        <div className={styles.content}>{section.content}</div>
        <p>No examples for this observation section.</p>
      </section>
    );
  }

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>
      {section.examples.map((example: LessonExample) => (
        <ObservationExample
          key={example.id}
          example={example}
          lessonId={lessonId}
          sectionId={section.id}
          onSectionComplete={onSectionComplete}
        />
      ))}
    </section>
  );
};

export default ObservationSection;