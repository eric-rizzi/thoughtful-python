/**
 * Controller for Coverage type sections where students provide inputs
 * to make code reach specific paths
 */
import { DynamicLessonController } from './dynamic-lesson-controller';
import { LessonSection } from '../utils/lesson-loader';
import { markSectionCompleted } from '../utils/progress-utils';
import { runPythonCode, escapeHTML } from '../utils/pyodide-utils';

export interface CoverageChallenge {
  id: string;
  expectedOutput: string;
  hint?: string;
  userInput?: string;
  actualOutput?: string;
  isCorrect?: boolean;
}

export interface InputParam {
  name: string;
  type: string;
  placeholder: string;
}

export interface CoverageSection extends LessonSection {
  kind: 'Coverage';
  code: string;
  coverageChallenges: CoverageChallenge[];
  inputParams: InputParam[];
}

export abstract class CoverageLessonController extends DynamicLessonController {
  protected userAnswers: Map<string, Map<string, any>> = new Map();
  
  /**
   * Initialize the controller
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
   * Render a Coverage section
   */
  public renderCoverageSection(section: CoverageSection, container: HTMLElement): void {
    // First render as a standard section to get the base structure
    this.renderStandardSection(section, container);
    
    // Find the section container we just added
    const sectionContainer = document.getElementById(section.id);
    if (!sectionContainer) return;
    
    // Create the coverage challenge container
    const coverageContainer = document.createElement('div');
    coverageContainer.className = 'coverage-container';
    
    // Add code display
    const codeDisplay = document.createElement('div');
    codeDisplay.className = 'coverage-code';
    codeDisplay.innerHTML = `
      <h4>Code to Explore:</h4>
      <pre><code>${escapeHTML(section.code)}</code></pre>
    `;
    coverageContainer.appendChild(codeDisplay);
    
    // Create instruction
    const instruction = document.createElement('div');
    instruction.className = 'coverage-instruction';
    instruction.innerHTML = `
      <p>For each output below, provide input values that will make the code produce that output.</p>
    `;
    coverageContainer.appendChild(instruction);
    
    // Create the challenges table
    const table = document.createElement('table');
    table.className = 'coverage-table';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Add columns for input parameters
    section.inputParams.forEach(param => {
      const th = document.createElement('th');
      th.textContent = `Input: ${param.name}`;
      headerRow.appendChild(th);
    });
    
    // Add columns for expected output, actual output, and run button
    const thExpected = document.createElement('th');
    thExpected.textContent = 'Expected Output';
    headerRow.appendChild(thExpected);
    
    const thActual = document.createElement('th');
    thActual.textContent = 'Actual Output';
    headerRow.appendChild(thActual);
    
    const thAction = document.createElement('th');
    thAction.textContent = 'Action';
    headerRow.appendChild(thAction);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body with challenges
    const tbody = document.createElement('tbody');
    
    section.coverageChallenges.forEach(challenge => {
      const row = document.createElement('tr');
      row.setAttribute('data-challenge-id', challenge.id);
      
      // Add input fields for each parameter
      section.inputParams.forEach(param => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = param.type === 'number' ? 'number' : 'text';
        input.id = `${section.id}-${challenge.id}-${param.name}`;
        input.className = 'coverage-input';
        input.placeholder = param.placeholder;
        input.setAttribute('data-param-name', param.name);
        input.setAttribute('data-challenge-id', challenge.id);
        td.appendChild(input);
        row.appendChild(td);
      });
      
      // Add expected output column
      const tdExpected = document.createElement('td');
      tdExpected.className = 'expected-output';
      tdExpected.innerHTML = `<pre>${escapeHTML(challenge.expectedOutput)}</pre>`;
      
      // Add hint button if a hint exists
      if (challenge.hint) {
        const hintButton = document.createElement('button');
        hintButton.className = 'hint-button';
        hintButton.textContent = '?';
        hintButton.title = 'Show hint';
        hintButton.onclick = () => alert(`Hint: ${challenge.hint}`);
        tdExpected.appendChild(hintButton);
      }
      
      row.appendChild(tdExpected);
      
      // Add actual output column
      const tdActual = document.createElement('td');
      tdActual.className = 'actual-output';
      tdActual.id = `${section.id}-${challenge.id}-output`;
      row.appendChild(tdActual);
      
      // Add run button column
      const tdAction = document.createElement('td');
      const runButton = document.createElement('button');
      runButton.className = 'coverage-run-button';
      runButton.textContent = 'Run';
      runButton.setAttribute('data-section-id', section.id);
      runButton.setAttribute('data-challenge-id', challenge.id);
      runButton.addEventListener('click', () => this.handleRunChallenge(section, challenge.id));
      tdAction.appendChild(runButton);
      row.appendChild(tdAction);
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    coverageContainer.appendChild(table);
    
    // Add progress indicator
    const progressContainer = document.createElement('div');
    progressContainer.className = 'coverage-progress';
    progressContainer.id = `${section.id}-progress`;
    progressContainer.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" id="${section.id}-progress-fill" style="width: 0%"></div>
      </div>
      <span class="progress-text">0/${section.coverageChallenges.length} completed</span>
    `;
    coverageContainer.appendChild(progressContainer);
    
    // Add the container to the section
    sectionContainer.appendChild(coverageContainer);
  }
  
  /**
   * Handle running a challenge with the provided inputs
   */
  private async handleRunChallenge(section: CoverageSection, challengeId: string): Promise<void> {
    // Find the challenge
    const challenge = section.coverageChallenges.find(c => c.id === challengeId);
    if (!challenge) return;
    
    // Collect input values
    const inputValues: {[key: string]: any} = {};
    
    section.inputParams.forEach(param => {
      const inputElement = document.getElementById(`${section.id}-${challengeId}-${param.name}`) as HTMLInputElement;
      if (inputElement) {
        // Convert to appropriate type
        let value: any = inputElement.value;
        if (param.type === 'number') {
          value = parseFloat(value);
        }
        inputValues[param.name] = value;
      }
    });
    
    // Update button state
    const runButton = document.querySelector(`button[data-section-id="${section.id}"][data-challenge-id="${challengeId}"]`) as HTMLButtonElement;
    if (runButton) {
      runButton.disabled = true;
      runButton.textContent = 'Running...';
    }
    
    // Clear previous output
    const outputElement = document.getElementById(`${section.id}-${challengeId}-output`);
    if (outputElement) {
      outputElement.innerHTML = '';
      outputElement.className = 'actual-output';
    }
    
    try {
      // Prepare the code with the input values
      let runCode = section.code;
      
      // Replace variables in the code with the input values
      Object.entries(inputValues).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Escape strings properly
          runCode = runCode.replace(new RegExp(`\\b${key}\\b`, 'g'), `"${value}"`);
        } else {
          // Use literal value for numbers, booleans, etc.
          runCode = runCode.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
        }
      });
      
      // Run the code
      const result = await runPythonCode(runCode);
      
      // Display the result
      if (outputElement) {
        outputElement.innerHTML = `<pre>${escapeHTML(result.trim())}</pre>`;
        
        // Check if the output matches the expected output
        const isCorrect = result.trim() === challenge.expectedOutput.trim();
        
        // Update UI to indicate correctness
        outputElement.className = isCorrect ? 'actual-output correct' : 'actual-output incorrect';
        
        // Save the answer
        this.saveAnswer(section.id, challengeId, {
          inputs: inputValues,
          output: result.trim(),
          isCorrect
        });
        
        // Mark row as completed if correct
        const row = document.querySelector(`tr[data-challenge-id="${challengeId}"]`);
        if (row) {
          if (isCorrect) {
            row.classList.add('completed-row');
          } else {
            row.classList.remove('completed-row');
          }
        }
        
        // Update progress
        this.updateProgress(section);
        
        // Check if the section is complete
        this.checkSectionCompletion(section);
      }
    } catch (error: any) {
      // Display error
      if (outputElement) {
        outputElement.innerHTML = `<pre class="error">${escapeHTML(error.toString())}</pre>`;
        outputElement.className = 'actual-output error';
      }
    } finally {
      // Restore button state
      if (runButton) {
        runButton.disabled = false;
        runButton.textContent = 'Run';
      }
    }
  }
  
  /**
   * Save an answer for a challenge
   */
  private saveAnswer(sectionId: string, challengeId: string, data: any): void {
    // Get or create the map for this section
    if (!this.userAnswers.has(sectionId)) {
      this.userAnswers.set(sectionId, new Map());
    }
    
    // Save the data for this challenge
    const sectionAnswers = this.userAnswers.get(sectionId);
    if (sectionAnswers) {
      sectionAnswers.set(challengeId, data);
    }
    
    // Save to localStorage
    this.saveAnswersToStorage();
  }
  
  /**
   * Save all answers to localStorage
   */
  private saveAnswersToStorage(): void {
    try {
      // Convert nested maps to objects for storage
      const storageData: {[key: string]: {[key: string]: any}} = {};
      
      this.userAnswers.forEach((sectionAnswers, sectionId) => {
        storageData[sectionId] = {};
        sectionAnswers.forEach((data, challengeId) => {
          storageData[sectionId][challengeId] = data;
        });
      });
      
      localStorage.setItem(`${this.lessonId}_coverage_answers`, JSON.stringify(storageData));
    } catch (error) {
      console.error('Error saving coverage answers:', error);
    }
  }
  
  /**
   * Load saved answers from localStorage
   */
  private loadSavedAnswers(): void {
    try {
      const savedData = localStorage.getItem(`${this.lessonId}_coverage_answers`);
      if (!savedData) return;
      
      const storageData = JSON.parse(savedData);
      
      // Convert objects back to maps
      Object.entries(storageData).forEach(([sectionId, sectionData]) => {
        const sectionAnswers = new Map();
        
        Object.entries(sectionData as {[key: string]: any}).forEach(([challengeId, data]) => {
          sectionAnswers.set(challengeId, data);
        });
        
        this.userAnswers.set(sectionId, sectionAnswers);
      });
    } catch (error) {
      console.error('Error loading saved coverage answers:', error);
    }
  }
  
  /**
   * Update the UI with saved answers
   */
  private updateUI(): void {
    // For each section with saved answers
    this.userAnswers.forEach((sectionAnswers, sectionId) => {
      // Find the section
      const section = this.findSectionById(sectionId);
      if (!section || section.kind !== 'Coverage') return;
      
      const coverageSection = section as CoverageSection;
      
      // Update each challenge with saved data
      sectionAnswers.forEach((data, challengeId) => {
        // Update input fields
        if (data.inputs) {
          Object.entries(data.inputs).forEach(([paramName, value]) => {
            const inputElement = document.getElementById(`${sectionId}-${challengeId}-${paramName}`) as HTMLInputElement;
            if (inputElement) {
              inputElement.value = String(value);
            }
          });
        }
        
        // Update output display
        const outputElement = document.getElementById(`${sectionId}-${challengeId}-output`);
        if (outputElement && data.output) {
          outputElement.innerHTML = `<pre>${escapeHTML(data.output)}</pre>`;
          outputElement.className = data.isCorrect ? 'actual-output correct' : 'actual-output incorrect';
        }
        
        // Mark row as completed if correct
        if (data.isCorrect) {
          const row = document.querySelector(`tr[data-challenge-id="${challengeId}"]`);
          if (row) {
            row.classList.add('completed-row');
          }
        }
      });
      
      // Update progress
      this.updateProgress(coverageSection);
      
      // Check if the section is complete
      this.checkSectionCompletion(coverageSection);
    });
  }
  
  /**
   * Update the progress indicator for a section
   */
  private updateProgress(section: CoverageSection): void {
    // Count completed challenges
    let completedCount = 0;
    const sectionAnswers = this.userAnswers.get(section.id);
    
    if (sectionAnswers) {
      section.coverageChallenges.forEach(challenge => {
        const data = sectionAnswers.get(challenge.id);
        if (data && data.isCorrect) {
          completedCount++;
        }
      });
    }
    
    // Update progress bar
    const progressFill = document.getElementById(`${section.id}-progress-fill`);
    if (progressFill) {
      const percentComplete = (completedCount / section.coverageChallenges.length) * 100;
      progressFill.style.width = `${percentComplete}%`;
    }
    
    // Update progress text
    const progressContainer = document.getElementById(`${section.id}-progress`);
    if (progressContainer) {
      const progressText = progressContainer.querySelector('.progress-text');
      if (progressText) {
        progressText.textContent = `${completedCount}/${section.coverageChallenges.length} completed`;
      }
    }
  }
  
  /**
   * Check if all challenges in the section are completed
   */
  private checkSectionCompletion(section: CoverageSection): void {
    // Count completed challenges
    let completedCount = 0;
    const sectionAnswers = this.userAnswers.get(section.id);
    
    if (sectionAnswers) {
      section.coverageChallenges.forEach(challenge => {
        const data = sectionAnswers.get(challenge.id);
        if (data && data.isCorrect) {
          completedCount++;
        }
      });
    }
    
    // If all challenges are completed, mark the section as completed
    if (completedCount === section.coverageChallenges.length) {
      markSectionCompleted(section.id, this.lessonId);
      this.updateSidebarCompletions();
      this.checkAllSectionsCompleted();
    }
  }
  
  /**
   * Find a section by ID
   */
  private findSectionById(sectionId: string): LessonSection | undefined {
    if (!this.lesson) return undefined;
    return this.lesson.sections.find(section => section.id === sectionId);
  }
}