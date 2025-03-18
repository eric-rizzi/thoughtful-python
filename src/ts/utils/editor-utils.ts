/**
 * Utility functions for working with code editors in the lessons
 */

declare global {
  interface Window {
    CodeMirror: any;
  }
}

/**
 * Initializes code editors on the page
 * @returns Map of editor ID to CodeMirror editor instance
 */
export function initializeCodeEditors(): Map<string, any> {
  const codeEditors = new Map<string, any>();
  
  // Find all code editor elements
  const editorElements = document.querySelectorAll('.code-editor');
  
  editorElements.forEach(element => {
    const id = element.id;
    
    if (!id) {
      console.warn('Code editor element is missing an ID attribute');
      return;
    }
    
    try {
      // Check if CodeMirror is available
      if (window.CodeMirror) {
        const editor = window.CodeMirror.fromTextArea(element as HTMLTextAreaElement, {
          mode: 'python',
          theme: 'default',
          lineNumbers: true,
          indentUnit: 4,
          tabSize: 4,
          indentWithTabs: false,
          lineWrapping: true,
          extraKeys: {
            Tab: (cm: any) => {
              if (cm.somethingSelected()) {
                cm.indentSelection('add');
              } else {
                cm.replaceSelection('    ', 'end');
              }
            }
          }
        });
        
        codeEditors.set(id, editor);
      } else {
        console.warn('CodeMirror not available, falling back to basic textarea');
      }
    } catch (error) {
      console.error(`Failed to initialize code editor ${id}:`, error);
    }
  });
  
  return codeEditors;
}

/**
 * Gets code from an editor by ID
 * @param editorId - The ID of the editor element
 * @param codeEditors - Map of editor instances
 * @returns The code from the editor or null if not found
 */
export function getCodeFromEditor(editorId: string, codeEditors: Map<string, any>): string | null {
  const cmEditor = codeEditors.get(editorId);
  
  if (cmEditor) {
    // Using CodeMirror
    return cmEditor.getValue();
  } else {
    // Fallback to regular textarea
    const editorElement = document.getElementById(editorId) as HTMLTextAreaElement;
    if (!editorElement) {
      console.error(`Could not find editor element: ${editorId}`);
      return null;
    }
    return editorElement.value;
  }
}

/**
 * Updates button state during code execution
 * @param button - The button element
 * @param isLoading - Whether the button should show loading state
 * @param loadingText - Text to display while loading (default: "Running...")
 */
export function updateButtonState(
  button: HTMLElement, 
  isLoading: boolean, 
  loadingText: string = 'Running...'
): void {
  if (isLoading) {
    button.setAttribute('disabled', 'true');
    button.dataset.originalText = button.textContent || '';
    button.textContent = loadingText;
  } else {
    button.removeAttribute('disabled');
    button.textContent = button.dataset.originalText || button.textContent || '';
  }
}