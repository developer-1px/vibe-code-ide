
import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import PipelineCanvas from './widgets/PipelineCanvas.tsx';
import { parseProject } from './services/codeParser.ts';
import { filesAtom, entryFileAtom, isSidebarOpenAtom, graphDataAtom, parseErrorAtom } from './store/atoms';

const App: React.FC = () => {
  const [files] = useAtom(filesAtom);
  const [entryFile] = useAtom(entryFileAtom);
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom);
  const [, setGraphData] = useAtom(graphDataAtom);
  const [, setParseError] = useAtom(parseErrorAtom);

  // Toggle Sidebar Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Parse project on file change and store in atom
  useEffect(() => {
    try {
      const data = parseProject(files, entryFile);
      setParseError(null);
      setGraphData(data);
    } catch (e: any) {
      console.warn("Project Parse Error:", e);
      setParseError(e.message || "Syntax Error");
      // Keep previous valid data in atom on error
    }
  }, [files, entryFile, setGraphData, setParseError]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-vibe-dark text-slate-200 font-sans">
      {/* Left Sidebar - Code Input */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 relative z-50 ${isSidebarOpen ? 'w-[400px]' : 'w-0'}`}
      >
        <div className="w-[400px] h-full">
          <Sidebar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a]">

        {/* Minimal Header */}
        <Header />

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <PipelineCanvas />
        </div>
      </div>
    </div>
  );
};

export default App;