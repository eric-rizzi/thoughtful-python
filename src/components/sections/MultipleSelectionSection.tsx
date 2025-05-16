import React, { useCallback, useMemo, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MultipleSelectionSection as MultipleSelectionSectionData } from "../../types/data";
import styles from "./Section.module.css";
import { useSectionProgress } from "../../hooks/useSectionProgress";
import {
  useProgressActions,
  useIsPenaltyActive,
  useRemainingPenaltyTime,
} from "../../stores/progressStore";

interface MultipleSelectionSectionProps {
  section: MultipleSelectionSectionData;
  lessonId: string;
}

interface MultiSelectState {
  selected: number[];
  submitted: boolean;
  correct: boolean | null;
}

const MultipleSelectionSection: React.FC<MultipleSelectionSectionProps> = ({
  section,
  lessonId,
}) => {
  const storageKey = `quizState_${lessonId}_${section.id}`;
  const initialMultiSelectState: MultiSelectState = {
    // Renamed for clarity
    selected: [],
    submitted: false,
    correct: null,
  };

  const { startPenalty } = useProgressActions();
  const isPenaltyActiveGlobally = useIsPenaltyActive();
  const remainingPenaltyTime = useRemainingPenaltyTime();

  const [isLocallyDisabled, setIsLocallyDisabled] = useState(false);

  useEffect(() => {
    setIsLocallyDisabled(isPenaltyActiveGlobally);
  }, [isPenaltyActiveGlobally]);

  const checkMultiSelectCompletion = useCallback(
    (state: MultiSelectState): boolean => {
      return state.correct === true;
    },
    []
  );

  const [multiSelectState, setMultiSelectState] =
    useSectionProgress<MultiSelectState>(
      lessonId,
      section.id,
      storageKey,
      initialMultiSelectState, // Use renamed initial state
      checkMultiSelectCompletion
    );

  const {
    selected: selectedIndexArray,
    submitted: isSubmitted,
    correct: isCorrect,
  } = multiSelectState;

  const selectedOptionsSet = React.useMemo(
    () => new Set(selectedIndexArray),
    [selectedIndexArray]
  );

  // This handler is for the input's own onChange event.
  const handleOptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isSubmitted || isLocallyDisabled) return;

      const index = parseInt(event.target.value, 10);
      const isChecked = event.target.checked;

      setMultiSelectState((prevState) => {
        const currentSelectedSet = new Set(prevState.selected);
        if (isChecked) {
          currentSelectedSet.add(index);
        } else {
          currentSelectedSet.delete(index);
        }
        return {
          ...prevState,
          selected: Array.from(currentSelectedSet),
        };
      });
    },
    [isSubmitted, setMultiSelectState, isLocallyDisabled]
  );

  // This handler is for clicks on the surrounding div.
  const handleQuizOptionClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isSubmitted || isLocallyDisabled) return;

      // If the click was directly on the checkbox input, its own onChange
      // (handleOptionChange) will handle the state update. So, do nothing here.
      if (
        event.target instanceof HTMLInputElement &&
        event.target.type === "checkbox"
      ) {
        return;
      }

      // If the click was on the surrounding div (e.g., label text or padding),
      // find the checkbox input and manually toggle its state.
      const inputElement = event.currentTarget.querySelector(
        'input[type="checkbox"]'
      );
      if (inputElement) {
        const checkboxInput = inputElement as HTMLInputElement;
        const optionIndex = parseInt(checkboxInput.value, 10);

        // Manually update the state by toggling the selection for this optionIndex
        setMultiSelectState((prevState) => {
          const currentSelectedSet = new Set(prevState.selected);
          if (currentSelectedSet.has(optionIndex)) {
            currentSelectedSet.delete(optionIndex); // Unselect if already selected
          } else {
            currentSelectedSet.add(optionIndex); // Select if not selected
          }
          return {
            ...prevState,
            selected: Array.from(currentSelectedSet),
          };
        });
      }
    },
    [isSubmitted, isLocallyDisabled, setMultiSelectState]
  );

  const handleSubmit = useCallback(() => {
    if (selectedOptionsSet.size === 0 || isSubmitted || isLocallyDisabled)
      return;

    const correctAnswersSet = new Set(section.correctAnswers);
    const isAnswerCorrect =
      selectedOptionsSet.size === correctAnswersSet.size &&
      [...selectedOptionsSet].every((selectedIndex) =>
        correctAnswersSet.has(selectedIndex)
      );

    setMultiSelectState((prevState) => ({
      ...prevState,
      correct: isAnswerCorrect,
      submitted: true,
    }));

    if (!isAnswerCorrect) {
      startPenalty();
    }
  }, [
    selectedOptionsSet,
    isSubmitted,
    section.correctAnswers,
    setMultiSelectState,
    startPenalty,
    isLocallyDisabled,
  ]);

  const handleTryAgain = useCallback(() => {
    // Reset the multi-select state for this section
    setMultiSelectState({
      selected: [],
      submitted: false,
      correct: null,
    });
  }, [setMultiSelectState]);

  const showTryAgainButton = isSubmitted && !isCorrect && !isLocallyDisabled;

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>

      {isLocallyDisabled &&
        !isCorrect && ( // Show penalty message only if not already correct
          <div className={styles.penaltyMessageActive}>
            Oops! Time penalty active. Please wait {remainingPenaltyTime}{" "}
            seconds.
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
            onClick={handleQuizOptionClick} // Click handler on the div
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
                name={`${section.id}-option-${index}`}
                value={index}
                id={`${section.id}-option-${index}`}
                checked={selectedOptionsSet.has(index)}
                onChange={handleOptionChange} // onChange on the input itself
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
          {isCorrect
            ? section.feedback.correct
            : section.feedback.incorrect
            ? section.feedback.incorrect
            : "Incorrect!"}
        </div>
      )}

      {showTryAgainButton && (
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
