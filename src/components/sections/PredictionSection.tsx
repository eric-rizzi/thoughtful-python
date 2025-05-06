// src/components/sections/PredictionSection.tsx
import React, { useState, useEffect, useCallback } from "react";
import type {
  PredictionSection as PredictionSectionData,
  PredictionTableRow,
} from "../../types/data";
import styles from "./Section.module.css";
import { saveProgress, loadProgress } from "../../lib/localStorageUtils";
import CodeEditor from "../CodeEditor"; // Import CodeEditor for displaying function

interface PredictionSectionProps {
  section: PredictionSectionData;
  lessonId: string;
  onSectionComplete: (sectionId: string) => void;
}

// Type for the state storing user answers and correctness
interface PredictionState {
  [rowIndex: number]: {
    userAnswer: string;
    isCorrect: boolean | null; // null = unanswered, true = correct, false = incorrect
  };
}

// Type for saved state in localStorage
interface SavedPredictionState {
  predictions: PredictionState;
}

const PredictionSection: React.FC<PredictionSectionProps> = ({
  section,
  lessonId,
  onSectionComplete,
}) => {
  const [predictions, setPredictions] = useState<PredictionState>({});
  const [allCorrect, setAllCorrect] = useState<boolean>(false);
  const storageKey = `predictState_${lessonId}_${section.id}`;

  // --- Initialization & Persistence ---

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadProgress<SavedPredictionState>(storageKey);
    let initialPredictions = {};
    if (savedState && savedState.predictions) {
      initialPredictions = savedState.predictions;
    }
    setPredictions(initialPredictions);
    // Initial check if all are correct based on loaded state
    checkIfAllCorrect(initialPredictions, section.predictionTable.rows);
  }, [storageKey, section.predictionTable.rows]); // Rerun if section data changes

  // Function to check if all predictions are correct
  const checkIfAllCorrect = (
    currentPredictions: PredictionState,
    rows: PredictionTableRow[]
  ) => {
    const allDone = rows.every(
      (row, index) => currentPredictions[index]?.isCorrect === true
    );
    setAllCorrect(allDone);
    if (allDone) {
      console.log(`Placeholder: Prediction Section ${section.id} completed.`);
      onSectionComplete(section.id);
    }
    return allDone;
  };

  // --- Event Handler ---

  const handlePredictionChange = useCallback(
    (rowIndex: number, newValue: string) => {
      const expectedValue = section.predictionTable.rows[rowIndex].expected;
      let isNowCorrect: boolean | null = null;

      const trimmedValue = newValue.trim();

      if (trimmedValue === "") {
        isNowCorrect = null; // Unanswered
      } else {
        // Attempt comparison (handle potential type mismatch - assume number for now)
        // TODO: Make comparison type-aware if expected values can be strings etc.
        try {
          // Try parsing user input as float if expected is number
          const userNum = parseFloat(trimmedValue);
          const expectedNum =
            typeof expectedValue === "number"
              ? expectedValue
              : parseFloat(String(expectedValue));
          // Use isNaN checks for safety
          if (!isNaN(userNum) && !isNaN(expectedNum)) {
            // Basic comparison (consider tolerance for floats if needed)
            isNowCorrect = Math.abs(userNum - expectedNum) < 1e-9; // Example float comparison
          } else {
            // Fallback to string comparison if parsing fails or types differ fundamentally
            isNowCorrect = trimmedValue === String(expectedValue);
          }
        } catch {
          isNowCorrect = false; // Treat comparison errors as incorrect
        }
      }

      // Update state for this row
      const updatedPredictions = {
        ...predictions,
        [rowIndex]: { userAnswer: newValue, isCorrect: isNowCorrect },
      };
      setPredictions(updatedPredictions);

      // Check overall completion and save
      const allAreCorrect = checkIfAllCorrect(
        updatedPredictions,
        section.predictionTable.rows
      );
      saveProgress<SavedPredictionState>(storageKey, {
        predictions: updatedPredictions,
      });
    },
    [
      predictions,
      section.predictionTable.rows,
      onSectionComplete,
      section.id,
      storageKey,
    ]
  ); // Dependencies

  // --- Rendering ---

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      {/* Display the function code */}
      {section.functionDisplay && (
        <div className={styles.functionDisplayContainer}>
          <h4 className={styles.functionDisplayTitle}>
            {section.functionDisplay.title}
          </h4>
          {/* Use CodeEditor in readOnly mode for syntax highlighting */}
          <CodeEditor
            value={section.functionDisplay.code}
            onChange={() => {}} // No-op change handler
            readOnly={true}
            height="auto" // Adjust height as needed
            minHeight="50px"
          />
          {/* Or use simple pre/code if CodeEditor is too heavy here */}
          {/* <pre className={styles.functionDisplayCode}><code>{section.functionDisplay.code}</code></pre> */}
        </div>
      )}

      {/* Prediction Table */}
      <div className={styles.predictionTableContainer}>
        <table className={styles.predictionTable}>
          <thead>
            <tr>
              {section.predictionTable.columns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.predictionTable.rows.map((row, rowIndex) => {
              const rowState = predictions[rowIndex];
              const rowClass =
                rowState?.isCorrect === true
                  ? styles.correctRow
                  : rowState?.isCorrect === false
                  ? styles.incorrectRow
                  : "";
              const inputClass =
                rowState?.isCorrect === true
                  ? styles.predictionInputCorrect
                  : rowState?.isCorrect === false
                  ? styles.predictionInputIncorrect
                  : styles.predictionInput;

              return (
                <tr key={rowIndex} className={rowClass}>
                  {/* Input Columns */}
                  {row.inputs.map((inputVal, inputIndex) => (
                    <td key={`input-${inputIndex}`}>{inputVal}</td>
                  ))}
                  {/* Prediction Input Column */}
                  <td>
                    <input
                      type="text" // Keep as text, parse on check
                      className={inputClass}
                      value={rowState?.userAnswer ?? ""}
                      onChange={(e) =>
                        handlePredictionChange(rowIndex, e.target.value)
                      }
                      placeholder="Your prediction"
                      aria-label={`Prediction for inputs ${row.inputs.join(
                        ", "
                      )}`}
                    />
                  </td>
                  {/* Status Column */}
                  <td className={styles.statusCell}>
                    {rowState?.isCorrect === true && (
                      <span className={styles.statusIndicatorCorrect}></span>
                    )}
                    {rowState?.isCorrect === false && (
                      <span className={styles.statusIndicatorIncorrect}></span>
                    )}
                    {/* Render nothing if isCorrect is null (unanswered) */}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Completion Message */}
      {allCorrect && section.completionMessage && (
        <div className={styles.completionMessage}>
          {section.completionMessage}
        </div>
      )}
    </section>
  );
};

export default PredictionSection;
