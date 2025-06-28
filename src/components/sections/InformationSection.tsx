import React from "react";
import type { InformationSectionData } from "../../types/data";
import styles from "./Section.module.css";
import ContentRenderer from "../content_blocks/ContentRenderer";

interface InformationSectionProps {
  section: InformationSectionData;
}

const InformationSection: React.FC<InformationSectionProps> = ({ section }) => {
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>
    </section>
  );
};

export default InformationSection;
