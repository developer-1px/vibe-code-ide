import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { filesAtom, entryFileAtom, graphDataAtom, parseErrorAtom } from '../store/atoms';
import { parseProject } from '../services/codeParser';

/**
 * Hook to read graph data and parse error from atoms
 * Can be used anywhere in the app to access parsed graph data
 */
export const useGraphData = () => {
  const data = useAtomValue(graphDataAtom);
  const error = useAtomValue(parseErrorAtom);

  return { data, error };
};

/**
 * Hook to initialize graph data parsing
 * Should only be called once at the app root (App.tsx)
 */
export const useGraphDataInit = () => {
  // Read atoms
  const files = useAtomValue(filesAtom);
  const entryFile = useAtomValue(entryFileAtom);

  // Write atoms
  const setGraphData = useSetAtom(graphDataAtom);
  const setParseError = useSetAtom(parseErrorAtom);

  // Parse project on file change and store in atom
  useEffect(() => {
    try {
      const parsedData = parseProject(files, entryFile);
      setParseError(null);
      setGraphData(parsedData);
    } catch (e: any) {
      console.warn("Project Parse Error:", e);
      setParseError(e.message || "Syntax Error");
      // Keep previous valid data in atom on error
    }
  }, [files, entryFile, setGraphData, setParseError]);
};
