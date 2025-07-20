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

// Define the shape of a draggable option, giving each a unique ID
interface DraggableOption {
  id: string; // A unique ID like 'option-0', 'option-1'
  text: string; // The actual answer text, which can be a duplicate
}

// The state now maps a prompt text to the unique ID of the matched option
interface SavedMatchingState {
  userMatches: { [promptText: string]: string | null };
}

// Data transferred during drag-and-drop
interface DragData {
  optionId: string;
  sourcePrompt?: string;
}

const MatchingSection: React.FC<MatchingSectionProps> = ({
  section,
  unitId,
  lessonId,
}) => {
  const storageKey = `matchingState_${unitId}_${lessonId}_${section.id}`;

  // --- Data Derivation ---
  const { prompts, allOptions, solution } = useMemo(() => {
    const prompts = section.prompts.map((p) => Object.keys(p)[0]);
    // Create the master list of options, giving each a unique ID
    const allOptions: DraggableOption[] = section.prompts.map((p, index) => ({
      id: `option-${index}`,
      text: Object.values(p)[0],
    }));
    // The solution maps the prompt text to the correct answer TEXT
    const solution = Object.fromEntries(
      section.prompts.flatMap((p) => Object.entries(p))
    );
    return { prompts, allOptions, solution };
  }, [section.prompts]);

  const initialShuffledOptions = useMemo(() => {
    if (
      section.initialOrder &&
      section.initialOrder.length === allOptions.length
    ) {
      return section.initialOrder.map((index) => allOptions[index]);
    }
    return [...allOptions].sort(() => Math.random() - 0.5);
  }, [allOptions, section.initialOrder]);

  // --- State and Completion Logic ---
  const checkCompletion = (state: SavedMatchingState): boolean => {
    // Check if every prompt has a match
    if (prompts.some((prompt) => !state.userMatches[prompt])) {
      return false;
    }

    // Check if every match is correct by comparing the TEXT of the answer
    return prompts.every((prompt) => {
      const matchedOptionId = state.userMatches[prompt];
      if (!matchedOptionId) return false;

      const matchedOption = allOptions.find(
        (opt) => opt.id === matchedOptionId
      );
      if (!matchedOption) return false;

      return matchedOption.text === solution[prompt];
    });
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
    dragData: DragData
  ) => {
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
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

    try {
      const data = JSON.parse(
        e.dataTransfer.getData("application/json")
      ) as DragData;
      const { optionId, sourcePrompt } = data;

      if (!optionId) return;

      setSavedState((prevState) => {
        const newUserMatches = { ...prevState.userMatches };

        // If the item was dragged from another prompt, clear its original spot.
        if (sourcePrompt) {
          newUserMatches[sourcePrompt] = null;
        }

        // Place the new match. This will overwrite any existing item.
        newUserMatches[targetPromptText] = optionId;

        return { userMatches: newUserMatches };
      });
    } catch (error) {
      console.error("Failed to parse drag data:", error);
    }
  };

  // --- Rendering Logic ---
  const unmatchedOptions = useMemo(() => {
    const matchedOptionIds = new Set(Object.values(savedState.userMatches));
    return initialShuffledOptions.filter(
      (option) => !matchedOptionIds.has(option.id)
    );
  }, [savedState.userMatches, initialShuffledOptions]);

  return (
    <section id={section.id} className={sectionStyles.section}>
      <h2 className={sectionStyles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ContentRenderer content={section.content} />
      </div>

      <div className={styles.matchingContainer}>
        <div className={styles.promptsContainer}>
          {prompts.map((promptText) => {
            const matchedOptionId = savedState.userMatches[promptText];
            const matchedOption = matchedOptionId
              ? allOptions.find((opt) => opt.id === matchedOptionId)
              : null;

            // The isCorrect check now compares the TEXT of the answer
            const isCorrect =
              isSectionComplete && matchedOption
                ? solution[promptText] === matchedOption.text
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
                  {matchedOption ? (
                    <div
                      className={styles.matchedOption}
                      draggable
                      onDragStart={(e) =>
                        handleDragStart(e, {
                          optionId: matchedOption.id,
                          sourcePrompt: promptText,
                        })
                      }
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
              onDragStart={(e) => handleDragStart(e, { optionId: option.id })}
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
          {section.feedback ? section.feedback.correct : "Correct!"}
        </div>
      )}
    </section>
  );
};

export default MatchingSection;
