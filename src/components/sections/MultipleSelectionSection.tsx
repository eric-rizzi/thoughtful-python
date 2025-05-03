// src/components/sections/MultiSelectionSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { MultipleSelectionSection as MultipleSelectionSectionData } from '../../types/data';
import styles from './Section.module.css';
import { saveProgress, loadProgress } from '../../lib/localStorageUtils'; // Helper for localStorage

interface MultipleSelectionSectionProps {
  section: MultipleSelectionSectionData;
  lessonId: string; // Needed for localStorage key
  onSectionComplete: (sectionId: string) => void; // Callback for completion
}

interface SavedMultiSelectState {
    selected: number[]; // Store selected indexes as an array
    submitted: boolean;
    correct: boolean | null;
}

const MultipleSelectionSection: React.FC<MultipleSelectionSectionProps> = ({
    section,
    lessonId,
    onSectionComplete
}) => {
  const [selectedOptions, setSelectedOptions] = useState<Set<number>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const storageKey = `quizState_${lessonId}_${section.id}`;

  // Load saved state on mount
  useEffect(() => {
      const savedState = loadProgress<SavedMultiSelectState>(storageKey);
      if (savedState) {
          setSelectedOptions(new Set(savedState.selected || []));
          setIsSubmitted(savedState.submitted);
          setIsCorrect(savedState.correct);
      }
  }, [storageKey]);

  // Save state whenever it changes
  useEffect(() => {
      const stateToSave: SavedMultiSelectState = {
          selected: Array.from(selectedOptions), // Convert Set to Array for JSON
          submitted: isSubmitted,
          correct: isCorrect
      };
      saveProgress(storageKey, stateToSave);
  }, [selectedOptions, isSubmitted, isCorrect, storageKey]);

  const handleOptionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      if (isSubmitted) return; // Don't allow changes after submission

      const index = parseInt(event.target.value, 10);
      const isChecked = event.target.checked;

      setSelectedOptions(prev => {
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
  }, [isSubmitted]);

  const handleSubmit = useCallback(() => {
    if (selectedOptions.size === 0 || isSubmitted) return;

    // Check if the selected options exactly match the correct answers
    const correctAnswersSet = new Set(section.correctAnswers);
    const correct = selectedOptions.size === correctAnswersSet.size &&
                    [...selectedOptions].every(selectedIndex => correctAnswersSet.has(selectedIndex));

    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      console.log(`Placeholder: MS Section ${section.id} completed correctly.`);
      onSectionComplete(section.id); // Mark section as complete
    }
  }, [selectedOptions, isSubmitted, section.correctAnswers, section.id, onSectionComplete]);

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      <form className={`${styles.quizForm} ${isSubmitted ? styles.quizFormSubmitted : ''}`} onSubmit={(e) => e.preventDefault()}>
        {section.options.map((option, index) => (
          <div key={index} className={`${styles.quizOption} ${isSubmitted ? styles.optionDisabled : ''}`}>
            <input
              type="checkbox"
              name={section.id} // Can share name for checkboxes
              value={index}
              id={`${section.id}-option-${index}`}
              checked={selectedOptions.has(index)}
              onChange={handleOptionChange}
              disabled={isSubmitted} // Disable after submission
            />
            <label htmlFor={`${section.id}-option-${index}`}>
              {option}
            </label>
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
        <div className={isCorrect ? styles.correctFeedback : styles.incorrectFeedback}>
          {isCorrect ? section.feedback.correct : section.feedback.incorrect}
        </div>
      )}
    </section>
  );
};

export default MultipleSelectionSection;