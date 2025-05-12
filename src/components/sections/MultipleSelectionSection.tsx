// src/components/sections/MultipleSelectionSection.tsx
import React, { useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MultipleSelectionSection as MultipleSelectionSectionData } from "../../types/data";
import styles from "./Section.module.css";
import { useSectionProgress } from "../../hooks/useSectionProgress";

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
  const initialState: MultiSelectState = {
    selected: [],
    submitted: false,
    correct: null,
  };

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
      initialState,
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

  const handleOptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isSubmitted) return;

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
    [isSubmitted, setMultiSelectState]
  );

  // Handle click on the entire quiz option div
  const handleQuizOptionClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isSubmitted) return;
      // Find the checkbox input within the clicked div and programmatically click it
      const inputElement = event.currentTarget.querySelector(
        'input[type="checkbox"]'
      );
      if (inputElement) {
        (inputElement as HTMLInputElement).click(); // Cast to HTMLInputElement to access .click()
      }
    },
    [isSubmitted]
  );

  const handleSubmit = useCallback(() => {
    if (selectedOptionsSet.size === 0 || isSubmitted) return;

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
  }, [
    selectedOptionsSet,
    isSubmitted,
    section.correctAnswers,
    setMultiSelectState,
  ]);

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>

      <form
        className={`${styles.quizForm} ${
          isSubmitted ? styles.quizFormSubmitted : ""
        }`}
        onSubmit={(e) => e.preventDefault()}
      >
        {section.options.map((option, index) => (
          <div
            key={index}
            className={`${styles.quizOption} ${
              isSubmitted ? styles.optionDisabled : ""
            }`}
            onClick={handleQuizOptionClick} // Add onClick to the div
            aria-checked={selectedOptionsSet.has(index)} // For accessibility, indicate checked state
            role="checkbox" // For accessibility, indicate it's a checkbox
            tabIndex={isSubmitted ? -1 : 0} // Make div focusable unless submitted
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
                onChange={handleOptionChange}
                disabled={isSubmitted}
                // Ensure the input itself is not tab-focusable to prevent double tabbing
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
            disabled={selectedOptionsSet.size === 0}
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
          {isCorrect ? section.feedback.correct : section.feedback.incorrect}
        </div>
      )}
    </section>
  );
};

export default MultipleSelectionSection;
