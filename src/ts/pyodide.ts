// pyodide.ts - Handles Python code execution in the browser
import { loadPyodide } from 'pyodide';
import type { PyodideInterface } from 'pyodide';

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

    this.loadPromise = loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
    });

    try {
      this.pyodide = await this.loadPromise;
      this.isLoading = false;
      this.hideLoadingIndicator();
      console.log("Pyodide loaded successfully");
      return this.pyodide;
    } catch (error) {
      this.isLoading = false;
      this.hideLoadingIndicator();
      console.error("Failed to load Pyodide:", error);
      throw error;
    }
  }

  // Run Python code and return the output
  async runCode(code: string): Promise<string> {
    try {
      const pyodide = await this.initialize();
      
      // Capture stdout
      let output = '';
      pyodide.setStdout({
        batched: (text: string) => {
          output += text;
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