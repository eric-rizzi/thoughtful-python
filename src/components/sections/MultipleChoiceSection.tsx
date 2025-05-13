// src/components/sections/MultipleChoiceSection.tsx
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
  const initialState: QuizState = {
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

  const handleQuizOptionClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isSubmitted || isLocallyDisabled) return;
      const inputElement = event.currentTarget.querySelector(
        'input[type="radio"]'
      );
      if (inputElement) {
        (inputElement as HTMLInputElement).click();
      }
    },
    [isSubmitted, isLocallyDisabled]
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

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {section.content}
        </ReactMarkdown>
      </div>

      {isLocallyDisabled && (
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
                onChange={handleOptionChange}
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
          {isCorrect ? section.feedback.correct : section.feedback.incorrect}
        </div>
      )}
    </section>
  );
};

export default MultipleChoiceSection;
