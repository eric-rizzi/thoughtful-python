import React, { useMemo } from "react";
import type {
  CoverageSectionData,
  InputParam,
  LessonId,
  UnitId,
} from "../../types/data";
import styles from "./Section.module.css";
import coverageStyles from "./CoverageSection.module.css";
import { useCoverageLogic } from "../../hooks/useCoverageLogic";
import CodeEditor from "../CodeEditor";
import ContentRenderer from "../content_blocks/ContentRenderer";

interface CoverageSectionProps {
  section: CoverageSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}

const CoverageSection: React.FC<CoverageSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  const {
    challengeStates,
    isSectionComplete,
    runningStates,
    isLoading,
    pyodideError,
    handleInputChange,
    runChallenge,
  } = useCoverageLogic({
    unitId,
    lessonId,
    sectionId: section.id,
    codeToRun: section.example.initialCode,
    inputParams: section.inputParams,
    coverageChallenges: section.coverageChallenges,
  });

  const completedCount = useMemo(() => {
    return Object.values(challengeStates).filter((s) => s.isCorrect).length;
  }, [challengeStates]);
  const totalChallenges = section.coverageChallenges.length;
  const progressPercent =
    totalChallenges > 0 ? (completedCount / totalChallenges) * 100 : 0;

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

      <div className={styles.exampleContainer}>
        <h4 className={coverageStyles.coverageCodeDisplayTitle}>
          Code to Analyze:
        </h4>
        <CodeEditor
          value={section.example.initialCode}
          onChange={() => {}}
          readOnly={true}
          minHeight="50px"
        />
      </div>

      <div className={coverageStyles.coverageInstruction}>
        <p>
          For each "Expected Output" below, fill in the input fields and click
          "Run" to see if the code produces that exact output.
        </p>
      </div>

      <div className={coverageStyles.coverageTableContainer}>
        <table className={coverageStyles.coverageTable}>
          <thead>
            <tr>
              {section.inputParams.map((param) => (
                <th key={param.name}>Input: {param.name}</th>
              ))}
              <th>Expected Output</th>
              <th>Actual Output</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {section.coverageChallenges.map((challenge) => {
              const state = challengeStates[challenge.id];
              const isRunning = runningStates[challenge.id] || false;
              const rowClass =
                state.isCorrect === true
                  ? coverageStyles.correctRow
                  : state.isCorrect === false
                  ? coverageStyles.incorrectRow
                  : "";

              return (
                <tr key={challenge.id} className={rowClass}>
                  {section.inputParams.map((param: InputParam) => (
                    <td key={param.name}>
                      <input
                        type={param.type === "number" ? "number" : "text"}
                        className={coverageStyles.coverageInput}
                        placeholder={param.placeholder}
                        value={state.inputs[param.name] ?? ""}
                        onChange={(e) =>
                          handleInputChange(
                            challenge.id,
                            param.name,
                            e.target.value
                          )
                        }
                        disabled={isRunning || isLoading}
                      />
                    </td>
                  ))}
                  <td className={coverageStyles.expectedOutputCell}>
                    <pre>{challenge.expectedOutput}</pre>
                  </td>
                  <td
                    className={`${coverageStyles.actualOutputCell} ${
                      state.isCorrect === false ? styles.incorrect : ""
                    }`}
                  >
                    <pre>{state.actualOutput ?? ""}</pre>
                  </td>
                  <td className={coverageStyles.actionCell}>
                    <button
                      onClick={() => runChallenge(challenge)}
                      disabled={isRunning || isLoading || !!pyodideError}
                      className={coverageStyles.coverageRunButton}
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

      <div className={coverageStyles.coverageProgress}>
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
          {completedCount} / {totalChallenges} challenges completed
        </span>
      </div>
    </section>
  );
};

export default CoverageSection;
