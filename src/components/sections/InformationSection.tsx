import React from 'react';
import type { LessonSection } from '../../types/data';
import styles from './Section.module.css';

interface InformationSectionProps {
  section: LessonSection; // Base type is sufficient
}

const InformationSection: React.FC<InformationSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
         {/* Render content, assuming plain text with newlines */}
         {section.content}
      </div>
      {/* No interactive elements for Information sections */}
    </section>
  );
};

export default InformationSection;