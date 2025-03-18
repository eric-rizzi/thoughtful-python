/**
 * Base class for prediction-style lessons
 */
import { DynamicLessonController } from './dynamic-lesson-controller';
import { markSectionCompleted } from './progress-utils';
import { LessonSection } from './lesson-loader';

export interface PredictionTableRow {
  inputs: number[];
  expected: number;
  description: string;
  userAnswer?: string;
  isCorrect?: boolean | null;
}

export interface PredictionTable {
  columns: string[];
  rows: PredictionTableRow[];
}

export interface FunctionDisplay {
  title: string;
  code: string;
}

export interface PredictionSection extends LessonSection {
  functionDisplay?: FunctionDisplay;
  predictionTable?: PredictionTable;
  completionMessage?: string;
}

export abstract class PredictionLessonController extends DynamicLessonController {
  protected predictionRows: PredictionTableRow[] = [];
  protected completedRows: number = 0;
  protected totalRows: number = 0;
  protected predictionSectionId: string | null = null;
  
  /**
   * Initialize the prediction data
   */
  protected async initializeLesson(): Promise<void> {
    // Find the prediction section
    const predictionSection = this.lesson?.sections.find(section => 
      section.id === 'prediction' || (section as PredictionSection).predictionTable !== undefined
    ) as PredictionSection | undefined;
    
    if (predictionSection) {
      this.predictionSectionId = predictionSection.id;
      
      // Initialize the prediction data
      if (predictionSection.predictionTable) {
        this.predictionRows = [...predictionSection.predictionTable.rows];
        this.totalRows = this.predictionRows.length;
      }
    }
  }
  
  /**
   * Handle after-render setup for prediction tables
   */
  protected afterRender(): void {
    // Add event listeners to prediction inputs
    const predictionInputs = document.querySelectorAll('.prediction-input');
    predictionInputs.forEach(input => {
      input.addEventListener('input', () => {
        this.handlePredictionInput(input as HTMLInputElement);
      });
      
      // Also trigger on blur to check answers when user clicks away
      input.addEventListener('blur', () => {
        this.handlePredictionInput(input as HTMLInputElement);
      });
    });
    
    // Load saved answers
    this.loadSavedAnswers();
  }
  
  /**
   * Override renderSection to handle prediction sections
   */
  protected renderSection(section: LessonSection, container: HTMLElement): void {
    // Check if this is a prediction section
    if (section.id === this.predictionSectionId && (section as PredictionSection).predictionTable) {
      this.renderPredictionSection(section as PredictionSection, container);
    } else {
      // Use the parent class's standard section renderer
      super.renderSection(section, container);
    }
  }
  
  /**
   * Render a prediction section with function display and prediction table
   */
  protected renderPredictionSection(section: PredictionSection, container: HTMLElement): void {
    // First render as a standard section to get the base structure
    super.renderSection(section, container);
    
    // Find the section container we just added
    const sectionContainer = document.getElementById(section.id);
    if (!sectionContainer || !section.predictionTable || !section.functionDisplay) return;
    
    // Use template to create prediction content
    const template = document.getElementById('prediction-template') as HTMLTemplateElement;
    if (!template) return;
    
    const predictionElement = template.content.cloneNode(true) as DocumentFragment;
    const predictionContainer = predictionElement.querySelector('.prediction-section') as HTMLElement;
    if (!predictionContainer) return;
    
    // Set function display
    const functionTitle = predictionContainer.querySelector('.function-title') as HTMLElement;
    const functionCode = predictionContainer.querySelector('.code-display code') as HTMLElement;
    
    if (functionTitle && functionCode && section.functionDisplay) {
      functionTitle.textContent = section.functionDisplay.title;
      functionCode.textContent = section.functionDisplay.code;
    }
    
    // Set up prediction table
    const tableHead = predictionContainer.querySelector('thead tr') as HTMLElement;
    const tableBody = predictionContainer.querySelector('tbody') as HTMLElement;
    
    if (tableHead && tableBody && section.predictionTable) {
      // Create table headers
      section.predictionTable.columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        tableHead.appendChild(th);
      });
      
      // Create table rows
      section.predictionTable.rows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-expected', row.expected.toString());
        
        // Add input columns
        row.inputs.forEach(input => {
          const td = document.createElement('td');
          td.textContent = input.toString();
          tr.appendChild(td);
        });
        
        // Add prediction input column
        const inputTd = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'prediction-input';
        input.setAttribute('data-row', index.toString());
        inputTd.appendChild(input);
        tr.appendChild(inputTd);
        
        // Add status column
        const statusTd = document.createElement('td');
        statusTd.className = 'status-cell';
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-indicator';
        statusTd.appendChild(statusSpan);
        tr.appendChild(statusTd);
        
        tableBody.appendChild(tr);
      });
    }
    
    // Set completion message
    const completionMessage = predictionContainer.querySelector('#completion-message') as HTMLElement;
    if (completionMessage && section.completionMessage) {
      completionMessage.textContent = section.completionMessage;
    }
    
    // Add to section container
    sectionContainer.appendChild(predictionContainer);
  }
  
  /**
   * Handle user input in prediction table
   */
  protected handlePredictionInput(input: HTMLInputElement): void {
    const rowIndex = parseInt(input.getAttribute('data-row') || '0');
    const userAnswer = input.value.trim();
    
    // Update the row data
    if (rowIndex >= 0 && rowIndex < this.predictionRows.length) {
      this.predictionRows[rowIndex].userAnswer = userAnswer;
      
      // Check if answer is correct
      const expectedAnswer = this.predictionRows[rowIndex].expected;
      const isCorrect = parseInt(userAnswer) === expectedAnswer;
      this.predictionRows[rowIndex].isCorrect = userAnswer === '' ? null : isCorrect;
      
      // Update UI to reflect correctness
      this.updateRowStatus(rowIndex, isCorrect, userAnswer === '');
      
      // Update completion status
      this.updateCompletionStatus();
      
      // Save answers to localStorage
      this.saveAnswers();
    }
  }
  
  /**
   * Update row status in the UI
   */
  protected updateRowStatus(rowIndex: number, isCorrect: boolean, isEmpty: boolean): void {
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
  
  /**
   * Check if all predictions are correct and update completion status
   */
  protected updateCompletionStatus(): void {
    // Count completed rows
    this.completedRows = this.predictionRows.filter(row => row.isCorrect === true).length;
    
    // Check if all rows are completed
    const allCompleted = this.completedRows === this.totalRows;
    
    // Show completion message if all rows are correct
    const completionMessage = document.getElementById('completion-message');
    if (completionMessage) {
      if (allCompleted) {
        completionMessage.classList.remove('hidden');
        this.markSectionAsCompleted();
      } else {
        completionMessage.classList.add('hidden');
      }
    }
    
    console.log(`Completion status: ${this.completedRows}/${this.totalRows}`);
  }
  
  /**
   * Mark the prediction section as completed
   */
  protected markSectionAsCompleted(): void {
    if (!this.predictionSectionId) return;
    
    try {
      // Mark the prediction section as completed
      markSectionCompleted(this.predictionSectionId, this.lessonId);
      
      // Update sidebar to show completion
      this.updateSidebarCompletions();
      
      // Check if all sections are now completed and update navigation
      this.checkAllSectionsCompleted();
    } catch (error) {
      console.error('Error saving section completion status:', error);
    }
  }
  
  /**
   * Save prediction answers to localStorage
   */
  protected saveAnswers(): void {
    try {
      localStorage.setItem(`${this.lessonId}_answers`, JSON.stringify(this.predictionRows));
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  }
  
  /**
   * Load saved answers from localStorage
   */
  protected loadSavedAnswers(): void {
    try {
      const savedAnswers = localStorage.getItem(`${this.lessonId}_answers`);
      if (!savedAnswers) return;
      
      const savedRows = JSON.parse(savedAnswers) as PredictionTableRow[];
      
      // Update our data model
      savedRows.forEach((savedRow, index) => {
        if (index >= this.predictionRows.length) return;
        
        this.predictionRows[index].userAnswer = savedRow.userAnswer;
        this.predictionRows[index].isCorrect = savedRow.isCorrect;
      });
      
      // Update the UI
      const inputs = document.querySelectorAll('.prediction-input');
      inputs.forEach((input, index) => {
        if (index >= savedRows.length) return;
        
        // Set the input value
        (input as HTMLInputElement).value = savedRows[index].userAnswer || '';
        
        // Update the status
        this.updateRowStatus(
          index, 
          savedRows[index].isCorrect === true, 
          !savedRows[index].userAnswer
        );
      });
      
      // Update completion status
      this.updateCompletionStatus();
      
    } catch (error) {
      console.error('Error loading saved answers:', error);
    }
  }
}