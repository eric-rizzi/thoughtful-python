// src/components/sections/MultipleChoiceSection.tsx
import React, { useCallback } from "react";
import type { MultipleChoiceSection as MultipleChoiceSectionData } from "../../types/data";
import styles from "./Section.module.css";
import { useSectionProgress } from "../../hooks/useSectionProgress";

interface MultipleChoiceSectionProps {
  section: MultipleChoiceSectionData;
  lessonId: string;
}

interface QuizState {
  // Renamed from SavedQuizState for clarity within component context
  selected: number | null;
  submitted: boolean;
  correct: boolean | null;
}

const MultipleChoiceSection: React.FC<MultipleChoiceSectionProps> = ({
  section,
  lessonId,
}) => {
  const storageKey = `quizState_${lessonId}_${section.id}`;
  const initialState: QuizState = {
    selected: null,
    submitted: false,
    correct: null,
  };

  // Define the completion check function for this section type
  const checkQuizCompletion = useCallback((state: QuizState): boolean => {
    return state.correct === true;
  }, []);

  const [quizState, setQuizState] = useSectionProgress<QuizState>(
    lessonId,
    section.id,
    storageKey,
    initialState,
    checkQuizCompletion
  );

  const {
    selected: selectedOption,
    submitted: isSubmitted,
    correct: isCorrect,
  } = quizState;

  const handleOptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isSubmitted) {
        const newSelectedOption = parseInt(event.target.value, 10);
        setQuizState((prevState) => ({
          ...prevState,
          selected: newSelectedOption,
        }));
      }
    },
    [isSubmitted, setQuizState]
  );

  const handleSubmit = useCallback(() => {
    if (selectedOption === null || isSubmitted) return;

    const isAnswerCorrect = selectedOption === section.correctAnswer;

    setQuizState((prevState) => ({
      ...prevState,
      correct: isAnswerCorrect,
      submitted: true,
    }));
    // The hook's useEffect will now pick up this state change,
    // run checkQuizCompletion, and call completeSection if quizState.correct becomes true.
  }, [selectedOption, isSubmitted, section.correctAnswer, setQuizState]);

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

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
              type="radio"
              name={section.id}
              value={index}
              id={`${section.id}-option-${index}`}
              checked={selectedOption === index}
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
            disabled={selectedOption === null}
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

export default MultipleChoiceSection;
