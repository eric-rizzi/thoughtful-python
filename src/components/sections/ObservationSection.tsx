// src/components/sections/ObservationSection.tsx
import React from "react";
import type {
  LessonSection,
  LessonExample,
  SectionId,
  LessonId,
} from "../../types/data";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./Section.module.css";
import { useProgressActions } from "../../stores/progressStore";
import { useInteractiveExample } from "../../hooks/useInteractiveExample";
import InteractiveExampleDisplay from "./InteractiveExampleDisplay";

interface ObservationSectionProps {
  section: LessonSection; // Expects a generic LessonSection, but examples are key
  lessonId: LessonId;
}

// Helper component for each example to use the hook
const ObservationExample: React.FC<{
  example: LessonExample;
  lessonId: LessonId;
  sectionId: SectionId;
}> = ({ example, lessonId, sectionId }) => {
  const { completeSection } = useProgressActions();
  const exampleHook = useInteractiveExample({
    exampleId: example.id,
    initialCode: example.code,
    lessonId,
    sectionId,
    persistCode: true, // Enable code persistence for Observation
    storageKeyPrefix: "observeCode",
  });

  const onRunCode = async () => {
    const result = await exampleHook.onRunCode();
    if (!result.error) {
      console.log(
        `Observation section ${sectionId} - example ${example.id} run successfully. Marking complete.`
      );
      completeSection(lessonId, sectionId);
    }
    return result;
  };

  return (
    <InteractiveExampleDisplay
      example={example}
      {...exampleHook}
      onRunCode={onRunCode}
    />
  );
};

const ObservationSection: React.FC<ObservationSectionProps> = ({
  section,
  lessonId,
}) => {
  const currentSingleExample = section.example;

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>

      {currentSingleExample ? (
        <ObservationExample
          key={currentSingleExample.id}
          example={currentSingleExample}
          lessonId={lessonId}
          sectionId={section.id}
        />
      ) : (
        <p>No example for this observation section.</p>
      )}
    </section>
  );
};

export default ObservationSection;
