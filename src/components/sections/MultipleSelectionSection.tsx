// src/components/sections/MultipleSelectionSection.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { MultipleSelectionSection as MultipleSelectionSectionData } from "../../types/data";
import styles from "./Section.module.css";
import { saveProgress, loadProgress } from "../../lib/localStorageUtils";
import { useProgressActions } from "../../stores/progressStore"; // IMPORT ZUSTAND ACTIONS

interface MultipleSelectionSectionProps {
  section: MultipleSelectionSectionData;
  lessonId: string; // Needed for localStorage key and progressStore
  // onSectionComplete prop is removed
}

// This interface defines the shape of the state saved to localStorage for this specific quiz type
interface SavedMultiSelectState {
  selected: number[]; // Store selected indexes as an array for JSON compatibility
  submitted: boolean;
  correct: boolean | null;
}

const MultipleSelectionSection: React.FC<MultipleSelectionSectionProps> = ({
  section,
  lessonId,
}) => {
  // Component's active state for selected options uses a Set for efficiency
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(
    new Set()
  );
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const storageKey = `quizState_${lessonId}_${section.id}`;

  const { completeSection } = useProgressActions();

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadProgress<SavedMultiSelectState>(storageKey);
    if (savedState) {
      setSelectedOptions(new Set(savedState.selected || [])); // Initialize Set from saved array
      setIsSubmitted(savedState.submitted);
      setIsCorrect(savedState.correct);
    }
  }, [storageKey]);

  // Save state whenever it changes
  useEffect(() => {
    const stateToSave: SavedMultiSelectState = {
      selected: Array.from(selectedOptions), // Convert Set to Array for saving
      submitted: isSubmitted,
      correct: isCorrect,
    };
    saveProgress(storageKey, stateToSave);
  }, [selectedOptions, isSubmitted, isCorrect, storageKey]);

  const handleOptionChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isSubmitted) return; // Don't allow changes after submission

      const index = parseInt(event.target.value, 10);
      const isChecked = event.target.checked;

      setSelectedOptions((prev) => {
        const newSet = new Set(prev);
        if (isChecked) {
          newSet.add(index);
        } else {
          newSet.delete(index);
        }
        return newSet;
      });
      // Reset correctness if changing answer after incorrect submission (optional)
      // setIsCorrect(null);
    },
    [isSubmitted]
  );

  const handleSubmit = useCallback(() => {
    if (selectedOptions.size === 0 || isSubmitted) return;

    // Check if the selected options exactly match the correct answers
    const correctAnswersSet = new Set(section.correctAnswers);
    const correct =
      selectedOptions.size === correctAnswersSet.size &&
      [...selectedOptions].every((selectedIndex) =>
        correctAnswersSet.has(selectedIndex)
      );

    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      console.log(
        `MultipleSelectionSection: ${section.id} answered correctly. Marking complete in progress store.`
      );
      completeSection(lessonId, section.id);
    }
  }, [
    selectedOptions,
    isSubmitted,
    section.correctAnswers,
    section.id,
    lessonId,
    completeSection,
    setIsCorrect,
    setIsSubmitted,
  ]); // Added setIsCorrect, setIsSubmitted

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
              type="checkbox"
              name={`${section.id}-option-${index}`} // Ensure unique name for accessibility if needed, though not strictly for functionality here
              value={index}
              id={`${section.id}-option-${index}`}
              checked={selectedOptions.has(index)}
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
            disabled={selectedOptions.size === 0}
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
