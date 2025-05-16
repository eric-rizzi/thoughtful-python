import React, { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MultipleChoiceSection as MultipleChoiceSectionData } from "../../types/data";
import styles from "./Section.module.css";
import { useSectionProgress } from "../../hooks/useSectionProgress";
import {
  useProgressActions,
  useIsPenaltyActive,
  useRemainingPenaltyTime,
} from "../../stores/progressStore";

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
  const initialQuizSectionState: QuizState = {
    // Renamed for clarity
    selected: null,
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

  const checkQuizCompletion = useCallback((state: QuizState): boolean => {
    return state.correct === true;
  }, []);

  const [quizState, setQuizState] = useSectionProgress<QuizState>(
    lessonId,
    section.id,
    storageKey,
    initialQuizSectionState, // Use renamed initial state
    checkQuizCompletion
  );

  const {
    selected: selectedOption,
    submitted: isSubmitted,
    correct: isCorrect,
  } = quizState;

  // This handler is for the input's own onChange event.
  // It will be triggered by direct user interaction with the radio button
  // or by native label behavior.
  const handleOptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isSubmitted && !isLocallyDisabled) {
        const newSelectedOption = parseInt(event.target.value, 10);
        setQuizState((prevState) => ({
          ...prevState,
          selected: newSelectedOption,
        }));
      }
    },
    [isSubmitted, setQuizState, isLocallyDisabled]
  );

  // This handler is for clicks on the surrounding div.
  const handleQuizOptionClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isSubmitted || isLocallyDisabled) return;

      // If the click was directly on the radio input, its own onChange
      // (handleOptionChange) will handle the state update. So, do nothing here.
      if (
        event.target instanceof HTMLInputElement &&
        event.target.type === "radio"
      ) {
        return;
      }

      // If the click was on the surrounding div (e.g., label text or padding),
      // find the radio input and manually update the state.
      const inputElement = event.currentTarget.querySelector(
        'input[type="radio"]'
      );
      if (inputElement) {
        const radioInput = inputElement as HTMLInputElement;
        const newSelectedOption = parseInt(radioInput.value, 10);

        // Manually set the state, similar to what handleOptionChange does
        setQuizState((prevState) => ({
          ...prevState,
          selected: newSelectedOption,
        }));
      }
    },
    [isSubmitted, isLocallyDisabled, setQuizState]
  );

  const handleSubmit = useCallback(() => {
    if (selectedOption === null || isSubmitted || isLocallyDisabled) return;

    const isAnswerCorrect = selectedOption === section.correctAnswer;

    setQuizState((prevState) => ({
      ...prevState,
      correct: isAnswerCorrect,
      submitted: true,
    }));

    if (!isAnswerCorrect) {
      startPenalty();
    }
  }, [
    selectedOption,
    isSubmitted,
    section.correctAnswer,
    setQuizState,
    startPenalty,
    isLocallyDisabled,
  ]);

  const handleTryAgain = useCallback(() => {
    // Reset the quiz state for this section to allow another attempt
    setQuizState({
      selected: null,
      submitted: false,
      correct: null,
    });
  }, [setQuizState]);

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
            aria-checked={selectedOption === index}
            role="radio"
            tabIndex={isSubmitted || isLocallyDisabled ? -1 : 0}
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
            disabled={selectedOption === null || isLocallyDisabled}
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

export default MultipleChoiceSection;
