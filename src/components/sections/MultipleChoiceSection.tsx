// src/components/sections/MultipleChoiceSection.tsx
import React, { useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MultipleChoiceSection as MultipleChoiceSectionData } from "../../types/data";
import styles from "./Section.module.css";
import { useSectionProgress } from "../../hooks/useSectionProgress";

interface MultipleChoiceSectionProps {
  section: MultipleChoiceSectionData;
  lessonId: string;
}

interface QuizState {
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

  // Handle click on the entire quiz option div
  const handleQuizOptionClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isSubmitted) return;
      // Find the radio input within the clicked div and programmatically click it
      const inputElement = event.currentTarget.querySelector(
        'input[type="radio"]'
      );
      if (inputElement) {
        (inputElement as HTMLInputElement).click(); // Cast to HTMLInputElement to access .click()
      }
    },
    [isSubmitted]
  );

  const handleSubmit = useCallback(() => {
    if (selectedOption === null || isSubmitted) return;

    const isAnswerCorrect = selectedOption === section.correctAnswer;

    setQuizState((prevState) => ({
      ...prevState,
      correct: isAnswerCorrect,
      submitted: true,
    }));
  }, [selectedOption, isSubmitted, section.correctAnswer, setQuizState]);

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
            aria-checked={selectedOption === index} // For accessibility, indicate checked state
            role="radio" // For accessibility, indicate it's a radio button
            tabIndex={isSubmitted ? -1 : 0} // Make div focusable unless submitted
          >
            <label
              htmlFor={`${section.id}-option-${index}`}
              className={styles.quizOptionLabel}
            >
              <input
                type="radio"
                name={section.id}
                value={index}
                id={`${section.id}-option-${index}`}
                checked={selectedOption === index}
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
            disabled={selectedOption === null}
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

export default MultipleChoiceSection;
