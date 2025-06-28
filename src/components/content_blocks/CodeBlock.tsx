import React from "react";
import { CodeBlock as CodeBlockData } from "../../types/data";
import CodeEditor from "../CodeEditor"; // Import the existing interactive editor
import styles from "./ContentRenderer.module.css";

interface CodeBlockProps {
  block: CodeBlockData;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ block }) => {
  return (
    <div className={styles.contentBlock}>
      <CodeEditor
        value={block.value}
        onChange={() => {}} // No-op function for a read-only editor
        readOnly={true}
        height="auto" // Allow the editor to size to its content
      />
    </div>
  );
};

export default CodeBlock;
