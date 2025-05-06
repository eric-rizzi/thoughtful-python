// src/components/ActiveTestItem.tsx
import React from "react";
import styles from "../pages/CodeEditorPage.module.css"; // Assuming styles are in CodeEditorPage.module.css

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
            &times;
          </button>
        </div>
        <pre>
          <code>{test.code}</code>
        </pre>
        {test.output && test.status !== "passed" && (
          <div className={styles.testOutputDetails}>{test.output}</div>
        )}
        {/* Show 'Running...' or 'Pending...' if status is pending and there's an output message like that */}
        {test.status === "pending" && test.output && (
          <div className={styles.testOutputDetails}>{test.output}</div>
        )}
      </div>
    );
  }
);

export default ActiveTestItem;
