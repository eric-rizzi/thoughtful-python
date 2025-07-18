// src/components/sections/PredictionSection.tsx
import React, { useCallback, useMemo } from "react"; // Added useMemo
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LessonId, PredictionSectionData, UnitId } from "../../types/data";
import styles from "./Section.module.css";
import { useSectionProgress } from "../../hooks/useSectionProgress";
import CodeEditor from "../CodeEditor";
import ContentRenderer from "../content_blocks/ContentRenderer";

interface PredictionSectionProps {
  section: PredictionSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}

interface PredictionsMap {
  [rowIndex: number]: {
    userAnswer: string;
    isCorrect: boolean | null;
  };
}

// Define initial state outside the component or use useMemo for stable reference
const STABLE_INITIAL_PREDICTIONS_MAP: PredictionsMap = {};

const PredictionSection: React.FC<PredictionSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  const storageKey = `predictState_${lessonId}_${section.id}`;
  // Use the stable reference for initialState
  // const initialState = useMemo((): PredictionsMap => ({}), []); // Alternative if it needed to be dynamic but stable

  const checkPredictionCompletion = useCallback(
    (currentPredictions: PredictionsMap): boolean => {
      // ... (rest of the function is fine)
      const allRows = section.predictionTable.rows;
      if (allRows.length === 0) {
        return false;
      }
      return allRows.every(
        (row, index) => currentPredictions[index]?.isCorrect === true
      );
    },
    [section.predictionTable.rows]
  );

  const [predictions, setPredictions, isSectionComplete] =
    useSectionProgress<PredictionsMap>(
      unitId,
      lessonId,
      section.id,
      storageKey,
      STABLE_INITIAL_PREDICTIONS_MAP, // Pass the stable initial state
      checkPredictionCompletion
    );

  // ... rest of your PredictionSection component is likely fine
  const handlePredictionChange = useCallback(
    (rowIndex: number, newValue: string) => {
      const expectedValue = section.predictionTable.rows[rowIndex].expected;
      let isNowCorrect: boolean | null = null;
      const trimmedValue = newValue.trim();

      if (trimmedValue === "") {
        isNowCorrect = null;
      } else {
        try {
          const expectedStr = String(expectedValue).trim();
          let userValueToCompare = trimmedValue;

          if (typeof expectedValue === "number") {
            const userNum = parseFloat(trimmedValue);
            if (!isNaN(userNum)) {
              isNowCorrect = Math.abs(userNum - expectedValue) < 1e-9;
            } else {
              isNowCorrect = false;
            }
          } else if (typeof expectedValue === "boolean") {
            userValueToCompare = trimmedValue.toLowerCase();
            isNowCorrect =
              userValueToCompare === String(expectedValue).toLowerCase();
          } else {
            isNowCorrect = userValueToCompare === expectedStr;
          }
        } catch {
          isNowCorrect = false;
        }
      }

      setPredictions((prevPredictions) => ({
        ...prevPredictions,
        [rowIndex]: {
          userAnswer: newValue,
          isCorrect: isNowCorrect,
        },
      }));
    },
    [section.predictionTable.rows, setPredictions]
  );

  const tableBody = useMemo(() => {
    return section.predictionTable.rows.map((row, rowIndex) => {
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
              onChange={(e) => handlePredictionChange(rowIndex, e.target.value)}
              placeholder="Your prediction"
              aria-label={`Prediction for inputs ${row.inputs.join(", ")}`}
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
    });
  }, [section.predictionTable.rows, predictions, handlePredictionChange]);

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

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
