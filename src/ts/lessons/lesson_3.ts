// lesson_3.ts - Dynamic version using JSON data
import '../../css/main.css';
import '../../css/lessons.css';
import '../../css/challenges.css';
import '../../css/lesson_3.css';
import '../../css/lesson_4.css'; // Reusing the dynamic lesson styles

// Import utilities
import { escapeHTML } from '../utils/pyodide-utils';
import { markSectionCompleted, loadCompletionFromStorage } from '../utils/progress-utils';
import { LESSON_3_SECTION_MAPPING } from '../utils/section-mappings';
import { loadLesson, getLessonMapping, getRequiredSections, Lesson, LessonSection } from '../utils/lesson-loader';

// Extend the lesson interfaces for prediction-specific data
interface PredictionTableRow {
  inputs: number[];
  expected: number;
  description: string;
  userAnswer?: string;
  isCorrect?: boolean | null;
}

interface PredictionTable {
  columns: string[];
  rows: PredictionTableRow[];
}

interface FunctionDisplay {
  title: string;
  code: string;
}

interface PredictionSection extends LessonSection {
  functionDisplay?: FunctionDisplay;
  predictionTable?: PredictionTable;
  completionMessage?: string;
}

class Lesson3Controller {
  private lessonId = 'lesson_3';
  private lesson: Lesson | null = null;
  private isInitialized: boolean = false;
  private predictionRows: PredictionTableRow[] = [];
  private completedRows: number = 0;
  private totalRows: number = 0;
  private predictionSectionId: string | null = null;

  constructor() {
    // Initialize the lesson controller
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // DOM already loaded, initialize immediately
      this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load lesson data from JSON
      this.lesson = await loadLesson(this.lessonId);
      
      // Find the prediction section
      const predictionSection = this.lesson.sections.find(section => 
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
      
      // Render the lesson content
      this.renderLesson();
      
      // Load saved answers if available
      this.loadSavedAnswers();
      
      // Load completion status
      loadCompletionFromStorage(this.lessonId);
      
      // Update sidebar to show completed sections
      this.updateSidebarCompletions();
      
      // Check if lesson is already complete
      this.checkAllSectionsCompleted();
      
      // Mark as initialized
      this.isInitialized = true;
      console.log(`${this.lessonId} controller initialized`);
    } catch (error) {
      console.error(`Failed to initialize ${this.lessonId}:`, error);
      this.showLoadError(error);
    }
  }

  private renderLesson(): void {
    if (!this.lesson) return;
    
    // Render the sidebar navigation
    this.renderSidebar();
    
    // Clear loading message
    const contentContainer = document.getElementById('lesson-content');
    if (contentContainer) {
      contentContainer.innerHTML = '';
      
      // Add lesson title and description
      const titleElement = document.createElement('h2');
      titleElement.textContent = this.lesson.title;
      contentContainer.appendChild(titleElement);
      
      const descriptionElement = document.createElement('p');
      descriptionElement.textContent = this.lesson.description;
      contentContainer.appendChild(descriptionElement);
      
      // Render each section
      this.lesson.sections.forEach(section => {
        // Check if this is a prediction section
        if (section.id === this.predictionSectionId && (section as PredictionSection).predictionTable) {
          this.renderPredictionSection(section as PredictionSection, contentContainer);
        } else {
          this.renderStandardSection(section, contentContainer);
        }
      });
    }
    
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
  }

  private renderSidebar(): void {
    if (!this.lesson) return;
    
    const sidebarContainer = document.getElementById('sidebar-sections');
    if (sidebarContainer) {
      sidebarContainer.innerHTML = '';
      
      // Create sidebar items for each section
      this.lesson.sections.forEach(section => {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-section-id', section.id);
        
        // Check if this section is completed
        const storageKey = `python_${this.lessonId}_completed`;
        const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (completedSections.includes(section.id)) {
          listItem.classList.add('completed');
        }
        
        const link = document.createElement('a');
        link.href = `#${section.id}`;
        link.textContent = section.title;
        
        listItem.appendChild(link);
        sidebarContainer.appendChild(listItem);
      });
    }
  }

  private renderStandardSection(section: LessonSection, container: HTMLElement): void {
    // Use template to create section
    const template = document.getElementById('section-template') as HTMLTemplateElement;
    if (!template) return;
    
    const sectionElement = template.content.cloneNode(true) as DocumentFragment;
    const sectionContainer = sectionElement.querySelector('.lesson-section') as HTMLElement;
    if (!sectionContainer) return;
    
    // Set section ID and title
    sectionContainer.id = section.id;
    const titleElement = sectionContainer.querySelector('.section-title') as HTMLElement;
    if (titleElement) {
      titleElement.textContent = section.title;
    }
    
    // Set section content - handle newlines in content
    const contentElement = sectionContainer.querySelector('.section-content') as HTMLElement;
    if (contentElement) {
      // Convert newlines to <br> tags or render as formatted HTML
      const formattedContent = section.content.replace(/\n(\d+)\.\s/g, '<br>$1. ');
      contentElement.innerHTML = formattedContent;
    }
    
    container.appendChild(sectionContainer);
  }

  private renderPredictionSection(section: PredictionSection, container: HTMLElement): void {
    // Render the basic section first
    this.renderStandardSection(section, container);
    
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

  private handlePredictionInput(input: HTMLInputElement): void {
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

  private markSectionAsCompleted(): void {
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

  private saveAnswers(): void {
    try {
      localStorage.setItem(`${this.lessonId}_answers`, JSON.stringify(this.predictionRows));
    } catch (error) {
      console.error('Error saving answers:', error);
    }
  }

  private loadSavedAnswers(): void {
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
  
  /**
   * Updates the sidebar to show which sections are completed
   */
  private updateSidebarCompletions(): void {
    try {
      // Get completed sections from localStorage
      const storageKey = `python_${this.lessonId}_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Mark completed sections in sidebar
      this.lesson?.sections.forEach(section => {
        if (completedSections.includes(section.id)) {
          const sidebarItem = document.querySelector(`#sidebar-sections li[data-section-id="${section.id}"]`);
          if (sidebarItem && !sidebarItem.classList.contains('completed')) {
            sidebarItem.classList.add('completed');
          }
        }
      });
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
      
      // Get required sections for this lesson
      const requiredSections = this.predictionSectionId ? [this.predictionSectionId] : [];
      
      // Check if all required sections are completed
      const allCompleted = requiredSections.length > 0 && 
        requiredSections.every(section => completedSections.includes(section));
      
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

  private showLoadError(error: any): void {
    const contentContainer = document.getElementById('lesson-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="load-error">
          <h3>Failed to Load Lesson</h3>
          <p>We couldn't load the lesson content. Please try refreshing the page.</p>
          <pre>${escapeHTML(error.toString())}</pre>
        </div>
      `;
    }
    
    const sidebarContainer = document.getElementById('sidebar-sections');
    if (sidebarContainer) {
      sidebarContainer.innerHTML = `
        <li class="sidebar-error">Error loading lesson content</li>
      `;
    }
  }
}

// Create and export the controller instance
const lesson3Controller = new Lesson3Controller();
export default lesson3Controller;