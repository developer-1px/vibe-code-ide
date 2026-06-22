import type React from 'react';
import { BlockType, type SymbolDetail } from '../model/types';
import { Icon } from './Icon';
import { MermaidDiagram } from './MermaidDiagram';
import { RichText } from './RichText';
import { TextbookCodeBlock } from './TextbookCodeBlock';

const getStartLine = (lineStr?: string): number => {
  if (!lineStr) return 1;
  const match = lineStr.match(/L?(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
};

export const SymbolSection: React.FC<{
  symbol: SymbolDetail;
  layout: 'linear' | 'split';
  goToDefinition?: (startLine: number) => void;
}> = ({ symbol, layout, goToDefinition }) => {
  let TypeIcon = 'info';
  if (symbol.type === 'function') TypeIcon = 'function';
  if (symbol.type === 'interface') TypeIcon = 'interface';
  if (symbol.type === 'class') TypeIcon = 'class';
  if (symbol.type === 'test-suite') TypeIcon = 'testSuite';
  if (symbol.type === 'test-case') TypeIcon = 'testCase';
  if (symbol.type === 'test-hook') TypeIcon = 'testHook';

  function handleDefinitionClick() {
    if (symbol.startLine && goToDefinition) {
      goToDefinition(symbol.startLine);
    }
  }

  function goToCodeLine(lineNumber: number) {
    if (goToDefinition) {
      goToDefinition(lineNumber);
    }
  }

  return (
    <section
      id={symbol.name}
      className={`mb-8 p-8 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow ${layout === 'split' ? 'grid grid-cols-12 gap-16' : ''}`}
    >
      <div className={`${layout === 'split' ? 'col-span-5' : ''}`}>
        <div className="mb-8">
          <div className="mb-2">
            <span className="font-sans text-2xs font-bold text-gray-400 uppercase tracking-widest">{symbol.type}</span>
          </div>

          <h3
            className={`text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 break-all leading-snug flex items-center gap-4 ${
              symbol.startLine ? 'cursor-pointer group' : ''
            }`}
            onClick={handleDefinitionClick}
            title={symbol.startLine ? `Go to line ${symbol.startLine}` : undefined}
          >
            <div className="flex-none p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-500 transition-colors">
              <Icon name={TypeIcon} className="w-6 h-6 stroke-1" />
            </div>
            <span className="group-hover:text-blue-600 transition-colors">{symbol.name}</span>
          </h3>

          <div
            className={`font-mono text-xs text-gray-500 mb-6 break-words bg-white border-l-2 border-gray-100 pl-3 py-1 ${
              symbol.startLine ? 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors' : ''
            }`}
            onClick={handleDefinitionClick}
            title={symbol.startLine ? `Go to line ${symbol.startLine}` : undefined}
          >
            {symbol.signature}
          </div>
        </div>

        {symbol.flowchart && (
          <div className="mb-10">
            <span className="block font-sans text-2xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Icon name="flow" className="w-3 h-3" />
              Logic Flow
            </span>
            <MermaidDiagram chart={symbol.flowchart} id={`flow-${symbol.name}`} />
          </div>
        )}

        <div className="prose-textbook text-gray-800 text-base leading-7 mb-10">
          <RichText content={symbol.description} />
        </div>

        {symbol.testMetadata && (
          <div className="mb-10 pt-6 border-t border-gray-100">
            <span className="block font-sans text-2xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Test Details
            </span>

            {symbol.testMetadata.url && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-sans text-xs font-bold text-gray-900">Target URL</span>
                </div>
                <div className="font-mono text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded border border-blue-100 break-all">
                  {symbol.testMetadata.url}
                </div>
              </div>
            )}

            {symbol.testMetadata.selectors && symbol.testMetadata.selectors.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-sans text-xs font-bold text-gray-900">Test Selectors</span>
                  <span className="font-mono text-2xs text-gray-400">({symbol.testMetadata.selectors.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {symbol.testMetadata.selectors.map((selector, i) => (
                    <span
                      key={i}
                      className="font-mono text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200"
                    >
                      {selector}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {symbol.testMetadata.expectations && symbol.testMetadata.expectations.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-sans text-xs font-bold text-gray-900">Assertions</span>
                  <span className="font-mono text-2xs text-gray-400">({symbol.testMetadata.expectations.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {symbol.testMetadata.expectations.map((expectation, i) => (
                    <span
                      key={i}
                      className="font-mono text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200"
                    >
                      expect(...).{expectation}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {((symbol.parameters?.length || 0) > 0 || symbol.returns) && (
          <div className="mb-10 pt-6 border-t border-gray-100">
            {symbol.parameters && symbol.parameters.length > 0 && (
              <div className="mb-6">
                <span className="block font-sans text-2xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Inputs
                </span>
                <ul className="space-y-4">
                  {symbol.parameters.map((p, i) => (
                    <li key={i} className="text-sm group">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">
                          {p.name}
                        </span>
                        <span className="font-mono text-2xs text-gray-400">{p.type}</span>
                      </div>
                      <div className="font-serif text-gray-600 mt-1.5 leading-relaxed">
                        <RichText content={p.description} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {symbol.returns && symbol.returns !== 'void' && (
              <div className="mt-6">
                <span className="block font-sans text-2xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Returns
                </span>
                <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded inline-block">
                  {symbol.returns}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`${layout === 'split' ? 'col-span-7 pt-2' : ''}`}>
        {symbol.blocks?.length > 0 ? (
          <div className="space-y-6">
            {(() => {
              const grouped: React.ReactNode[] = [];
              let proseGroup: typeof symbol.blocks = [];

              const flushProseGroup = () => {
                if (proseGroup.length > 0) {
                  grouped.push(
                    <div
                      key={`prose-${grouped.length}`}
                      className="font-serif text-gray-700 text-sm leading-6 my-4 pl-3 border-l-2 border-gray-200/60"
                    >
                      {proseGroup.map((block, i) => (
                        <RichText key={i} content={block.content} />
                      ))}
                    </div>
                  );
                  proseGroup = [];
                }
              };

              symbol.blocks.forEach((block, idx) => {
                if (block.type === BlockType.PROSE) {
                  proseGroup.push(block);
                  return;
                }

                flushProseGroup();

                if (block.type === BlockType.TAG) {
                  const label = block.label || 'NOTE';
                  const isSecurity = label.toUpperCase().includes('SECURITY');
                  const isWarning = label.toUpperCase().includes('WARNING') || label.toUpperCase().includes('FIXME');

                  let bgColor = 'bg-blue-50';
                  let textColor = 'text-blue-900';
                  let icon = 'info';

                  if (isSecurity) {
                    bgColor = 'bg-indigo-50';
                    textColor = 'text-indigo-900';
                    icon = 'tag';
                  }
                  if (isWarning) {
                    bgColor = 'bg-amber-50';
                    textColor = 'text-amber-900';
                    icon = 'tag';
                  }

                  grouped.push(
                    <div key={idx} className={`my-8 p-5 rounded-lg ${bgColor} ${textColor} flex gap-4`}>
                      <div className="flex-none pt-1 opacity-60">
                        <Icon name={icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-sans text-2xs font-bold uppercase tracking-widest mb-2 opacity-70">
                          {label}
                        </div>
                        <div className="font-serif text-base leading-relaxed">
                          <RichText content={block.content} />
                        </div>
                      </div>
                    </div>
                  );
                  return;
                }

                if (block.type === BlockType.BRANCH) {
                  grouped.push(
                    <div key={idx} className="mt-8 mb-4 pl-2 flex gap-4 items-start group">
                      <div className="flex-none pt-1">
                        <div className="text-gray-300 group-hover:text-indigo-500 transition-colors">
                          <Icon name="branch" className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <div className="font-sans text-xs font-bold text-gray-400 group-hover:text-indigo-600 uppercase tracking-wider mb-1 transition-colors">
                          {block.label || 'Branch'}
                        </div>
                        <div className="font-serif text-gray-800 font-medium text-base">
                          <RichText content={block.content} />
                        </div>
                      </div>
                    </div>
                  );
                  return;
                }

                if (block.type === BlockType.CODE) {
                  const startLine = getStartLine(block.lines);
                  grouped.push(
                    <div key={idx}>
                      <TextbookCodeBlock code={block.content} startLine={startLine} clickLine={goToCodeLine} />
                    </div>
                  );
                }
              });

              flushProseGroup();

              return grouped;
            })()}
          </div>
        ) : (
          <div className="bg-gray-50 p-12 text-center text-gray-400 font-serif rounded-lg">
            Implementation details are hidden or not available.
          </div>
        )}
      </div>
    </section>
  );
};
