// src/contexts/PyodideContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
  ReactNode,
} from "react";

// Assuming you have basic types defined in src/types/pyodide.d.ts
// If not, replace PyodideInterface with 'any' for now.
import type { PyodideInterface } from "../types/pyodide";

// Define the shape of the context value that components will consume
interface PyodideContextType {
  pyodide: PyodideInterface | null; // The loaded Pyodide instance
  isLoading: boolean; // True while initializing OR if not started
  isInitializing: boolean; // True only during the async initialization phase
  error: Error | null; // Holds any initialization error
  runPythonCode: (
    code: string
  ) => Promise<{ output: string; error: string | null; result: any }>;
  loadPackages: (packages: string[]) => Promise<void>; // Function to load packages
}

// Create the actual React Context
const PyodideContext = createContext<PyodideContextType | undefined>(undefined);

// --- Provider Component ---
// This component will wrap parts of your app that need access to Pyodide
interface PyodideProviderProps {
  children: ReactNode;
}

export const PyodideProvider: React.FC<PyodideProviderProps> = ({
  children,
}) => {
  // State for the Pyodide instance itself
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  // Overall loading state (true initially until ready or error)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Specific state to track if the async initialization is currently running
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  // State to hold any initialization error
  const [error, setError] = useState<Error | null>(null);
  // Ref to prevent multiple concurrent initialization attempts
  const initPromise = useRef<Promise<PyodideInterface> | null>(null);

  // Function to dynamically load the Pyodide script from CDN if not already present
  const loadPyodideScript = useCallback((): Promise<void> => {
    // Check if script tag already exists or if loadPyodide is already on window
    if (
      document.getElementById("pyodide-script") ||
      typeof window.loadPyodide === "function"
    ) {
      // console.log("Pyodide script already loaded or function exists.");
      return Promise.resolve();
    }
    // Return a promise that resolves when the script's onload fires, or rejects on error
    return new Promise((resolve, reject) => {
      console.log("Creating Pyodide script element...");
      const script = document.createElement("script");
      script.id = "pyodide-script";
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"; // Use a specific, stable version
      script.async = true;
      script.onload = () => {
        console.log("Pyodide script 'onload' event fired.");
        // Double check right after onload
        if (typeof window.loadPyodide === "function") {
          console.log("window.loadPyodide IS available inside onload.");
          resolve();
        } else {
          console.error(
            "window.loadPyodide NOT available inside onload! Script likely failed execution or is blocked."
          );
          reject(
            new Error(
              "window.loadPyodide not defined immediately after script onload"
            )
          );
        }
      };
      script.onerror = (err) => {
        console.error("Pyodide script 'onerror' event fired:", err);
        reject(
          new Error(
            "Failed to load Pyodide script element (check network, CORS, CDN status)"
          )
        );
      };
      document.head.appendChild(script);
      console.log("Appended Pyodide script to head.");
    });
  }, []); // Empty dependency array - this function doesn't change

  // useEffect hook to perform the initialization once on component mount
  useEffect(() => {
    // Prevent initialization if already loaded, already initializing, or promise ref exists
    if (pyodide || isInitializing || initPromise.current) {
      if (pyodide && isLoading) setIsLoading(false); // Ensure loading is false if already loaded
      // console.log("Skipping initialization:", { hasPyodide: !!pyodide, isInitializing, hasPromise: !!initPromise.current });
      return;
    }

    const initialize = async () => {
      setIsLoading(true); // Set overall loading true
      setIsInitializing(true); // Set specific initializing true
      setError(null); // Clear previous errors before attempt
      console.log("Starting Pyodide initialization sequence...");

      // Store the promise in the ref immediately to block concurrent runs
      initPromise.current = loadPyodideScript().then(() => {
        if (typeof window.loadPyodide !== "function") {
          throw new Error(
            "window.loadPyodide is not available after loading script."
          );
        }
        console.log("Calling window.loadPyodide()...");
        return window.loadPyodide({
          indexURL: `https://cdn.jsdelivr.net/pyodide/v0.25.0/full/`,
        });
      });

      try {
        const pyodideInstance = await initPromise.current; // Await the promise stored in ref

        console.log(
          "Pyodide core initialized. Setting up default stdout/stderr..."
        );
        // You can set up default handlers or leave them for runPythonCode
        pyodideInstance.setStdout({
          batched: (msg) => console.log("Pyodide Default stdout:", msg),
        });
        pyodideInstance.setStderr({
          batched: (msg) => console.error("Pyodide Default stderr:", msg),
        });

        setPyodide(pyodideInstance); // Successfully loaded: set the instance
        setError(null); // Successfully loaded: clear any previous error
        console.log("Pyodide ready and error state cleared.");
      } catch (err) {
        console.error("Pyodide initialization failed:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Unknown Pyodide loading error")
        );
        setPyodide(null); // Ensure pyodide instance is null on error
      } finally {
        setIsLoading(false); // Finished loading (success or fail)
        setIsInitializing(false); // No longer in the async init phase
        initPromise.current = null; // Clear the promise ref
        console.log("Pyodide initialization sequence finished.");
      }
    };

    initialize();
  }, [loadPyodideScript, pyodide, isInitializing]); // Include dependencies used inside effect

  const runPythonCode = useCallback(
    async (
      code: string
    ): Promise<{ output: string; error: string | null; result: any }> => {
      if (!pyodide || isInitializing) {
        const message = `Python environment is ${
          isInitializing ? "initializing" : "not ready"
        }. Please wait.`;
        console.warn(message);
        return { output: "", error: message, result: null };
      }

      // console.log("Running Python code via context...");
      let stdout = "";
      let stderr = "";
      let fullError = null;
      let result: any = null;

      try {
        // Temporarily redirect stdout/stderr for this specific run
        pyodide.setStdout({
          batched: (s: string) => {
            stdout += s + "\n";
          },
        });
        pyodide.setStderr({
          batched: (s: string) => {
            stderr += s + "\n";
          },
        });

        const resultProxy = await pyodide.runPythonAsync(code);

        if (resultProxy !== undefined) {
          result = resultProxy.toString();

          if (typeof resultProxy.destroy === "function") {
            resultProxy.destroy();
          }
        }
      } catch (err) {
        console.error("Error executing Python code:", err);
        // Capture the execution error itself in addition to stderr
        const errorMessage = err instanceof Error ? err.message : String(err);
        fullError = `${stderr}\nExecution Error: ${errorMessage}`;
        stderr = "";
      }

      return { output: stdout, error: fullError, result };
    },
    [pyodide, isInitializing]
  );

  // Function provided by context to load packages
  const loadPackages = useCallback(
    async (packages: string[]) => {
      if (!pyodide || isInitializing) {
        const message = `Python environment is ${
          isInitializing ? "initializing" : "not ready"
        }. Cannot load packages.`;
        console.warn(message);
        throw new Error(message);
      }
      if (!packages || packages.length === 0) {
        return; // Nothing to load
      }
      try {
        console.log(`Loading packages: ${packages.join(", ")}...`);
        // Show loading indicator?
        await pyodide.loadPackage(packages);
        console.log(`Packages [${packages.join(", ")}] loaded successfully.`);
      } catch (err) {
        console.error(`Error loading packages [${packages.join(", ")}]:`, err);
        // Rethrow or handle as needed
        throw err;
      } finally {
        // Hide loading indicator?
      }
    },
    [pyodide, isInitializing]
  ); // Dependencies for useCallback

  // The value provided to consuming components
  const value: PyodideContextType = {
    pyodide,
    isLoading: isLoading || isInitializing, // Combine for a simple loading check
    isInitializing, // Provide specific state if needed
    error,
    runPythonCode,
    loadPackages,
  };

  return (
    <PyodideContext.Provider value={value}>
      {/* You could add a global loading overlay here if desired, using isLoading */}
      {/* {isLoading && <div className="global-pyodide-loading">Loading Python Environment...</div>} */}
      {children}
    </PyodideContext.Provider>
  );
};

// --- Custom Hook ---
// Hook for components to easily access the Pyodide context
export const usePyodide = (): PyodideContextType => {
  const context = useContext(PyodideContext);
  if (context === undefined) {
    // This error means you tried to use the hook outside of the provider
    throw new Error("usePyodide must be used within a PyodideProvider");
  }
  return context;
};
