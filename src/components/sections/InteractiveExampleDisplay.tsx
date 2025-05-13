// src/components/sections/InteractiveExampleDisplay.tsx
import React from "react";
import CodeEditor from "../CodeEditor";
import styles from "./Section.module.css";
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
  renderExtraControls?: () => React.ReactNode;
  renderExtraOutput?: () => React.ReactNode;
  preventPasteInEditor?: boolean; // New prop
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
  preventPasteInEditor = false, // Default to false
}) => {
  const canRun = !isPyodideLoading && !pyodideError && !isRunning;

  return (
    <div className={styles.exampleContainer}>
      <h3 className={styles.exampleTitle}>{example.title}</h3>
      <p className={styles.exampleDescription}>{example.description}</p>
      <CodeEditor
        value={code}
        onChange={onCodeChange}
        readOnly={isRunning}
        preventPaste={preventPasteInEditor} // Pass down the prop
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

      {(isRunning || hasBeenRun || output) && (
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
