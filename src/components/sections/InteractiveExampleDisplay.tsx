// src/components/sections/InteractiveExampleDisplay.tsx (NEW FILE)
import React from "react";
import CodeEditor from "../CodeEditor";
import styles from "./Section.module.css"; // Assuming common styles
import type { LessonExample } from "../../types/data";

interface InteractiveExampleDisplayProps {
  example: LessonExample;
  code: string;
  output: string;
  isRunning: boolean;
  hasBeenRun: boolean;
  isPyodideLoading: boolean;
  pyodideError: Error | null;
  onCodeChange: (newCode: string) => void;
  onRunCode: () => Promise<{ output: string; error: string | null }>;
  renderExtraControls?: () => React.ReactNode; // For "Test Solution" button etc.
  renderExtraOutput?: () => React.ReactNode; // For test results area
}

const InteractiveExampleDisplay: React.FC<InteractiveExampleDisplayProps> = ({
  example,
  code,
  output,
  isRunning,
  hasBeenRun,
  isPyodideLoading,
  pyodideError,
  onCodeChange,
  onRunCode,
  renderExtraControls,
  renderExtraOutput,
}) => {
  const canRun = !isPyodideLoading && !pyodideError && !isRunning;

  return (
    <div className={styles.exampleContainer}>
      <h3 className={styles.exampleTitle}>{example.title}</h3>
      <p className={styles.exampleDescription}>{example.description}</p>
      <CodeEditor
        value={code}
        onChange={onCodeChange}
        readOnly={isRunning} // Optionally make read-only while running
      />
      <div className={styles.editorControls}>
        <div>
          <button
            onClick={onRunCode}
            disabled={!canRun}
            className={styles.runButton}
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
          {renderExtraControls && renderExtraControls()}
        </div>
        <div>
          {isPyodideLoading && (
            <span className={styles.pyodideStatus}>Initializing Python...</span>
          )}
          {pyodideError && (
            <span className={styles.pyodideError}>Pyodide Error!</span>
          )}
        </div>
      </div>

      {(isRunning || hasBeenRun || output) && ( // Ensure output area shows if output is set (e.g., by tests)
        <div className={styles.outputArea}>
          <pre>
            {output ||
              (isRunning ? (
                ""
              ) : (
                <span className={styles.outputEmpty}>
                  Code executed (no output).
                </span>
              ))}
          </pre>
        </div>
      )}
      {renderExtraOutput && renderExtraOutput()}
    </div>
  );
};

export default InteractiveExampleDisplay;
