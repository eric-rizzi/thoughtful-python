import React from "react";
import CodeEditor from "../CodeEditor";
import styles from "./Section.module.css";

interface InteractiveExampleDisplayProps {
  value: string;
  onChange: (newCode: string) => void;
  onRunCode: () => Promise<{ output: string; error: string | null }>;
  isLoading: boolean;
  output: string;
  error: Error | null;
  isReadOnly: boolean;
}

const InteractiveExampleDisplay: React.FC<InteractiveExampleDisplayProps> = ({
  value,
  onChange,
  onRunCode,
  isLoading,
  output,
  error,
  isReadOnly,
}) => {
  const isPythonError = output.includes("Traceback (most recent call last):");

  return (
    <div className={styles.interactiveExampleContainer}>
      <CodeEditor
        value={value}
        onChange={onChange}
        readOnly={isReadOnly || isLoading}
        minHeight="150px"
      />
      <div className={styles.editorControls}>
        <button
          onClick={onRunCode}
          disabled={isLoading}
          className={styles.runButton}
        >
          {isLoading ? "Executing..." : "Run Code"}
        </button>
      </div>
      {(output || error) && (
        <div className={styles.outputArea}>
          <pre
            className={`${styles.outputPre} ${
              // Apply the error style if it's a Pyodide loading error OR a Python execution error.
              error || isPythonError ? styles.errorOutput : ""
            }`}
          >
            {error ? error.message : output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default InteractiveExampleDisplay;
