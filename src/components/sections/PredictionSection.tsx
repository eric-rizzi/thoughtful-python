import React from 'react';
import type { PredictionSection as PredictionSectionData } from '../../types/data';
import styles from './Section.module.css';

interface PredictionSectionProps {
  section: PredictionSectionData;
}

const PredictionSection: React.FC<PredictionSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>
      {/* Placeholder for function display and prediction table (Step 20) */}
      <div className={styles.interactivePlaceholder}>
        Placeholder: Prediction table for '{section.title}' will render here (Step 20).
        Function: {section.functionDisplay?.title || 'N/A'}
      </div>
    </section>
  );
};

export default PredictionSection;