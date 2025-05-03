import React from 'react';
import type { LessonSection } from '../../types/data'; // Use specific type later if needed
import styles from './Section.module.css';

interface ObservationSectionProps {
  section: LessonSection;
}

const ObservationSection: React.FC<ObservationSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>
      {/* Placeholder for examples with Code Editors (Step 15+) */}
      <div className={styles.interactivePlaceholder}>
          Placeholder: Code examples for '{section.title}' will render here (Step 15).
      </div>
    </section>
  );
};

export default ObservationSection;