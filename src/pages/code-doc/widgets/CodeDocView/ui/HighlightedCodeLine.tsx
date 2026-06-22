import { useEffect, useRef } from 'react';

interface HighlightJs {
  highlight: (code: string, options: { language: string }) => { value: string };
}

declare const hljs: HighlightJs | undefined;

export function HighlightedCodeLine({ line, lang }: { line: string; lang: string }) {
  const codeRef = useRef<HTMLElement>(null);
  const fallbackText = line || ' ';

  useEffect(() => {
    if (codeRef.current && typeof hljs !== 'undefined') {
      codeRef.current.innerHTML = hljs.highlight(fallbackText, { language: lang }).value;
    }
  }, [fallbackText, lang]);

  return (
    <code ref={codeRef} className={`language-${lang} bg-transparent p-0 block`}>
      {typeof hljs === 'undefined' ? fallbackText : undefined}
    </code>
  );
}
