// src/components/CodeEditor.tsx
import React, { useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark'; // Example theme

// Import other extensions if needed, e.g., for specific keymaps or features
// import { keymap } from '@codemirror/view';
// import { defaultKeymap } from '@codemirror/commands';

// Optional: Define custom styles for the wrapper if needed
// import styles from './CodeEditor.module.css';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string; // e.g., '200px', 'auto'
  minHeight?: string; // e.g., '100px'
  // Add other props for customization if needed (e.g., theme selection)
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  height = 'auto', // Default height to auto
  minHeight = '100px', // Default min height
}) => {
  // Use useCallback to prevent unnecessary re-creation of the onChange handler
  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange] // Dependency array includes the onChange prop
  );

  // Define extensions - start with Python language support
  const extensions = [python()];

  // Add other extensions as needed
  // e.g., extensions.push(keymap.of(defaultKeymap));

  return (
    // Optional: Add a wrapper div if needed for styling/layout
    // <div className={styles.editorWrapper}>
      <CodeMirror
        value={value}
        height={height}
        minHeight={minHeight}
        extensions={extensions}
        onChange={handleChange}
        readOnly={readOnly}
        theme={oneDark} // Apply the imported theme
        // You can add more props based on @uiw/react-codemirror documentation
        // e.g., basicSetup={{ lineNumbers: true, foldGutter: true, ... }}
        basicSetup={{ // Enable common features easily
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true, // Basic autocompletion
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            // defaultKeymap: true, // Often included, check if needed
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
         }}
      />
    // </div>
  );
};

export default CodeEditor;