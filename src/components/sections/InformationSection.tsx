// src/components/sections/InformationSection.tsx
import React from 'react';
import type { LessonSection } from '../../types/data';
import styles from './Section.module.css'; // Use the common style

interface InformationSectionProps {
  section: LessonSection;
}

const InformationSection: React.FC<InformationSectionProps> = ({ section }) => {
  return (
    // Set the ID for sidebar navigation
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      {/* CSS white-space: pre-wrap handles newlines */}
      <div className={styles.content}>{section.content}</div>
    </section>
  );
};

export default InformationSection;