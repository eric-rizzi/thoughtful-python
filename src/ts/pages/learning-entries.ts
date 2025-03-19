// src/ts/pages/learning-entries.ts
import '../../css/base.css';
import '../../css/learning-entries.css';
import { initializePageLayout } from '../utils/html-loader';

interface LearningEntry {
  id: string;
  timestamp: number;
  lessonId: string;
  topic: string;
  code: string;
  explanation: string;
  assessment?: string;
  feedback?: string;
}

class LearningEntriesController {
  private entries: LearningEntry[] = [];

  constructor() {
    // Initialize the page
    document.addEventListener('DOMContentLoaded', () => {
      // Initialize common page components
      initializePageLayout('learning-entries');
      
      // Load and display entries
      this.loadEntries();
    });
  }

  private loadEntries(): void {
    try {
      // Get all entries from localStorage
      const allEntries: LearningEntry[] = [];
      
      // Iterate through all lesson IDs
      for (let i = 1; i <= 7; i++) {
        const lessonId = `lesson_${i}`;
        // Load reflections from this lesson
        const reflectionsJson = localStorage.getItem(`${lessonId}_reflections`);
        
        if (reflectionsJson) {
          try {
            const reflectionsObj = JSON.parse(reflectionsJson);
            
            // Convert the object to array of entries
            Object.entries(reflectionsObj).forEach(([sectionId, session]: [string, any]) => {
              // Only process sessions with submissions
              if (session.submissions && session.submissions.length > 0) {
                session.submissions.forEach((submission: any, index: number) => {
                  const response = session.responses && session.responses[index];
                  
                  // Create an entry
                  const entry: LearningEntry = {
                    id: `${lessonId}_${sectionId}_${index}`,
                    timestamp: submission.timestamp,
                    lessonId: lessonId,
                    topic: submission.topic,
                    code: submission.code,
                    explanation: submission.explanation
                  };
                  
                  // Add response if available
                  if (response) {
                    entry.assessment = response.assessment;
                    entry.feedback = response.feedback;
                  }
                  
                  // Only add entries that have been "submitted" (will be implemented with the new buttons)
                  if (submission.submitted) {
                    allEntries.push(entry);
                  }
                });
              }
            });
          } catch (e) {
            console.error(`Error parsing reflections for ${lessonId}:`, e);
          }
        }
      }
      
      // Sort entries by timestamp (newest first)
      this.entries = allEntries.sort((a, b) => b.timestamp - a.timestamp);
      
      // Display the entries
      this.renderEntries();
    } catch (error) {
      console.error('Error loading entries:', error);
      this.showError('Failed to load your learning entries. Please try again later.');
    }
  }

  private renderEntries(): void {
    const container = document.getElementById('entries-container');
    const noEntriesMessage = document.querySelector('.no-entries-message');
    
    if (!container) return;
    
    // Clear loading message
    container.innerHTML = '';
    
    if (this.entries.length === 0) {
      // Show no entries message
      if (noEntriesMessage) {
        noEntriesMessage.classList.remove('hidden');
      }
      return;
    }
    
    // Create entries list
    const entriesList = document.createElement('div');
    entriesList.className = 'entries-list';
    
    // Add each entry
    this.entries.forEach(entry => {
      const entryCard = document.createElement('div');
      entryCard.className = `entry-card ${entry.assessment ? `assessment-${entry.assessment}` : ''}`;
      
      // Format date
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
      
      // Get lesson name
      const lessonNum = entry.lessonId.replace('lesson_', '');
      const lessonName = `Lesson ${lessonNum}`;
      
      // Create the HTML
      entryCard.innerHTML = `
        <div class="entry-header">
          <div class="entry-meta">
            <span class="entry-lesson">${lessonName}</span>
            <span class="entry-date">${dateStr}</span>
          </div>
          <h3 class="entry-topic">${this.escapeHTML(entry.topic)}</h3>
        </div>
        <div class="entry-content">
          <div class="entry-code">
            <h4>Code Example:</h4>
            <pre><code>${this.escapeHTML(entry.code)}</code></pre>
          </div>
          <div class="entry-explanation">
            <h4>Explanation:</h4>
            <p>${this.escapeHTML(entry.explanation)}</p>
          </div>
          ${entry.feedback ? `
            <div class="entry-feedback">
              <h4>Feedback:</h4>
              <div class="assessment-badge ${entry.assessment}">${entry.assessment}</div>
              <p>${this.escapeHTML(entry.feedback)}</p>
            </div>
          ` : ''}
        </div>
      `;
      
      entriesList.appendChild(entryCard);
    });
    
    container.appendChild(entriesList);
  }

  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private showError(message: string): void {
    const container = document.getElementById('entries-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
      </div>
    `;
  }
}

// Initialize the controller
const controller = new LearningEntriesController();
export default controller;