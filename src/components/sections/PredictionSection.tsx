// src/components/sections/PredictionSection.tsx
import React, { useCallback, useMemo } from "react";
import type { PredictionSection as PredictionSectionData } from "../../types/data";
import styles from "./Section.module.css";
import { useSectionProgress } from "../../hooks/useSectionProgress";
import CodeEditor from "../CodeEditor";

interface PredictionSectionProps {
  section: PredictionSectionData;
  lessonId: string;
}

// Type for the state storing user answers and correctness for each row
// This will be our TState for useSectionProgress
interface PredictionsMap {
  [rowIndex: number]: {
    userAnswer: string;
    isCorrect: boolean | null;
  };
}

const PredictionSection: React.FC<PredictionSectionProps> = ({
  section,
  lessonId,
}) => {
  const storageKey = `predictState_${lessonId}_${section.id}`;
  const initialState: PredictionsMap = {};

  // Define the completion check function for this section type
  const checkPredictionCompletion = useCallback(
    (currentPredictions: PredictionsMap): boolean => {
      const allRows = section.predictionTable.rows;
      if (allRows.length === 0) {
        return false; // Or true, depending on desired behavior for empty sections
      }
      return allRows.every(
        (row, index) => currentPredictions[index]?.isCorrect === true
      );
    },
    [section.predictionTable.rows]
  ); // Depends on the section data defining the rows

  // Use the new hook
  const [
    predictions, // This is the PredictionsMap state
    setPredictions,
    isSectionComplete, // This boolean comes from the hook, derived from checkPredictionCompletion
  ] = useSectionProgress<PredictionsMap>(
    lessonId,
    section.id,
    storageKey,
    initialState,
    checkPredictionCompletion
  );

  const handlePredictionChange = useCallback(
    (rowIndex: number, newValue: string) => {
      const expectedValue = section.predictionTable.rows[rowIndex].expected;
      let isNowCorrect: boolean | null = null;
      const trimmedValue = newValue.trim();

      if (trimmedValue === "") {
        isNowCorrect = null;
      } else {
        try {
          // Convert both to string for a more robust general comparison,
          // or add type-aware comparison if types are more varied.
          // For this example, let's assume string comparison after trimming is a decent default.
          // If expectedValue is numeric, convert user input to number if possible.
          const expectedStr = String(expectedValue).trim();
          const userValueToCompare = trimmedValue;

          if (typeof expectedValue === "number") {
            const userNum = parseFloat(trimmedValue);
            if (!isNaN(userNum)) {
              // Using a small tolerance for float comparisons
              isNowCorrect = Math.abs(userNum - expectedValue) < 1e-9;
            } else {
              isNowCorrect = false; // Cannot parse as number, so incorrect if number expected
            }
          } else {
            // For strings or other types, direct string comparison
            isNowCorrect = userValueToCompare === expectedStr;
          }
        } catch {
          isNowCorrect = false; // Treat comparison errors as incorrect
        }
      }

      setPredictions((prevPredictions) => ({
        ...prevPredictions,
        [rowIndex]: {
          userAnswer: newValue, // Store the raw new value
          isCorrect: isNowCorrect,
        },
      }));
      // The hook's useEffect will automatically run checkPredictionCompletion
      // with the new state and handle global progress updates.
    },
    [section.predictionTable.rows, setPredictions]
  );

  // Memoize the rendering of the table body to optimize if section data doesn't change frequently
  const tableBody = useMemo(() => {
    return section.predictionTable.rows.map((row, rowIndex) => {
      const rowState = predictions[rowIndex]; // Get state for the current row
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
            <td key={`input-${inputIndex}`}>{String(inputVal)}</td>
          ))}
          {/* Prediction Input Column */}
          <td>
            <input
              type="text"
              className={inputClass}
              value={rowState?.userAnswer ?? ""}
              onChange={(e) => handlePredictionChange(rowIndex, e.target.value)}
              placeholder="Your prediction"
              aria-label={`Prediction for inputs ${row.inputs.join(", ")}`}
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
            {/* No icon if isCorrect is null (i.e., not yet answered or empty) */}
          </td>
        </tr>
      );
    });
  }, [section.predictionTable.rows, predictions, handlePredictionChange]);

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
          <CodeEditor
            value={section.functionDisplay.code}
            onChange={() => {}} // No-op for readOnly
            readOnly={true}
            height="auto"
            minHeight="50px"
          />
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
          <tbody>{tableBody}</tbody>
        </table>
      </div>

      {isSectionComplete && section.completionMessage && (
        <div className={styles.completionMessage}>
          {section.completionMessage}
        </div>
      )}
    </section>
  );
};

export default PredictionSection;
