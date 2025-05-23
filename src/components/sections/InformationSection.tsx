// src/components/sections/InformationSection.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LessonSection } from "../../types/data";
import styles from "./Section.module.css";

interface InformationSectionProps {
  section: LessonSection;
}

const InformationSection: React.FC<InformationSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>
    </section>
  );
};

export default InformationSection;
