// src/components/sections/MultipleSelectionSection.tsx
import React, { useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LessonId, MultipleSelectionSectionData } from "../../types/data";
import styles from "./Section.module.css";
import { useQuizLogic } from "../../hooks/useQuizLogic";

interface MultipleSelectionSectionProps {
  section: MultipleSelectionSectionData;
  lessonId: LessonId;
}

const MultipleSelectionSection: React.FC<MultipleSelectionSectionProps> = ({
  section,
  lessonId,
}) => {
  const {
    // selectedIndices, // Not directly used, use selectedOptionsSet instead
    isSubmitted,
    isCorrect,
    isLocallyDisabled,
    remainingPenaltyTime,
    // isSectionComplete, // You can use this if needed
    handleOptionChange,
    handleSubmit,
    handleTryAgain,
    canTryAgain,
    selectedOptionsSet, // Get this from the hook
  } = useQuizLogic({
    lessonId,
    section,
    isMultiSelect: true, // Explicitly true for multiple selection
  });

  // Click handler for the div/label to toggle the checkbox
  const handleQuizOptionClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isSubmitted || isLocallyDisabled) return;

      if (
        event.target instanceof HTMLInputElement &&
        event.target.type === "checkbox"
      ) {
        return; // Let the input's own onChange handle it
      }
      const inputElement = event.currentTarget.querySelector(
        'input[type="checkbox"]'
      );
      if (inputElement) {
        const checkboxInput = inputElement as HTMLInputElement;
        const optionIndex = parseInt(checkboxInput.value, 10);
        handleOptionChange(optionIndex); // Call the hook's handler
      }
    },
    [isSubmitted, isLocallyDisabled, handleOptionChange]
  );

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>

      {isLocallyDisabled && !isCorrect && (
        <div className={styles.penaltyMessageActive}>
          Oops! Time penalty active. Please wait {remainingPenaltyTime} seconds.
        </div>
      )}

      <form
        className={`${styles.quizForm} ${
          isSubmitted ? styles.quizFormSubmitted : ""
        } ${isLocallyDisabled ? styles.penaltyFormDisabled : ""}`}
        onSubmit={(e) => e.preventDefault()}
      >
        {section.options.map((option, index) => (
          <div
            key={index}
            className={`${styles.quizOption} ${
              isSubmitted || isLocallyDisabled ? styles.optionDisabled : ""
            }`}
            onClick={handleQuizOptionClick}
            aria-checked={selectedOptionsSet.has(index)}
            role="checkbox"
            tabIndex={isSubmitted || isLocallyDisabled ? -1 : 0}
          >
            <label
              htmlFor={`${section.id}-option-${index}`}
              className={styles.quizOptionLabel}
            >
              <input
                type="checkbox"
                name={`${section.id}-option-${index}`} // Name can be unique per option for multi-select
                value={index}
                id={`${section.id}-option-${index}`}
                checked={selectedOptionsSet.has(index)}
                onChange={() => handleOptionChange(index)} // Call hook's handler
                disabled={isSubmitted || isLocallyDisabled}
                tabIndex={-1}
              />
              {option}
            </label>
          </div>
        ))}

        {!isSubmitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selectedOptionsSet.size === 0 || isLocallyDisabled}
            className={styles.quizSubmitButton}
          >
            Submit Answer
          </button>
        )}
      </form>

      {isSubmitted && section.feedback && (
        <div
          className={
            isCorrect ? styles.correctFeedback : styles.incorrectFeedback
          }
        >
          {isCorrect ? section.feedback.correct : "Incorrect!"}
        </div>
      )}

      {canTryAgain && (
        <button
          type="button"
          onClick={handleTryAgain}
          className={styles.tryAgainButton}
        >
          Try Again
        </button>
      )}
    </section>
  );
};

export default MultipleSelectionSection;
