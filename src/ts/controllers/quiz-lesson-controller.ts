/**
 * Controller for quiz-style lessons
 */
import { DynamicLessonController } from './dynamic-lesson-controller';
import { markSectionCompleted } from '../utils/progress-utils';
import { LessonSection } from '../utils/lesson-loader';

export interface MultipleChoiceSection extends LessonSection {
  kind: 'MultipleChoice';
  options: string[];
  correctAnswer: number;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export interface MultiSelectionSection extends LessonSection {
  kind: 'MultiSelection';
  options: string[];
  correctAnswers: number[];
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export abstract class QuizLessonController extends DynamicLessonController {
  protected userAnswers: Map<string, any> = new Map();
  
  /**
   * Initialize the quiz controller
   */
  protected async initializeLesson(): Promise<void> {
    // Load saved answers if they exist
    this.loadSavedAnswers();
  }
  
  /**
   * Set up event handlers after rendering
   */
  protected afterRender(): void {
    // Update the UI with saved answers
    this.updateUI();
  }
  
  /**
   * Render a multiple choice question section
   */
  protected renderMultipleChoiceSection(section: MultipleChoiceSection, container: HTMLElement): void {
    // First render as a standard section to get the base structure
    this.renderStandardSection(section, container);
    
    // Find the section container we just added
    const sectionContainer = document.getElementById(section.id);
    if (!sectionContainer) return;
    
    // Create the form element
    const form = document.createElement('form');
    form.className = 'quiz-form multiple-choice';
    form.setAttribute('data-section-id', section.id);
    
    // Create options
    section.options.forEach((option, index) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'quiz-option';
      
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `question-${section.id}`;
      input.id = `${section.id}-option-${index}`;
      input.value = index.toString();
      input.addEventListener('change', () => this.handleMultipleChoiceAnswer(section.id, index));
      
      const label = document.createElement('label');
      label.htmlFor = `${section.id}-option-${index}`;
      label.textContent = option;
      
      optionDiv.appendChild(input);
      optionDiv.appendChild(label);
      form.appendChild(optionDiv);
    });
    
    // Create feedback element
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'quiz-feedback hidden';
    feedbackDiv.id = `${section.id}-feedback`;
    
    // Add submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.className = 'quiz-submit';
    submitButton.textContent = 'Submit Answer';
    submitButton.addEventListener('click', () => this.handleMultipleChoiceSubmit(section.id, section.correctAnswer));
    
    // Add everything to the section
    form.appendChild(submitButton);
    sectionContainer.appendChild(form);
    sectionContainer.appendChild(feedbackDiv);
  }
  
  /**
   * Render a multi-selection question section
   */
  protected renderMultiSelectionSection(section: MultiSelectionSection, container: HTMLElement): void {
    // First render as a standard section to get the base structure
    this.renderStandardSection(section, container);
    
    // Find the section container we just added
    const sectionContainer = document.getElementById(section.id);
    if (!sectionContainer) return;
    
    // Create the form element
    const form = document.createElement('form');
    form.className = 'quiz-form multi-selection';
    form.setAttribute('data-section-id', section.id);
    
    // Create options
    section.options.forEach((option, index) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'quiz-option';
      
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = `question-${section.id}`;
      input.id = `${section.id}-option-${index}`;
      input.value = index.toString();
      input.addEventListener('change', () => this.handleMultiSelectionAnswer(section.id));
      
      const label = document.createElement('label');
      label.htmlFor = `${section.id}-option-${index}`;
      label.textContent = option;
      
      optionDiv.appendChild(input);
      optionDiv.appendChild(label);
      form.appendChild(optionDiv);
    });
    
    // Create feedback element
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'quiz-feedback hidden';
    feedbackDiv.id = `${section.id}-feedback`;
    
    // Add submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.className = 'quiz-submit';
    submitButton.textContent = 'Submit Answer';
    submitButton.addEventListener('click', () => this.handleMultiSelectionSubmit(section.id, section.correctAnswers));
    
    // Add everything to the section
    form.appendChild(submitButton);
    sectionContainer.appendChild(form);
    sectionContainer.appendChild(feedbackDiv);
  }
  
  /**
   * Handle multiple choice answer selection
   */
  private handleMultipleChoiceAnswer(sectionId: string, selectedIndex: number): void {
    // Save the selected answer
    this.userAnswers.set(sectionId, selectedIndex);
    this.saveAnswers();
  }
  
  /**
   * Handle multiple choice answer submission
   */
  private handleMultipleChoiceSubmit(sectionId: string, correctAnswer: number): void {
    const selectedAnswer = this.userAnswers.get(sectionId);
    if (selectedAnswer === undefined) {
      // No answer selected
      alert('Please select an answer before submitting.');
      return;
    }
    
    // Find the section to get the feedback
    const section = this.findSectionById(sectionId) as MultipleChoiceSection;
    if (!section) return;
    
    // Check if answer is correct
    const isCorrect = selectedAnswer === correctAnswer;
    
    // Show feedback
    this.showFeedback(sectionId, isCorrect, section.feedback);
    
    // If correct, mark as completed
    if (isCorrect) {
      markSectionCompleted(sectionId, this.lessonId);
      this.updateSidebarCompletions();
      this.checkAllSectionsCompleted();
    }
  }
  
  /**
   * Handle multi-selection answer changes
   */
  private handleMultiSelectionAnswer(sectionId: string): void {
    // Get all selected checkboxes
    const checkboxes = document.querySelectorAll(`input[name="question-${sectionId}"]:checked`);
    const selectedIndexes = Array.from(checkboxes).map(cb => parseInt((cb as HTMLInputElement).value));
    
    // Save the selected answers
    this.userAnswers.set(sectionId, selectedIndexes);
    this.saveAnswers();
  }
  
  /**
   * Handle multi-selection answer submission
   */
  private handleMultiSelectionSubmit(sectionId: string, correctAnswers: number[]): void {
    const selectedAnswers = this.userAnswers.get(sectionId) as number[] | undefined;
    if (!selectedAnswers || selectedAnswers.length === 0) {
      // No answers selected
      alert('Please select at least one answer before submitting.');
      return;
    }
    
    // Find the section to get the feedback
    const section = this.findSectionById(sectionId) as MultiSelectionSection;
    if (!section) return;
    
    // Check if answers are correct (exactly the same answers, regardless of order)
    const isCorrect = 
      selectedAnswers.length === correctAnswers.length && 
      selectedAnswers.every(a => correctAnswers.includes(a)) &&
      correctAnswers.every(a => selectedAnswers.includes(a));
    
    // Show feedback
    this.showFeedback(sectionId, isCorrect, section.feedback);
    
    // If correct, mark as completed
    if (isCorrect) {
      markSectionCompleted(sectionId, this.lessonId);
      this.updateSidebarCompletions();
      this.checkAllSectionsCompleted();
    }
  }
  
  /**
   * Show feedback for a question
   */
  private showFeedback(sectionId: string, isCorrect: boolean, feedback: { correct: string, incorrect: string }): void {
    const feedbackElement = document.getElementById(`${sectionId}-feedback`);
    if (!feedbackElement) return;
    
    // Set feedback text and styling
    feedbackElement.textContent = isCorrect ? feedback.correct : feedback.incorrect;
    feedbackElement.classList.remove('hidden', 'correct-feedback', 'incorrect-feedback');
    feedbackElement.classList.add(isCorrect ? 'correct-feedback' : 'incorrect-feedback');
    
    // Disable form if correct
    if (isCorrect) {
      const form = document.querySelector(`form[data-section-id="${sectionId}"]`);
      if (form) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
          input.disabled = true;
        });
        
        const submitButton = form.querySelector('.quiz-submit');
        if (submitButton) {
          submitButton.setAttribute('disabled', 'true');
          (submitButton as HTMLButtonElement).textContent = 'Correct!';
        }
      }
    }
  }
  
  /**
   * Find a section by ID
   */
  private findSectionById(sectionId: string): LessonSection | undefined {
    return this.lesson?.sections.find(section => section.id === sectionId);
  }
  
  /**
   * Save answers to localStorage
   */
  private saveAnswers(): void {
    try {
      // Convert Map to Object for storage
      const answersObj: { [key: string]: any } = {};
      this.userAnswers.forEach((value, key) => {
        answersObj[key] = value;
      });
      
      localStorage.setItem(`${this.lessonId}_quiz_answers`, JSON.stringify(answersObj));
    } catch (error) {
      console.error('Error saving quiz answers:', error);
    }
  }
  
  /**
   * Load saved answers from localStorage
   */
  private loadSavedAnswers(): void {
    try {
      const savedAnswers = localStorage.getItem(`${this.lessonId}_quiz_answers`);
      if (!savedAnswers) return;
      
      const answersObj = JSON.parse(savedAnswers);
      
      // Convert Object back to Map
      this.userAnswers = new Map(Object.entries(answersObj));
    } catch (error) {
      console.error('Error loading saved quiz answers:', error);
    }
  }
  
  /**
   * Update UI with saved answers
   */
  private updateUI(): void {
    // Apply saved answers to form controls
    this.userAnswers.forEach((value, sectionId) => {
      const section = this.findSectionById(sectionId);
      if (!section) return;
      
      if (section.kind === 'MultipleChoice') {
        // Set radio button
        const radio = document.getElementById(`${sectionId}-option-${value}`) as HTMLInputElement;
        if (radio) {
          radio.checked = true;
          
          // If this section is marked as completed, trigger the submission to show feedback
          const storageKey = `python_${this.lessonId}_completed`;
          const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
          if (completedSections.includes(sectionId)) {
            this.handleMultipleChoiceSubmit(sectionId, (section as MultipleChoiceSection).correctAnswer);
          }
        }
      } else if (section.kind === 'MultiSelection') {
        // Set checkboxes
        (value as number[]).forEach(optionIndex => {
          const checkbox = document.getElementById(`${sectionId}-option-${optionIndex}`) as HTMLInputElement;
          if (checkbox) {
            checkbox.checked = true;
          }
        });
        
        // If this section is marked as completed, trigger the submission to show feedback
        const storageKey = `python_${this.lessonId}_completed`;
        const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (completedSections.includes(sectionId)) {
          this.handleMultiSelectionSubmit(sectionId, (section as MultiSelectionSection).correctAnswers);
        }
      }
    });
  }
}