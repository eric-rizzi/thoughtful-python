// lesson_3.ts - Updated with sidebar and header completion tracking
import { pythonRunner } from '../pyodide';
import '../../css/main.css';
import '../../css/lessons.css';
import '../../css/challenges.css';
import '../../css/lesson_3.css';

interface PredictionRow {
  input1: number;
  input2: number;
  input3: number;
  expected: number;
  userAnswer: string;
  isCorrect: boolean | null;
}

class Lesson3Controller {
  private predictionInputs: NodeListOf<HTMLInputElement> = document.querySelectorAll('.prediction-input');
  private completionMessage: HTMLElement | null = document.getElementById('completion-message');
  private rows: PredictionRow[] = [];
  private isInitialized: boolean = false;
  private completedRows: number = 0;
  private totalRows: number = 0;
  private lessonId = 'lesson_3';

  constructor() {
    // Wait for DOM to be fully loaded before setting up event handlers
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // DOM already loaded, initialize immediately
      this.initialize();
    }
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    // Get all prediction input fields
    this.predictionInputs = document.querySelectorAll('.prediction-input');
    this.completionMessage = document.getElementById('completion-message');
    
    if (this.predictionInputs.length === 0) {
      console.warn('No prediction inputs found in Lesson 3');
      return;
    }
    
    this.totalRows = this.predictionInputs.length;
    console.log(`Found ${this.totalRows} prediction inputs in Lesson 3`);
    
    // Initialize rows data from table
    this.initializeRowsData();
    
    // Add event listeners to all prediction inputs
    this.predictionInputs.forEach(input => {
      input.addEventListener('input', () => {
        this.handlePredictionInput(input);
      });
      
      // Also trigger on blur to check answers when user clicks away
      input.addEventListener('blur', () => {
        this.handlePredictionInput(input);
      });
    });
    
    // Load saved answers if available
    this.loadSavedAnswers();
    
    // Update sidebar to show completion status
    this.updateSidebarCompletions();
    
    // Check if lesson is already complete
    this.checkAllSectionsCompleted();
    
    // Mark as initialized
    this.isInitialized = true;
    console.log('Lesson 3 controller initialized');
  }

  private initializeRowsData(): void {
    const tableRows = document.querySelectorAll('#prediction-table tbody tr');
    
    tableRows.forEach((row, index) => {
      const expectedValue = parseInt(row.getAttribute('data-expected') || '0');
      
      // Extract the input values from the table cells
      const cells = row.querySelectorAll('td');
      const input1 = parseInt(cells[0].textContent || '0');
      const input2 = parseInt(cells[1].textContent || '0');
      const input3 = parseInt(cells[2].textContent || '0');
      
      this.rows[index] = {
        input1,
        input2,
        input3,
        expected: expectedValue,
        userAnswer: '',
        isCorrect: null
      };
    });
  }

  private handlePredictionInput(input: HTMLInputElement): void {
    const rowIndex = parseInt(input.getAttribute('data-row') || '0');
    const userAnswer = input.value.trim();
    
    // Update the row data
    this.rows[rowIndex].userAnswer = userAnswer;
    
    // Check if answer is correct
    const expectedAnswer = this.rows[rowIndex].expected;
    const isCorrect = parseInt(userAnswer) === expectedAnswer;
    this.rows[rowIndex].isCorrect = userAnswer === '' ? null : isCorrect;
    
    // Update UI to reflect correctness
    this.updateRowStatus(rowIndex, isCorrect, userAnswer === '');
    
    // Update completion status
    this.updateCompletionStatus();
    
    // Save answers to localStorage
    this.saveAnswers();
  }

  private updateRowStatus(rowIndex: number, isCorrect: boolean, isEmpty: boolean): void {
    const tableRows = document.querySelectorAll('#prediction-table tbody tr');
    if (rowIndex >= tableRows.length) return;
    
    const row = tableRows[rowIndex];
    const statusIndicator = row.querySelector('.status-indicator');
    
    if (!statusIndicator) return;
    
    // Remove existing classes
    statusIndicator.classList.remove('correct', 'incorrect');
    row.classList.remove('correct-row', 'incorrect-row');
    
    if (isEmpty) {
      // If empty, don't show any indicator
      return;
    }
    
    if (isCorrect) {
      statusIndicator.classList.add('correct');
      row.classList.add('correct-row');
    } else {
      statusIndicator.classList.add('incorrect');
      row.classList.add('incorrect-row');
    }
  }

  private updateCompletionStatus(): void {
    // Count completed rows
    this.completedRows = this.rows.filter(row => row.isCorrect === true).length;
    
    // Check if all rows are completed
    const allCompleted = this.completedRows === this.totalRows;
    
    // Show completion message if all rows are correct
    if (this.completionMessage) {
      if (allCompleted) {
        this.completionMessage.classList.remove('hidden');
        this.markLessonAsCompleted();
      } else {
        this.completionMessage.classList.add('hidden');
      }
    }
    
    console.log(`Completion status: ${this.completedRows}/${this.totalRows}`);
  }

  private markLessonAsCompleted(): void {
    try {
      // Save to localStorage that this lesson is completed
      const storageKey = `python_${this.lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Add prediction section if not already completed
      if (!completedSections.includes('prediction')) {
        completedSections.push('prediction');
        localStorage.setItem(storageKey, JSON.stringify(completedSections));
        
        // Update sidebar to show completion
        this.updateSidebarCompletions();
        
        // Check if all sections are now completed and update navigation
        this.checkAllSectionsCompleted();
      }
    } catch (error) {
      console.error('Error saving lesson completion status:', error);
    }
  }

  private saveAnswers(): void {
    try {
      localStorage.setItem('lesson_3_answers', JSON.stringify(this.rows));
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  }

  private loadSavedAnswers(): void {
    try {
      const savedAnswers = localStorage.getItem('lesson_3_answers');
      if (!savedAnswers) return;
      
      const savedRows = JSON.parse(savedAnswers) as PredictionRow[];
      
      savedRows.forEach((savedRow, index) => {
        if (index >= this.rows.length) return;
        
        // Update our data model
        this.rows[index].userAnswer = savedRow.userAnswer;
        this.rows[index].isCorrect = savedRow.isCorrect;
        
        // Update the input field
        const input = this.predictionInputs[index];
        if (input) {
          input.value = savedRow.userAnswer;
        }
        
        // Update UI to reflect correctness
        this.updateRowStatus(
          index, 
          savedRow.isCorrect === true, 
          savedRow.userAnswer === ''
        );
      });
      
      // Update completion status
      this.updateCompletionStatus();
      
    } catch (error) {
      console.error('Error loading saved answers:', error);
    }
  }
  
  /**
   * Updates the sidebar to show which sections are completed
   */
  private updateSidebarCompletions(): void {
    try {
      // Get completed sections from localStorage
      const storageKey = `python_${this.lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // For lesson 3, there's only one section - prediction
      if (completedSections.includes('prediction')) {
        // Find the sidebar item for prediction
        const sidebarItems = document.querySelectorAll('.lesson-sidebar li');
        
        // Mark all items as completed since this is a single-section lesson
        sidebarItems.forEach(item => {
          if (!item.classList.contains('completed')) {
            item.classList.add('completed');
          }
        });
      }
    } catch (error) {
      console.error('Error updating sidebar completions:', error);
    }
  }

  /**
   * Checks if all sections in the lesson are completed and updates the navigation
   */
  private checkAllSectionsCompleted(): void {
    try {
      // Get completed sections from localStorage
      const storageKey = `python_${this.lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Required sections for this lesson - only one
      const requiredSections = ['prediction'];
      
      // Check if all required sections are completed
      const allCompleted = requiredSections.every(section => 
        completedSections.includes(section)
      );
      
      console.log(`${this.lessonId} completion check:`, {
        completedSections,
        requiredSections,
        allCompleted
      });
      
      if (allCompleted) {
        // Mark the lesson as completed in navigation
        const navItem = document.querySelector(`nav li a[href="${this.lessonId}.html"]`)?.parentElement;
        if (navItem) {
          navItem.classList.add('nav-completed');
          console.log(`Added nav-completed class to ${this.lessonId} nav item`);
        } else {
          console.warn(`Could not find ${this.lessonId} nav item`);
        }
      }
    } catch (error) {
      console.error('Error checking lesson completion:', error);
    }
  }
}

// Create and export the controller instance
const lesson3Controller = new Lesson3Controller();
export default lesson3Controller;