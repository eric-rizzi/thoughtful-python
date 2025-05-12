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

// This interface defines the shape of the state managed by the hook AND saved to localStorage
interface MultiSelectState {
  selected: number[]; // Store selected indexes as an array for JSON compatibility
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

  // Define the completion check function for this section type
  const checkMultiSelectCompletion = useCallback(
    (state: MultiSelectState): boolean => {
      return state.correct === true;
    },
    []
  );

  // Use the new hook
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

  // For efficient checking and binding to checkboxes, convert the persisted array to a Set
  const selectedOptionsSet = React.useMemo(
    () => new Set(selectedIndexArray),
    [selectedIndexArray]
  );

  const handleOptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isSubmitted) return; // Don't allow changes after submission

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
          selected: Array.from(currentSelectedSet), // Save back as an array
        };
      });
    },
    [isSubmitted, setMultiSelectState]
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
    // The hook's useEffect will now pick up this state change,
    // run checkMultiSelectCompletion, and call completeSection if multiSelectState.correct becomes true.
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
          >
            <input
              type="checkbox"
              name={`${section.id}-option-${index}`}
              value={index}
              id={`${section.id}-option-${index}`}
              checked={selectedOptionsSet.has(index)}
              onChange={handleOptionChange}
              disabled={isSubmitted}
            />
            <label htmlFor={`${section.id}-option-${index}`}>{option}</label>
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

      {/* Feedback Area */}
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
