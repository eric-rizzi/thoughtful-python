import React from 'react';
import type { CoverageSection as CoverageSectionData } from '../../types/data';
import styles from './Section.module.css';

interface CoverageSectionProps {
  section: CoverageSectionData;
}

const CoverageSection: React.FC<CoverageSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>
      {/* Placeholder for code display, challenge table, run logic (Step 23) */}
      <div className={styles.interactivePlaceholder}>
        Placeholder: Code Coverage challenge for '{section.title}' will render here (Step 23).
      </div>
    </section>
  );
};

export default CoverageSection;