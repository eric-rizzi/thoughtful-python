import React, { useMemo } from "react";
import type { PredictionSectionData, UnitId, LessonId } from "../../types/data";
import styles from "./Section.module.css";
import predictionStyles from "./CoverageSection.module.css";
import { usePredictionLogic } from "../../hooks/usePredictionLogic";
import CodeEditor from "../CodeEditor";
import ContentRenderer from "../content_blocks/ContentRenderer";

interface PredictionSectionProps {
  section: PredictionSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}

const PredictionSection: React.FC<PredictionSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  const {
    predictions,
    isSectionComplete,
    runningStates,
    isLoading,
    pyodideError,
    handlePredictionChange,
    runPrediction,
  } = usePredictionLogic({
    unitId,
    lessonId,
    sectionId: section.id,
    functionCode: section.example.initialCode,
    predictionRows: section.predictionTable.rows,
  });

  const completedCount = useMemo(() => {
    return Object.values(predictions).filter((p) => p.isCorrect).length;
  }, [predictions]);
  const totalChallenges = section.predictionTable.rows.length;
  const progressPercent =
    totalChallenges > 0 ? (completedCount / totalChallenges) * 100 : 0;

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

      <div className={styles.exampleContainer}>
        <h4 className={predictionStyles.coverageCodeDisplayTitle}>
          Code to Analyze:
        </h4>
        <CodeEditor
          value={section.example.initialCode}
          onChange={() => {}}
          readOnly={true}
          minHeight="50px"
        />
      </div>

      <div className={predictionStyles.coverageTableContainer}>
        <table className={predictionStyles.coverageTable}>
          <thead>
            <tr>
              {section.predictionTable.columns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
              <th>Actual Output</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {section.predictionTable.rows.map((row, rowIndex) => {
              const rowState = predictions[rowIndex];
              const isRunning = runningStates[rowIndex];
              const rowClass =
                rowState?.isCorrect === true
                  ? predictionStyles.correctRow
                  : rowState?.isCorrect === false
                  ? predictionStyles.incorrectRow
                  : "";

              return (
                <tr key={rowIndex} className={rowClass}>
                  {row.inputs.map((inputVal, inputIndex) => (
                    <td key={`input-${inputIndex}`}>{String(inputVal)}</td>
                  ))}
                  <td>
                    <input
                      type="text"
                      className={predictionStyles.coverageInput}
                      value={rowState?.userAnswer ?? ""}
                      onChange={(e) =>
                        handlePredictionChange(rowIndex, e.target.value)
                      }
                      placeholder="Your prediction"
                      disabled={isRunning || isLoading}
                    />
                  </td>
                  <td
                    className={`${predictionStyles.actualOutputCell} ${
                      rowState?.isCorrect === false ? styles.incorrect : ""
                    }`}
                  >
                    <pre>{rowState?.actualOutput ?? " "}</pre>
                  </td>
                  <td className={predictionStyles.actionCell}>
                    <button
                      onClick={() => runPrediction(rowIndex)}
                      disabled={isRunning || isLoading || !!pyodideError}
                      className={predictionStyles.coverageRunButton}
                    >
                      {isRunning ? "Running..." : "Run"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={predictionStyles.coverageProgress}>
        <div className={styles.progressBar}>
          <div
            className={
              isSectionComplete
                ? styles.progressFillComplete
                : styles.progressFill
            }
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <span className={styles.progressText}>
          {completedCount} / {totalChallenges} predictions correct
        </span>
      </div>
    </section>
  );
};

export default PredictionSection;
