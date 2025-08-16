import React from "react";
import type {
  ObservationSectionData,
  UnitId,
  LessonId,
} from "../../types/data";
import styles from "./Section.module.css";
import ContentRenderer from "../content_blocks/ContentRenderer";
import CodeExecutor from "./CodeExecutor";

const ObservationSection: React.FC<{
  section: ObservationSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}> = ({ section, unitId, lessonId }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>

      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

      <div className={styles.exampleContainer}>
        <CodeExecutor
          example={section.example}
          unitId={unitId}
          lessonId={lessonId}
          sectionId={section.id}
        />
      </div>
    </section>
  );
};

export default ObservationSection;
