// src/components/sections/PredictionSection.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { PredictionSection as PredictionSectionData } from "../../types/data";
import styles from "./Section.module.css";
import { saveProgress, loadProgress } from "../../lib/localStorageUtils";
import CodeEditor from "../CodeEditor";
import { useProgressActions } from "../../stores/progressStore";

interface PredictionSectionProps {
  section: PredictionSectionData;
  lessonId: string;
}

// Type for the state storing user answers and correctness (can remain local or from types/data.ts)
interface PredictionState {
  [rowIndex: number]: {
    userAnswer: string;
    isCorrect: boolean | null;
  };
}

// Type for saved state in localStorage (can remain local or from types/data.ts)
interface SavedPredictionState {
  predictions: PredictionState;
}

const PredictionSection: React.FC<PredictionSectionProps> = ({
  section,
  lessonId,
}) => {
  const [predictions, setPredictions] = useState<PredictionState>({});
  const [allCorrectState, setAllCorrectState] = useState<boolean>(false);
  const storageKey = `predictState_${lessonId}_${section.id}`;
  const { completeSection } = useProgressActions();

  // --- Initialization & Persistence ---
  useEffect(() => {
    const savedState = loadProgress<SavedPredictionState>(storageKey);
    let initialPredictions: PredictionState = {};
    if (savedState?.predictions) {
      initialPredictions = savedState.predictions;
    }
    setPredictions(initialPredictions);
    // Initial check for completion based on loaded state will be handled by the effect below
  }, [storageKey]); // Rerun only if storageKey changes (lessonId/section.id)

  // --- Effect to check for completion and call Zustand action ---
  useEffect(() => {
    const checkAndComplete = () => {
      const allRows = section.predictionTable.rows;
      if (allRows.length === 0) {
        // No predictions to make
        setAllCorrectState(false); // Or true, depending on desired behavior for empty sections
        return false;
      }
      const currentAllCorrect = allRows.every(
        (row, index) => predictions[index]?.isCorrect === true
      );

      setAllCorrectState(currentAllCorrect); // Update local state for UI message

      if (currentAllCorrect) {
        console.log(
          `PredictionSection ${section.id} is complete. Marking via Zustand.`
        );
        completeSection(lessonId, section.id); // <-- USE ZUSTAND ACTION
      }
      return currentAllCorrect; // Return for potential use in handlePredictionChange
    };

    checkAndComplete();
  }, [
    predictions,
    section.predictionTable.rows,
    section.id,
    lessonId,
    completeSection,
  ]);

  // --- Event Handler ---
  const handlePredictionChange = useCallback(
    (rowIndex: number, newValue: string) => {
      const expectedValue = section.predictionTable.rows[rowIndex].expected;
      let isNowCorrect: boolean | null = null;
      const trimmedValue = newValue.trim();

      if (trimmedValue === "") {
        isNowCorrect = null;
      } else {
        try {
          const userNum = parseFloat(trimmedValue);
          const expectedNum =
            typeof expectedValue === "number"
              ? expectedValue
              : parseFloat(String(expectedValue));
          if (!isNaN(userNum) && !isNaN(expectedNum)) {
            isNowCorrect = Math.abs(userNum - expectedNum) < 1e-9;
          } else {
            isNowCorrect = trimmedValue === String(expectedValue);
          }
        } catch {
          isNowCorrect = false;
        }
      }

      setPredictions((prevPredictions) => {
        const updatedRowState = {
          userAnswer: newValue,
          isCorrect: isNowCorrect,
        };
        const newPredictions = {
          ...prevPredictions,
          [rowIndex]: updatedRowState,
        };
        // Save progress immediately on prediction change
        saveProgress<SavedPredictionState>(storageKey, {
          predictions: newPredictions,
        });
        return newPredictions;
      });
      // The useEffect depending on 'predictions' will handle checking overall completion
    },
    [section.predictionTable.rows, storageKey]
  ); // Dependencies

  // --- Rendering ---
  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      {section.functionDisplay && (
        <div className={styles.functionDisplayContainer}>
          <h4 className={styles.functionDisplayTitle}>
            {section.functionDisplay.title}
          </h4>
          <CodeEditor
            value={section.functionDisplay.code}
            onChange={() => {}}
            readOnly={true}
            height="auto"
            minHeight="50px"
          />
        </div>
      )}

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
                  {row.inputs.map((inputVal, inputIndex) => (
                    <td key={`input-${inputIndex}`}>{String(inputVal)}</td>
                  ))}
                  <td>
                    <input
                      type="text"
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
                  <td className={styles.statusCell}>
                    {rowState?.isCorrect === true && (
                      <span className={styles.statusIndicatorCorrect}></span>
                    )}
                    {rowState?.isCorrect === false && (
                      <span className={styles.statusIndicatorIncorrect}></span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {allCorrectState && section.completionMessage && (
        <div className={styles.completionMessage}>
          {section.completionMessage}
        </div>
      )}
    </section>
  );
};

export default PredictionSection;
