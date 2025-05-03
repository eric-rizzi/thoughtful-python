import React from 'react';
import type { ReflectionSection as ReflectionSectionData } from '../../types/data';
import styles from './Section.module.css';

interface ReflectionSectionProps {
  section: ReflectionSectionData;
}

const ReflectionSection: React.FC<ReflectionSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>
      {/* Placeholder for topic select, editor, explanation, buttons, history (Step 22) */}
      <div className={styles.interactivePlaceholder}>
        Placeholder: Reflection inputs and feedback for '{section.title}' will render here (Step 22).
      </div>
    </section>
  );
};

export default ReflectionSection;