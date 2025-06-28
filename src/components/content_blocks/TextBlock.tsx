import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TextBlock as TextBlockData } from "../../types/data";
import styles from "./ContentRenderer.module.css";

interface TextBlockProps {
  block: TextBlockData;
}

const TextBlock: React.FC<TextBlockProps> = ({ block }) => {
  return (
    <div className={styles.contentBlock}>
      <ReactMarkdown children={block.value} remarkPlugins={[remarkGfm]} />
    </div>
  );
};

export default TextBlock;
