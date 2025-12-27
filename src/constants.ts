
import { loadExampleFiles } from './utils/loadExamples'

// Load all files from examples and src folders automatically
export const DEFAULT_FILES = loadExampleFiles();

// Set default entry to the React example
export const DEFAULT_ENTRY_FILE = 'examples/react/App.tsx';
