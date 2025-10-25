// src/components/ActiveTestItem.tsx
import React from "react";
import CodeEditor from "./CodeEditor"; // Import the CodeEditor component
import styles from "../pages/student/CodeEditorPage.module.css";

export type TestStatus = "pending" | "passed" | "failed" | "error";

export interface ActiveTest {
  id: string;
  name: string;
  code: string;
  status: TestStatus;
  output?: string;
}

interface ActiveTestItemProps {
  test: ActiveTest;
  onDelete: (id: string) => void;
}

const ActiveTestItem: React.FC<ActiveTestItemProps> = React.memo(
  ({ test, onDelete }) => {
    // Dynamically create the status class name
    const statusClassName =
      styles[
        "status" + test.status.charAt(0).toUpperCase() + test.status.slice(1)
      ] || styles.statusPending;

    return (
      <div className={`${styles.activeTestItem} ${statusClassName}`}>
        <div className={styles.activeTestItemHeader}>
          <strong>{test.name}</strong>
          <button
            onClick={() => onDelete(test.id)}
            className={styles.deleteTestButton}
            title="Remove test from suite"
            aria-label={`Remove test ${test.name}`}
          >
            &times; {/* Multiplication sign for a nice 'x' delete icon */}
          </button>
        </div>

        {/* Use CodeEditor for displaying the test code snippet */}
        {/* Make it read-only and provide a no-op onChange handler */}
        {/* Apply styling to control its appearance as a snippet */}
        <div className={styles.activeTestCodeSnippetWrapper}>
          <CodeEditor
            value={test.code}
            readOnly={true}
            onChange={() => {}} // No-op for read-only editor
            height="auto" // Allow it to size to content
            minHeight="30px" // Minimum height
            // You might want to configure a smaller font or less padding via basicSetup
            // if the default CodeEditor settings are too bulky for a snippet.
            // For now, using default settings.
          />
        </div>

        {/* Display output for failed/error tests or if pending with a message */}
        {test.output && test.status !== "passed" && (
          <div className={styles.testOutputDetails}>{test.output}</div>
        )}
        {test.status === "pending" && test.output && (
          <div className={styles.testOutputDetails}>{test.output}</div>
        )}
      </div>
    );
  }
);

export default ActiveTestItem;
