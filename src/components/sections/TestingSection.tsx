import React from 'react';
import type { LessonSection } from '../../types/data'; // Use specific type later if needed
import styles from './Section.module.css';

interface TestingSectionProps {
  section: LessonSection;
}

const TestingSection: React.FC<TestingSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>
      {/* Placeholder for examples with Code Editors + Test runners (Step 18) */}
       <div className={styles.interactivePlaceholder}>
          Placeholder: Code challenge for '{section.title}' will render here (Step 18).
      </div>
    </section>
  );
};

export default TestingSection;