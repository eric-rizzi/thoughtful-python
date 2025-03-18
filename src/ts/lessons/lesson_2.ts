// lesson_2.ts - Simplified version focused only on the challenge
import { pythonRunner } from '../pyodide';
import '../../css/main.css';
import '../../css/challenges.css';
import '../../css/lesson_2_simplified.css';

// Import utility functions
import { initializeCodeEditors, getCodeFromEditor, updateButtonState } from '../utils/editor-utils';
import { escapeHTML, generateTestCode, parseTestResults, runPythonCode } from '../utils/pyodide-utils';
import { displayTestResults, displayTestError } from '../utils/test-display-utils';
import { markSectionCompleted, loadCompletionFromStorage } from '../utils/progress-utils';
import { getSectionIdFromExampleId, LESSON_2_SECTION_MAPPING } from '../utils/section-mappings';
import { showError } from '../utils/html-components';

interface TestCase {
  input: number;
  expected: number;
  description: string;
}

class Lesson2SimplifiedController {
  private runButton: HTMLElement | null = null;
  private testButton: HTMLElement | null = null;
  private codeEditors: Map<string, any> = new Map();
  private isInitialized: boolean = false;
  
  // Test cases for the temperature conversion function
  private testCases: TestCase[] = [
    { input: 0, expected: 32, description: "Freezing point of water (0°C)" },
    { input: 100, expected: 212, description: "Boiling point of water (100°C)" },
    { input: 37, expected: 98.6, description: "Human body temperature (37°C)" },
    { input: -40, expected: -40, description: "Equal point (-40°C)" },
    { input: 25, expected: 77, description: "Room temperature (25°C)" },
    { input: -10, expected: 14, description: "Cold winter day (-10°C)" },
    { input: 42, expected: 107.6, description: "Hot day (42°C)" }
  ];

  constructor() {
    // Initialize Pyodide in the background as soon as possible
    this.initializePyodide();
    
    // Wait for DOM to be fully loaded before setting up event handlers
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // DOM already loaded, initialize immediately
      this.initialize();
    }
  }

  private async initializePyodide(): Promise<void> {
    try {
      await pythonRunner.initialize();
      console.log('Python environment ready for Temperature Conversion Challenge');
    } catch (error) {
      console.error('Failed to initialize Python environment:', error);
      showError('Failed to load Python environment. Please refresh the page and try again.');
    }
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    // Get buttons
    this.runButton = document.querySelector('.run-button') as HTMLElement;
    this.testButton = document.querySelector('.test-button') as HTMLElement;
    
    if (!this.runButton || !this.testButton) {
      console.error('Could not find run or test buttons');
      return;
    }
    
    // Initialize code editors
    this.codeEditors = initializeCodeEditors();
    
    // Add click event listeners to buttons
    this.runButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.handleRunButtonClick(this.runButton as HTMLElement);
    });
    
    this.testButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.handleTestButtonClick();
    });
    
    // Load completion status from localStorage
    loadCompletionFromStorage('lesson_2');
    
    // Check if all sections are completed and update navigation
    this.checkAllSectionsCompleted();
    
    // Mark as initialized
    this.isInitialized = true;
    console.log('Lesson 2 controller initialized');
  }

  private async handleRunButtonClick(button: HTMLElement): Promise<void> {
    const exampleId = button.dataset.exampleId;
    if (!exampleId) {
      console.error('Run button is missing data-example-id attribute');
      return;
    }
    
    const editorId = `${exampleId}-editor`;
    const outputElement = document.getElementById(`${exampleId}-output`);
    
    if (!outputElement) {
      console.error(`Could not find output element for example: ${exampleId}`);
      return;
    }
    
    // Get code from the editor
    const code = getCodeFromEditor(editorId, this.codeEditors);
    if (!code) return;
    
    // Clear previous output
    outputElement.innerHTML = '';
    
    // Update button state to loading
    updateButtonState(button, true);
    
    try {
      // Run the Python code
      const result = await runPythonCode(code);
      
      // Display the output
      if (result.trim()) {
        outputElement.innerHTML = `<pre class="output-text">${escapeHTML(result)}</pre>`;
      } else {
        outputElement.innerHTML = '<p class="output-empty">Code executed successfully with no output.</p>';
      }
      
      // Mark this section as completed
      const sectionId = getSectionIdFromExampleId(exampleId, LESSON_2_SECTION_MAPPING);
      markSectionCompleted(sectionId, 'lesson_2');
      
      // Check if all sections are now completed
      this.checkAllSectionsCompleted();
    } catch (error: any) {
      outputElement.innerHTML = `<pre class="output-error">Error: ${escapeHTML(error.toString())}</pre>`;
    } finally {
      // Restore button state
      updateButtonState(button, false);
    }
  }

  private async handleTestButtonClick(): Promise<void> {
    if (!this.testButton) return;
    
    const editorId = 'challenge-editor';
    const testResultElement = document.getElementById('challenge-test-result');
    
    if (!testResultElement) {
      console.error('Could not find test result element');
      return;
    }
    
    // Get code from the editor
    const userCode = getCodeFromEditor(editorId, this.codeEditors);
    if (!userCode) return;
    
    // Update button state to loading
    updateButtonState(this.testButton, true, 'Testing...');
    
    try {
      // Generate and run test code
      const testCode = generateTestCode(userCode, 'celsius_to_fahrenheit', this.testCases);
      const result = await pythonRunner.runCode(testCode);
      
      // Parse test results
      const testResults = parseTestResults(result);
      
      // Display test results
      const allPassed = displayTestResults(testResults, testResultElement);
      
      // If all tests passed, mark the challenge as completed
      if (allPassed) {
        markSectionCompleted('challenge', 'lesson_2');
      }
    } catch (error: any) {
      displayTestError(error, testResultElement);
    } finally {
      // Restore button state
      updateButtonState(this.testButton, false);
    }
  }

  /**
     * Checks if all sections in the lesson are completed and updates the navigation
     */
  private checkAllSectionsCompleted(): void {
    try {
      // Get completed sections from localStorage
      const storageKey = `python_lesson_2_completed`;
      const completedSections = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Required sections for this lesson
      const requiredSections = ['functions', 'temperature', 'challenge'];
      
      // Check if all required sections are completed
      const allCompleted = requiredSections.every(section => 
        completedSections.includes(section)
      );
      
      console.log('Lesson 2 completion check:', {
        completedSections,
        requiredSections,
        allCompleted
      });
      
      if (allCompleted) {
        // Mark the lesson as completed in navigation
        const navItem = document.querySelector('nav li a[href="lesson_2.html"]')?.parentElement;
        if (navItem) {
          navItem.classList.add('nav-completed');
          console.log('Added nav-completed class to Lesson 2 nav item');
        } else {
          console.warn('Could not find Lesson 2 nav item');
        }
      }
    } catch (error) {
      console.error('Error checking lesson completion:', error);
    }
  }
}

// Create and export the controller instance
const lesson2Controller = new Lesson2SimplifiedController();
export default lesson2Controller;