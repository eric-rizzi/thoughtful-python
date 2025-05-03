import React from 'react';
import type { TurtleSection as TurtleSectionData } from '../../types/data';
import styles from './Section.module.css';

interface TurtleSectionProps {
  section: TurtleSectionData;
}

const TurtleSection: React.FC<TurtleSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>
      {/* Placeholder for Turtle instructions, editor, canvas, validation (Step 21) */}
      <div className={styles.interactivePlaceholder}>
        Placeholder: Turtle Graphics Challenge for '{section.title}' will render here (Step 21).
      </div>
    </section>
  );
};

export default TurtleSection;