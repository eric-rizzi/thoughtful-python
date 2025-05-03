import React from 'react';
import type { MultipleChoiceSection as MultipleChoiceSectionData } from '../../types/data';
import styles from './Section.module.css';

interface MultipleChoiceSectionProps {
  section: MultipleChoiceSectionData;
}

const MultipleChoiceSection: React.FC<MultipleChoiceSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>
      {/* Placeholder for MC options and submit logic (Step 19) */}
      <div className={styles.interactivePlaceholder}>
        Placeholder: Multiple Choice Quiz for '{section.title}' will render here (Step 19).
        Options: {section.options?.join(', ') || 'N/A'}
      </div>
    </section>
  );
};

export default MultipleChoiceSection;