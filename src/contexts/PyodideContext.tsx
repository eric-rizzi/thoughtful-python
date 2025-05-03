// src/contexts/PyodideContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  ReactNode,
  useRef
} from 'react';
import type { PyodideInterface } from '../types/pyodide'; // Import the basic type

// Define the shape of the context value
interface PyodideContextType {
  pyodide: PyodideInterface | null;
  isLoading: boolean;
  isInitializing: boolean; // More specific loading state
  error: Error | null;
  runPythonCode: (code: string) => Promise<{ output: string; error: string | null }>;
  loadPackages: (packages: string[]) => Promise<void>; // Example: Add package loading
}

// Create the context with a default undefined value
const PyodideContext = createContext<PyodideContextType | undefined>(undefined);

// Create the Provider component
interface PyodideProviderProps {
  children: ReactNode;
}

export const PyodideProvider: React.FC<PyodideProviderProps> = ({ children }) => {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // General loading state
  const [isInitializing, setIsInitializing] = useState<boolean>(false); // Specific init state
  const [error, setError] = useState<Error | null>(null);
  const initPromise = useRef<Promise<PyodideInterface> | null>(null); // Prevent double init

  // Function to load Pyodide script dynamically
  const loadPyodideScript = useCallback((): Promise<void> => {
    if (document.getElementById('pyodide-script') || typeof window.loadPyodide === 'function') {
      return Promise.resolve(); // Already loaded or loading
    }
    return new Promise((resolve, reject) => {
      console.log("Loading Pyodide script from CDN...");
      const script = document.createElement('script');
      script.id = 'pyodide-script';
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js'; // Lock version
      script.async = true;
      script.onload = () => {
          console.log("Pyodide script loaded.");
          resolve();
      };
      script.onerror = () => {
          console.error("Failed to load Pyodide script.");
          reject(new Error('Failed to load Pyodide script'));
      };
      document.head.appendChild(script);
    });
  }, []);


  // Effect to initialize Pyodide once on mount
  useEffect(() => {
    // Prevent running if already initializing or loaded
    if (pyodide || isInitializing || initPromise.current) {
        setIsLoading(false); // If pyodide exists, we are not loading
        return;
    }

    const initialize = async () => {
        setIsLoading(true);
        setIsInitializing(true);
        setError(null);
        console.log("Starting Pyodide initialization...");

        try {
            await loadPyodideScript(); // Ensure script is loaded
            if (typeof window.loadPyodide !== 'function') {
                throw new Error("window.loadPyodide is not available after loading script.");
            }

            console.log("Calling window.loadPyodide()...");
            // Store the promise to prevent re-entry
            initPromise.current = window.loadPyodide({
                indexURL: `https://cdn.jsdelivr.net/pyodide/v0.25.0/full/`,
            });
            const pyodideInstance = await initPromise.current;

            console.log("Pyodide core initialized. Setting up stdout/stderr...");
            // Basic setup - can be enhanced
            pyodideInstance.setStdout({ batched: (msg) => console.log("Pyodide stdout:", msg) });
            pyodideInstance.setStderr({ batched: (msg) => console.error("Pyodide stderr:", msg) });

            console.log("Pyodide ready.");
            setPyodide(pyodideInstance);
        } catch (err) {
            console.error("Pyodide initialization failed:", err);
            setError(err instanceof Error ? err : new Error('Unknown Pyodide loading error'));
        } finally {
            setIsLoading(false);
            setIsInitializing(false);
            initPromise.current = null; // Clear the promise ref
        }
    };

    initialize();

    // No cleanup needed for this effect with the ref guard
  }, [loadPyodideScript, pyodide, isInitializing]); // Dependencies

  // Function to run Python code
  const runPythonCode = useCallback(async (code: string): Promise<{ output: string; error: string | null }> => {
    if (!pyodide || isInitializing) {
      console.warn("Pyodide not ready, cannot run code yet.");
      return { output: '', error: "Python environment is not ready yet." };
    }

    console.log("Running Python code via context...");
    let stdout = '';
    let stderr = '';

    try {
      // Temporarily redirect stdout/stderr for this run
      pyodide.setStdout({ batched: (s: string) => { stdout += s + "\n"; } });
      pyodide.setStderr({ batched: (s: string) => { stderr += s + "\n"; } });

      await pyodide.runPythonAsync(code);

      // Restore default handlers (optional, depends if you set defaults)
      // pyodide.setStdout({ batched: (msg) => console.log("Pyodide stdout:", msg) });
      // pyodide.setStderr({ batched: (msg) => console.error("Pyodide stderr:", msg) });
      console.log("Python code finished.");

      return { output: stdout, error: stderr || null }; // Return captured output/error

    } catch (err) {
      console.error("Error executing Python code:", err);
       // Restore default handlers in case of error
      // pyodide.setStdout({ batched: (msg) => console.log("Pyodide stdout:", msg) });
      // pyodide.setStderr({ batched: (msg) => console.error("Pyodide stderr:", msg) });
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { output: stdout, error: `${stderr}\nExecution Error: ${errorMessage}` };
    }
  }, [pyodide, isInitializing]);

  // Example function to load packages
   const loadPackages = useCallback(async (packages: string[]) => {
       if (!pyodide || isInitializing) {
           console.warn("Pyodide not ready, cannot load packages yet.");
           throw new Error("Pyodide is not initialized yet.");
       }
       try {
           console.log(`Loading packages: ${packages.join(', ')}`);
           await pyodide.loadPackage(packages);
           console.log(`Packages loaded successfully.`);
       } catch (err) {
           console.error(`Error loading packages: ${packages.join(', ')}`, err);
           throw err; // Re-throw to be handled by caller
       }
   }, [pyodide, isInitializing]);

  // Value provided by the context
  const value = {
    pyodide,
    isLoading: isLoading || isInitializing, // Combined loading state
    isInitializing, // Specific init state if needed elsewhere
    error,
    runPythonCode,
    loadPackages, // Provide package loader
  };

  return (
    <PyodideContext.Provider value={value}>
      {children}
    </PyodideContext.Provider>
  );
};

// Custom hook to easily consume the context
export const usePyodide = (): PyodideContextType => {
  const context = useContext(PyodideContext);
  if (context === undefined) {
    throw new Error('usePyodide must be used within a PyodideProvider');
  }
  return context;
};