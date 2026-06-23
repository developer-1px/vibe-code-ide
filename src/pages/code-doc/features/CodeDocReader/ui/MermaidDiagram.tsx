import mermaid from 'mermaid';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

export const MermaidDiagram: React.FC<{ chart: string; id: string }> = ({ chart, id }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) return;

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#eef2ff',
            primaryTextColor: '#1e293b',
            primaryBorderColor: '#cbd5e1',
            lineColor: '#64748b',
            secondaryColor: '#f8fafc',
            tertiaryColor: '#fff',
          },
          fontFamily: 'Inter, sans-serif',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
          },
        });

        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('[MermaidDiagram] Failed to render:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    renderChart();
  }, [chart, id]);

  useEffect(() => {
    if (containerRef.current && svg) {
      containerRef.current.innerHTML = svg;
    }
  }, [svg]);

  if (error) {
    return (
      <div className="my-8 p-6 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
        <strong>Mermaid Render Error:</strong> {error}
      </div>
    );
  }

  if (!svg) {
    return <div className="animate-pulse h-24 bg-gray-50 rounded-lg my-8"></div>;
  }

  return (
    <div
      ref={containerRef}
      className="my-8 p-6 bg-white border border-gray-100 rounded-lg shadow-sm flex justify-center overflow-x-auto custom-scrollbar"
    />
  );
};
