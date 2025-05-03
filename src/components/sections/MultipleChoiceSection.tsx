// src/components/sections/MultipleChoiceSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import type { MultipleChoiceSection as MultipleChoiceSectionData } from '../../types/data';
import styles from './Section.module.css';
import { saveProgress, loadProgress } from '../../lib/localStorageUtils'; // Helper for localStorage

interface MultipleChoiceSectionProps {
  section: MultipleChoiceSectionData;
  lessonId: string; // Needed for localStorage key
  onSectionComplete: (sectionId: string) => void; // Callback for completion
}

interface SavedQuizState {
    selected: number | null;
    submitted: boolean;
    correct: boolean | null;
}

const MultipleChoiceSection: React.FC<MultipleChoiceSectionProps> = ({
    section,
    lessonId,
    onSectionComplete
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const storageKey = `quizState_${lessonId}_${section.id}`;

  // Load saved state on mount
  useEffect(() => {
      const savedState = loadProgress<SavedQuizState>(storageKey);
      if (savedState) {
          setSelectedOption(savedState.selected);
          setIsSubmitted(savedState.submitted);
          setIsCorrect(savedState.correct);
      }
  }, [storageKey]);

  // Save state whenever it changes
  useEffect(() => {
      const stateToSave: SavedQuizState = {
          selected: selectedOption,
          submitted: isSubmitted,
          correct: isCorrect
      };
      saveProgress(storageKey, stateToSave);
  }, [selectedOption, isSubmitted, isCorrect, storageKey]);


  const handleOptionChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      // Allow changing answer only if not submitted
      if (!isSubmitted) {
          setSelectedOption(parseInt(event.target.value, 10));
          // Reset correctness if changing answer after incorrect submission (optional)
          // setIsCorrect(null);
      }
  }, [isSubmitted]);

  const handleSubmit = useCallback(() => {
    if (selectedOption === null || isSubmitted) return;

    const correct = selectedOption === section.correctAnswer;
    setIsCorrect(correct);
    setIsSubmitted(true);

    if (correct) {
      console.log(`Placeholder: MC Section ${section.id} completed correctly.`);
      onSectionComplete(section.id); // Mark section as complete
    }
  }, [selectedOption, isSubmitted, section.correctAnswer, section.id, onSectionComplete]);

  return (
    <section id={section.id} className={styles.section}>
      <h2 className={styles.title}>{section.title}</h2>
      <div className={styles.content}>{section.content}</div>

      <form className={`${styles.quizForm} ${isSubmitted ? styles.quizFormSubmitted : ''}`} onSubmit={(e) => e.preventDefault()}>
        {section.options.map((option, index) => (
          <div key={index} className={`${styles.quizOption} ${isSubmitted ? styles.optionDisabled : ''}`}>
            <input
              type="radio"
              name={section.id} // Group radios by section id
              value={index}
              id={`${section.id}-option-${index}`}
              checked={selectedOption === index}
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
                disabled={selectedOption === null}
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

export default MultipleChoiceSection;