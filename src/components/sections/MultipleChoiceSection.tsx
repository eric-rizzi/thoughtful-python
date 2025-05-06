// src/components/sections/MultipleChoiceSection.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { MultipleChoiceSection as MultipleChoiceSectionData } from "../../types/data";
import styles from "./Section.module.css";
import { saveProgress, loadProgress } from "../../lib/localStorageUtils"; // Helper for localStorage
import { useProgressActions } from "../../stores/progressStore";

interface MultipleChoiceSectionProps {
  section: MultipleChoiceSectionData;
  lessonId: string;
}

interface SavedQuizState {
  selected: number | null;
  submitted: boolean;
  correct: boolean | null;
}

const MultipleChoiceSection: React.FC<MultipleChoiceSectionProps> = ({
  section,
  lessonId,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const storageKey = `quizState_${lessonId}_${section.id}`;

  // Get actions from the progress store
  const { completeSection } = useProgressActions();

  // Load saved state on mount (persists user's choice within the quiz)
  useEffect(() => {
    const savedState = loadProgress<SavedQuizState>(storageKey);
    if (savedState) {
      setSelectedOption(savedState.selected);
      setIsSubmitted(savedState.submitted);
      setIsCorrect(savedState.correct);
      // If already submitted and correct from a previous session, ensure it's marked in global store.
      // This is important if localStorage is cleared but store isn't, or vice versa.
      // However, the primary responsibility for marking complete is on initial correct submission.
      // If the section was already marked complete in the global store, this component doesn't need to do it again.
    }
  }, [storageKey]);

  // Save state whenever it changes (persists user's choice within the quiz)
  useEffect(() => {
    const stateToSave: SavedQuizState = {
      selected: selectedOption,
      submitted: isSubmitted,
      correct: isCorrect,
    };
    saveProgress(storageKey, stateToSave);
  }, [selectedOption, isSubmitted, isCorrect, storageKey]);

  const handleOptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isSubmitted) {
        setSelectedOption(parseInt(event.target.value, 10));
      }
    },
    [isSubmitted]
  );

  const handleSubmit = useCallback(() => {
    if (selectedOption === null || isSubmitted) return;

    const correct = selectedOption === section.correctAnswer;
    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      console.log(
        `MultipleChoiceSection: ${section.id} answered correctly. Marking complete in progress store.`
      );
      // Use the action from progressStore to mark the section as complete
      completeSection(lessonId, section.id);
    }
  }, [
    selectedOption,
    isSubmitted,
    section.correctAnswer,
    section.id,
    lessonId,
    completeSection,
  ]);

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
