import React, { useState, useMemo } from "react";
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

// The state we'll save for this section
interface SavedMatchingState {
  // Stores the user's current matches, mapping promptId to optionId
  userMatches: { [promptId: string]: string | null };
}

const MatchingSection: React.FC<MatchingSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  const storageKey = `matchingState_${unitId}_${lessonId}_${section.id}`;

  const checkCompletion = (state: SavedMatchingState): boolean => {
    if (Object.keys(state.userMatches).length !== section.prompts.length) {
      return false;
    }
    return section.prompts.every(
      (prompt) => state.userMatches[prompt.id] === section.solution[prompt.id]
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

  const [draggedOptionId, setDraggedOptionId] = useState<string | null>(null);

  const unmatchedOptions = useMemo(() => {
    const matchedOptionIds = new Set(Object.values(savedState.userMatches));
    return section.options.filter((option) => !matchedOptionIds.has(option.id));
  }, [savedState.userMatches, section.options]);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    optionId: string
  ) => {
    setDraggedOptionId(optionId);
    e.dataTransfer.setData("text/plain", optionId);
    e.currentTarget.classList.add(styles.dragging);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove(styles.dragging);
    setDraggedOptionId(null);
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
    targetPromptId: string
  ) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dropZoneHover);
    const droppedOptionId = e.dataTransfer.getData("text/plain");

    if (!droppedOptionId) return;

    setSavedState((prevState) => {
      const newUserMatches = { ...prevState.userMatches };

      // Find the prompt where the dropped option was originally, if any.
      let sourcePromptId: string | null = null;
      for (const pId in newUserMatches) {
        if (newUserMatches[pId] === droppedOptionId) {
          sourcePromptId = pId;
          break;
        }
      }

      // If the dropped option was already matched, clear its original spot.
      if (sourcePromptId) {
        newUserMatches[sourcePromptId] = null;
      }

      // Place the new match. This will automatically "boot out" any
      // existing item in the target slot by overwriting it.
      newUserMatches[targetPromptId] = droppedOptionId;

      return { userMatches: newUserMatches };
    });
  };

  return (
    <section id={section.id} className={sectionStyles.section}>
      <h2 className={sectionStyles.title}>{section.title}</h2>
      <div className={sectionStyles.content}>
        <ContentRenderer content={section.content} />
      </div>

      <div className={styles.matchingContainer}>
        <div className={styles.promptsContainer}>
          {section.prompts.map((prompt) => {
            const matchedOptionId = savedState.userMatches[prompt.id];
            const matchedOption = matchedOptionId
              ? section.options.find((o) => o.id === matchedOptionId)
              : null;
            const isCorrect = isSectionComplete
              ? section.solution[prompt.id] === matchedOptionId
              : undefined;

            return (
              <div key={prompt.id} className={styles.matchRow}>
                <div className={styles.promptItem}>{prompt.text}</div>
                <div
                  className={`${styles.dropZone} ${
                    isCorrect === true ? styles.correct : ""
                  } ${isCorrect === false ? styles.incorrect : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, prompt.id)}
                >
                  {matchedOption ? (
                    <div
                      className={styles.matchedOption}
                      draggable
                      onDragStart={(e) => handleDragStart(e, matchedOption.id)}
                      onDragEnd={handleDragEnd}
                    >
                      {matchedOption.text}
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
          {unmatchedOptions.map((option) => (
            <div
              key={option.id}
              className={styles.draggableOption}
              draggable
              onDragStart={(e) => handleDragStart(e, option.id)}
              onDragEnd={handleDragEnd}
            >
              {option.text}
            </div>
          ))}
        </div>
      </div>

      {isSectionComplete && (
        <div
          className={sectionStyles.completionMessage}
          style={{ marginTop: "1.5rem" }}
        >
          🎉 Well done! All items are correctly matched.
        </div>
      )}
    </section>
  );
};

export default MatchingSection;
