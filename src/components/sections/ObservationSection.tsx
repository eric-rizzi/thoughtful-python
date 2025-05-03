// src/components/sections/ObservationSection.tsx (Modified Example)
import React, { useState } from 'react';
import type { LessonSection } from '../../types/data';
import styles from './Section.module.css';
import CodeEditor from '../CodeEditor'; // Import the new component
import { usePyodide } from '../../contexts/PyodideContext'; // Assuming Pyodide setup (Step 13)
import { escapeHTML } from '../../lib/pyodideUtils'; // Assuming helper exists

interface ObservationSectionProps {
  section: LessonSection;
}

const ObservationSection: React.FC<ObservationSectionProps> = ({ section }) => {
    // Pyodide state (adapt based on Step 13 implementation)
    const { runPythonCode, isLoading: isPyodideLoading, error: pyodideError } = usePyodide();

    // State for each example's code and output
    const [exampleStates, setExampleStates] = useState(() => {
        const initialState: { [key: string]: { code: string; output: string; isRunning: boolean } } = {};
        section.examples?.forEach(ex => {
            initialState[ex.id] = { code: ex.code, output: '', isRunning: false };
        });
        return initialState;
    });

    const handleCodeChange = (exampleId: string, newCode: string) => {
        setExampleStates(prev => ({
            ...prev,
            [exampleId]: { ...prev[exampleId], code: newCode }
        }));
    };

    const handleRunCode = async (exampleId: string) => {
        if (isPyodideLoading || pyodideError) {
            setExampleStates(prev => ({
                ...prev,
                [exampleId]: { ...prev[exampleId], output: 'Python environment not ready.' }
            }));
            return;
        }

        setExampleStates(prev => ({
            ...prev,
            [exampleId]: { ...prev[exampleId], output: 'Running...', isRunning: true }
        }));

        const codeToRun = exampleStates[exampleId].code;
        const result = await runPythonCode(codeToRun);

        setExampleStates(prev => ({
            ...prev,
            [exampleId]: {
                ...prev[exampleId],
                output: result.error ? `Error: ${result.error}` : (result.output || 'Code executed (no output).'),
                isRunning: false
            }
        }));

        // Mark section as completed after running an example (adjust logic as needed)
        // This might need to move to a central state management (Step 22/23)
        // markSectionCompleted(section.id, lessonId); // Need lessonId context here
    };

    return (
        <section id={section.id} className={styles.section}>
            <h2 className={styles.title}>{section.title}</h2>
            <div className={styles.content}>{section.content}</div>

            {section.examples?.map((example) => {
                const state = exampleStates[example.id];
                const canRun = !isPyodideLoading && !pyodideError && !state?.isRunning;

                return (
                    <div key={example.id} className={styles.example}> {/* Add example class if needed */}
                        <h3 className={styles.exampleTitle}>{example.title}</h3> {/* Use example specific styles */}
                        <p className={styles.exampleDescription}>{example.description}</p>
                        <CodeEditor
                            value={state?.code || ''}
                            onChange={(newCode) => handleCodeChange(example.id, newCode)}
                        />
                        <button
                            onClick={() => handleRunCode(example.id)}
                            disabled={!canRun}
                            // Add specific button styles if needed
                        >
                            {state?.isRunning ? 'Running...' : 'Run Code'}
                        </button>
                        {/* Display Loading/Error specific to Pyodide */}
                        {isPyodideLoading && <p><i>Initializing Python...</i></p>}
                        {pyodideError && <p style={{color: 'red'}}>Pyodide Error: {pyodideError.message}</p>}
                        {/* Display Output */}
                        {state?.output && (
                             <pre className={styles.codeOutput} /* Add output class */ >
                                {escapeHTML(state.output)}
                             </pre>
                        )}
                    </div>
                );
            })}
        </section>
    );
};

export default ObservationSection;