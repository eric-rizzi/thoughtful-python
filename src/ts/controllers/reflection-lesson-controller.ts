// src/ts/controllers/reflection-lesson-controller.ts
import { DynamicLessonController } from './dynamic-lesson-controller';
import { LessonSection } from '../utils/lesson-loader';
import { markSectionCompleted } from '../utils/progress-utils';

export interface ReflectionResponse {
  feedback: string;
  assessment: 'developing' | 'meets' | 'exceeds';
  timestamp: number;
}

export interface ReflectionSubmission {
  topic: string;
  code: string;
  explanation: string;
  timestamp: number;
  submitted?: boolean;
}

export interface ReflectionSession {
  submissions: ReflectionSubmission[];
  responses: ReflectionResponse[];
}

export abstract class ReflectionLessonController extends DynamicLessonController {
  protected reflectionSessions: Map<string, ReflectionSession> = new Map();
  
  protected async initializeLesson(): Promise<void> {
    // Load saved reflection sessions
    this.loadSavedSessions();
  }

  protected renderReflectionSection(section: LessonSection, container: HTMLElement): void {
    // First render as a standard section to get the base structure
    this.renderStandardSection(section, container);
    
    // Find the section container we just added
    const sectionContainer = document.getElementById(section.id);
    if (!sectionContainer) return;
    
    // Create the reflection container
    const reflectionContainer = document.createElement('div');
    reflectionContainer.className = 'reflection-container';
    
    // Add topic selection
    const topicContainer = document.createElement('div');
    topicContainer.className = 'topic-container';
    topicContainer.innerHTML = `
      <h4>Choose a topic you've learned about:</h4>
      <select id="${section.id}-topic" class="topic-selector">
        <option value="">Select a topic...</option>
        <option value="variables">Variables and Data Types</option>
        <option value="functions">Functions</option>
        <option value="loops">Loops and Iteration</option>
        <option value="conditions">Conditional Statements</option>
        <option value="datastructures">Data Structures (Lists, Dictionaries)</option>
        <option value="turtle">Turtle Graphics</option>
      </select>
    `;
    reflectionContainer.appendChild(topicContainer);
    
    // Add code editor
    const codeContainer = document.createElement('div');
    codeContainer.className = 'code-editor-container';
    codeContainer.innerHTML = `
      <h4>Create a simple example that demonstrates this topic:</h4>
      <div class="code-header">
        <span>Your Code Example</span>
      </div>
      <textarea id="${section.id}-code" class="reflection-code-editor"></textarea>
    `;
    reflectionContainer.appendChild(codeContainer);
    
    // Add explanation textarea
    const explanationContainer = document.createElement('div');
    explanationContainer.className = 'explanation-container';
    explanationContainer.innerHTML = `
      <h4>Explain how your example works (3-4 sentences):</h4>
      <textarea id="${section.id}-explanation" class="reflection-explanation"></textarea>
    `;
    reflectionContainer.appendChild(explanationContainer);
    
    // Add button container with both buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'reflection-buttons';
    
    // Get Feedback button
    const feedbackButton = document.createElement('button');
    feedbackButton.id = `${section.id}-feedback`;
    feedbackButton.className = 'reflection-feedback-btn';
    feedbackButton.textContent = 'Get Feedback';
    feedbackButton.addEventListener('click', () => this.handleReflectionSubmit(section.id, false));
    
    // Submit Entry button
    const submitButton = document.createElement('button');
    submitButton.id = `${section.id}-submit`;
    submitButton.className = 'reflection-submit-btn';
    submitButton.textContent = 'Submit Entry';
    submitButton.addEventListener('click', () => this.handleReflectionSubmit(section.id, true));
    
    // Add buttons to container
    buttonContainer.appendChild(feedbackButton);
    buttonContainer.appendChild(submitButton);
    reflectionContainer.appendChild(buttonContainer);
    
    // Add history container
    const historyContainer = document.createElement('div');
    historyContainer.id = `${section.id}-history`;
    historyContainer.className = 'reflection-history';
    reflectionContainer.appendChild(historyContainer);
    
    // Add the reflection container to the section
    sectionContainer.appendChild(reflectionContainer);
    
    // Display previous submissions and feedback if any
    this.displayReflectionHistory(section.id);
  }
  
  // Update the handleReflectionSubmit method to accept a submit parameter
  protected async handleReflectionSubmit(sectionId: string, isSubmitEntry: boolean = false): Promise<void> {
    // Get values from form
    const topicElement = document.getElementById(`${sectionId}-topic`) as HTMLSelectElement;
    const codeElement = document.getElementById(`${sectionId}-code`) as HTMLTextAreaElement;
    const explanationElement = document.getElementById(`${sectionId}-explanation`) as HTMLTextAreaElement;
    
    const topic = topicElement.value;
    const code = codeElement.value;
    const explanation = explanationElement.value;
    
    // Validate input
    if (!topic || !code || !explanation) {
      alert('Please complete all fields before submitting.');
      return;
    }
    
    // Disable both buttons while processing
    const feedbackButton = document.getElementById(`${sectionId}-feedback`) as HTMLButtonElement;
    const submitButton = document.getElementById(`${sectionId}-submit`) as HTMLButtonElement;
    
    if (feedbackButton) {
      feedbackButton.disabled = true;
      feedbackButton.textContent = 'Processing...';
    }
    
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';
    }
    
    try {
      // Create submission object with the submitted flag
      const submission: ReflectionSubmission = {
        topic: topic,
        code: code,
        explanation: explanation,
        timestamp: Date.now(),
        submitted: isSubmitEntry // Flag indicating if this is a formal submission
      };
      
      // Get or create session
      if (!this.reflectionSessions.has(sectionId)) {
        this.reflectionSessions.set(sectionId, {
          submissions: [],
          responses: []
        });
      }
      
      const session = this.reflectionSessions.get(sectionId)!;
      session.submissions.push(submission);
      
      // Send to Claude API
      const response = await this.sendToClaudeAPI(submission);
      
      // Add response to session
      session.responses.push(response);
      
      // Save updated session
      this.saveSessions();
      
      // Display updated history
      this.displayReflectionHistory(sectionId);
      
      // Clear form for next submission
      // explanationElement.value = '';  // Clear only explanation, keep code and topic
      
      // If assessment is "meets" or "exceeds", mark section as completed
      if (response.assessment === 'meets' || response.assessment === 'exceeds') {
        markSectionCompleted(sectionId, this.lessonId);
        this.updateSidebarCompletions();
        this.checkAllSectionsCompleted();
      }
      
      // Show specific message based on button clicked
      if (isSubmitEntry) {
        alert('Your entry has been submitted to your Learning Entries journal!');
      }
    } catch (error) {
      console.error('Error submitting reflection:', error);
      alert('There was an error submitting your reflection. Please try again.');
    } finally {
      // Re-enable both buttons
      if (feedbackButton) {
        feedbackButton.disabled = false;
        feedbackButton.textContent = 'Get Feedback';
      }
      
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Entry';
      }
    }
  }
  
  // Update the displayReflectionHistory method to show submission status
  private displayReflectionHistory(sectionId: string): void {
    const historyContainer = document.getElementById(`${sectionId}-history`);
    if (!historyContainer) return;
    
    // Clear existing history
    historyContainer.innerHTML = '';
    
    // Get session
    const session = this.reflectionSessions.get(sectionId);
    if (!session || session.submissions.length === 0) {
      historyContainer.innerHTML = '<p class="no-history">No submissions yet. Complete the form above to get feedback.</p>';
      return;
    }
    
    // Create history header
    const historyHeader = document.createElement('h4');
    historyHeader.textContent = 'Your Submission History';
    historyContainer.appendChild(historyHeader);
    
    // Display submissions and responses
    for (let i = session.submissions.length - 1; i >= 0; i--) {
      const submission = session.submissions[i];
      const response = session.responses[i];
      
      // Create submission card
      const card = document.createElement('div');
      card.className = `reflection-card assessment-${response?.assessment || 'pending'}`;
      
      // Format date
      const date = new Date(submission.timestamp);
      const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      // Add submission details with submission status badge if submitted
      card.innerHTML = `
        <div class="reflection-submission">
          <div class="reflection-header">
            <span class="reflection-date">${dateStr}</span>
            ${submission.submitted ? '<span class="submission-badge">Submitted to Journal</span>' : ''}
          </div>
          <h5>Topic: ${this.getTopicName(submission.topic)}</h5>
          <div class="reflection-code-display">
            <pre><code>${this.escapeHTML(submission.code)}</code></pre>
          </div>
          <div class="reflection-explanation-display">
            <p>${this.escapeHTML(submission.explanation)}</p>
          </div>
        </div>
      `;
      
      // Add response if available
      if (response) {
        const responseEl = document.createElement('div');
        responseEl.className = 'reflection-response';
        responseEl.innerHTML = `
          <h5>Feedback:</h5>
          <div class="assessment-badge ${response.assessment}">${response.assessment}</div>
          <p>${this.escapeHTML(response.feedback)}</p>
        `;
        card.appendChild(responseEl);
      } else {
        const pendingEl = document.createElement('div');
        pendingEl.className = 'reflection-pending';
        pendingEl.textContent = 'Feedback pending...';
        card.appendChild(pendingEl);
      }
      
      historyContainer.appendChild(card);
    }
  }
  
  private async sendToClaudeAPI(submission: ReflectionSubmission): Promise<ReflectionResponse> {
    // This is where you would integrate with Claude's API
    // For now, we'll simulate a response
    
    // In a real implementation, you would:
    // 1. Format the message to Claude
    // 2. Make API call to Claude
    // 3. Parse the response
    // 4. Extract feedback and assessment
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate response
    let assessment: 'developing' | 'meets' | 'exceeds';
    let feedback: string;
    
    // Simple logic to determine assessment (replace with actual Claude analysis)
    if (submission.explanation.length < 50) {
      assessment = 'developing';
      feedback = 'Your explanation is too brief. Please provide more detail about how your code works and the concepts it demonstrates.';
    } else if (submission.explanation.length < 150) {
      assessment = 'meets';
      feedback = "Good explanation of your code example. You've shown understanding of the core concepts. Consider expanding on how this relates to real-world programming scenarios.";
    } else {
      assessment = 'exceeds';
      feedback = "Excellent work! Your explanation demonstrates deep understanding of the concept and how it's applied in your code example. You've made connections between the syntax and its purpose.";
    }
    
    return {
      feedback,
      assessment,
      timestamp: Date.now()
    };
  }
  
  private getTopicName(topicValue: string): string {
    const topicMap: {[key: string]: string} = {
      'variables': 'Variables and Data Types',
      'functions': 'Functions',
      'loops': 'Loops and Iteration',
      'conditions': 'Conditional Statements',
      'datastructures': 'Data Structures',
      'turtle': 'Turtle Graphics'
    };
    
    return topicMap[topicValue] || topicValue;
  }
  
  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  private saveSessions(): void {
    try {
      // Convert Map to Object for storage
      const sessionsObj: { [key: string]: ReflectionSession } = {};
      this.reflectionSessions.forEach((session, key) => {
        sessionsObj[key] = session;
      });
      
      localStorage.setItem(`${this.lessonId}_reflections`, JSON.stringify(sessionsObj));
    } catch (error) {
      console.error('Error saving reflection sessions:', error);
    }
  }
  
  private loadSavedSessions(): void {
    try {
      const savedSessions = localStorage.getItem(`${this.lessonId}_reflections`);
      if (!savedSessions) return;
      
      const sessionsObj = JSON.parse(savedSessions);
      
      // Convert Object back to Map
      this.reflectionSessions = new Map(Object.entries(sessionsObj));
    } catch (error) {
      console.error('Error loading saved reflection sessions:', error);
    }
  }
  
  protected afterRender(): void {
    // If using CodeMirror, initialize it for reflection code editors
    if ((window as any).CodeMirror) {
      document.querySelectorAll('.reflection-code-editor').forEach(editor => {
        (window as any).CodeMirror.fromTextArea(editor as HTMLTextAreaElement, {
          mode: 'python',
          theme: 'default',
          lineNumbers: true,
          indentUnit: 4,
          tabSize: 4
        });
      });
    }
  }
}