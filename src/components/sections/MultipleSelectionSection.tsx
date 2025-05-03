import React from 'react';
import type { MultiSelectionSection as MultiSelectionSectionData } from '../../types/data';
import styles from './Section.module.css';

interface MultiSelectionSectionProps {
  section: MultiSelectionSectionData;
}

const MultipleSelectionSection: React.FC<MultiSelectionSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>
      {/* Placeholder for MS options and submit logic (Step 19) */}
       <div className={styles.interactivePlaceholder}>
        Placeholder: Multi-Select Quiz for '{section.title}' will render here (Step 19).
        Options: {section.options?.join(', ') || 'N/A'}
      </div>
    </section>
  );
};

export default MultipleSelectionSection;