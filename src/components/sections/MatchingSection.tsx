import React, { useMemo } from "react";
import type { MatchingSectionData, UnitId, LessonId } from "../../types/data";
import { useSectionProgress } from "../../hooks/useSectionProgress";
import styles from "./MatchingSection.module.css";
import sectionStyles from "./Section.module.css";
import ContentRenderer from "../content_blocks/ContentRenderer";

interface MatchingSectionProps {
  section: MatchingSectionData;
  unitId: UnitId;
  lessonId: LessonId;
}

// The state now maps the prompt text to the matched answer text
interface SavedMatchingState {
  userMatches: { [promptText: string]: string | null };
}

const MatchingSection: React.FC<MatchingSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  const storageKey = `matchingState_${unitId}_${lessonId}_${section.id}`;

  // --- Data Derivation ---
  // Derive prompts, answers, and the solution from the new data structure
  const { prompts, answers, solution } = useMemo(() => {
    const prompts = section.prompts.map((p) => Object.keys(p)[0]);
    const answers = section.prompts.map((p) => Object.values(p)[0]);
    const solution = Object.fromEntries(
      section.prompts.flatMap((p) => Object.entries(p))
    );
    return { prompts, answers, solution };
  }, [section.prompts]);

  const initialShuffledAnswers = useMemo(() => {
    if (
      section.initialOrder &&
      section.initialOrder.length === answers.length
    ) {
      return section.initialOrder.map((index) => answers[index]);
    }
    // Fallback to a simple shuffle if no order is provided
    return [...answers].sort(() => Math.random() - 0.5);
  }, [answers, section.initialOrder]);

  // --- State and Completion Logic ---
  const checkCompletion = (state: SavedMatchingState): boolean => {
    return prompts.every(
      (prompt) => state.userMatches[prompt] === solution[prompt]
    );
  };

  const [savedState, setSavedState, isSectionComplete] =
    useSectionProgress<SavedMatchingState>(
      unitId,
      lessonId,
      section.id,
      storageKey,
      { userMatches: {} },
      checkCompletion
    );

  // --- Drag and Drop Handlers ---
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    answerText: string
  ) => {
    e.dataTransfer.setData("text/plain", answerText);
    e.currentTarget.classList.add(styles.dragging);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove(styles.dragging);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.dropZoneHover);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove(styles.dropZoneHover);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetPromptText: string
  ) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dropZoneHover);
    const droppedAnswerText = e.dataTransfer.getData("text/plain");

    if (!droppedAnswerText) return;

    setSavedState((prevState) => {
      const newUserMatches = { ...prevState.userMatches };

      // Find where the dropped answer was previously and clear that slot
      let sourcePromptText: string | null = null;
      for (const pText in newUserMatches) {
        if (newUserMatches[pText] === droppedAnswerText) {
          sourcePromptText = pText;
          break;
        }
      }
      if (sourcePromptText) {
        newUserMatches[sourcePromptText] = null;
      }

      // Place the new match
      newUserMatches[targetPromptText] = droppedAnswerText;

      return { userMatches: newUserMatches };
    });
  };

  // --- Rendering Logic ---
  const unmatchedOptions = useMemo(() => {
    const matchedAnswers = new Set(Object.values(savedState.userMatches));
    return initialShuffledAnswers.filter(
      (answer) => !matchedAnswers.has(answer)
    );
  }, [savedState.userMatches, initialShuffledAnswers]);

  return (
    <section id={section.id} className={sectionStyles.section}>
      <h2 className={sectionStyles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

      <div className={styles.matchingContainer}>
        <div className={styles.promptsContainer}>
          {prompts.map((promptText) => {
            const matchedAnswerText = savedState.userMatches[promptText];
            const isCorrect = isSectionComplete
              ? solution[promptText] === matchedAnswerText
              : undefined;

            return (
              <div key={promptText} className={styles.matchRow}>
                <div className={styles.promptItem}>{promptText}</div>
                <div
                  className={`${styles.dropZone} ${
                    isCorrect === true ? styles.correct : ""
                  } ${isCorrect === false ? styles.incorrect : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, promptText)}
                >
                  {matchedAnswerText ? (
                    <div
                      className={styles.matchedOption}
                      draggable
                      onDragStart={(e) => handleDragStart(e, matchedAnswerText)}
                      onDragEnd={handleDragEnd}
                    >
                      {matchedAnswerText}
                    </div>
                  ) : (
                    <span className={styles.dropZonePlaceholder}>
                      Drop here
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.optionsPool}>
          <h4>Drag an option from here...</h4>
          {unmatchedOptions.map((answerText) => (
            <div
              key={answerText}
              className={styles.draggableOption}
              draggable
              onDragStart={(e) => handleDragStart(e, answerText)}
              onDragEnd={handleDragEnd}
            >
              {answerText}
            </div>
          ))}
        </div>
      </div>

      {isSectionComplete && (
        <div
          className={sectionStyles.completionMessage}
          style={{ marginTop: "1.5rem" }}
        >
          {section.feedback ? section.feedback.correct : "Correct!"}
        </div>
      )}
    </section>
  );
};

export default MatchingSection;
