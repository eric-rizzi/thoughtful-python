// pyodide.ts - Handles Python code execution in the browser
import type { PyodideInterface } from 'pyodide';

// Define a type for the global loadPyodide function that will be loaded from CDN
declare global {
  interface Window {
    loadPyodide: (config: any) => Promise<PyodideInterface>;
  }
}

class PythonRunner {
  private pyodide: PyodideInterface | null = null;
  private isLoading: boolean = false;
  private loadPromise: Promise<PyodideInterface> | null = null;

  // Initialize Pyodide
  async initialize(): Promise<PyodideInterface> {
    if (this.pyodide) {
      return this.pyodide;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.showLoadingIndicator();

    // Load Pyodide script if it hasn't been loaded yet
    if (typeof window.loadPyodide !== 'function') {
      await this.loadPyodideScript();
    }

    this.loadPromise = window.loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v0.25.0/full/`,
    });

    try {
      this.pyodide = await this.loadPromise;
      this.isLoading = false;
      this.hideLoadingIndicator();
      return this.pyodide;
    } catch (error) {
      this.isLoading = false;
      this.hideLoadingIndicator();
      console.error("Failed to load Pyodide:", error);
      throw error;
    }
  }

  // Load the Pyodide script from CDN
  private loadPyodideScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));
      document.head.appendChild(script);
    });
  }

  // Run Python code and return the output
  async runCode(code: string): Promise<string> {
    try {
      const pyodide = await this.initialize();
      
      // Capture stdout
      let output = '';
      
      // Set stdout to capture output
      pyodide.setStdout({
        batched: (text: string) => {
          output += text + "\n";
        }
      });
      
      // Run the code
      await pyodide.runPythonAsync(code);
      return output;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  private showLoadingIndicator(): void {
    const loadingElement = document.getElementById('pyodide-loading');
    if (loadingElement) {
      loadingElement.style.display = 'block';
    }
  }

  private hideLoadingIndicator(): void {
    const loadingElement = document.getElementById('pyodide-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }
}

// Singleton instance
export const pythonRunner = new PythonRunner();