import type { SymbolDetail } from '../model/types';
import { Icon } from './Icon';

interface TableOfContentsItemProps {
  symbol: SymbolDetail;
  onSelectSymbol: (symbolName: string) => void;
}

function getSymbolIcon(symbol: SymbolDetail) {
  if (symbol.type === 'function') return 'function';
  if (symbol.type === 'interface') return 'interface';
  if (symbol.type === 'class') return 'class';
  if (symbol.type === 'test-suite') return 'testSuite';
  if (symbol.type === 'test-case') return 'testCase';
  if (symbol.type === 'test-hook') return 'testHook';
  return 'info';
}

function TableOfContentsItem({ symbol, onSelectSymbol }: TableOfContentsItemProps) {
  const icon = getSymbolIcon(symbol);

  function handleClick() {
    onSelectSymbol(symbol.name);
  }

  return (
    <li className="-ml-[1px] pl-4 border-l border-transparent hover:border-gray-400 transition-colors">
      <button onClick={handleClick} className="text-left group flex items-start gap-2 w-full">
        <span className="flex-none pt-0.5 text-gray-300 group-hover:text-gray-500 transition-colors">
          <Icon name={icon} className="w-3 h-3" />
        </span>
        <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900 transition-colors leading-snug break-all">
          {symbol.name}
        </span>
      </button>
    </li>
  );
}

export const TableOfContents = ({ symbols }: { symbols: SymbolDetail[] }) => {
  function handleSelectSymbol(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="w-64 flex-none hidden xl:block pl-8">
      <div className="fixed w-56 pt-12">
        <h4 className="font-sans text-2xs font-bold text-gray-400 uppercase tracking-widest mb-6">On This Page</h4>
        <ul className="space-y-3 relative border-l border-gray-200 ml-1">
          {symbols.map((symbol) => (
            <TableOfContentsItem key={symbol.name} symbol={symbol} onSelectSymbol={handleSelectSymbol} />
          ))}
        </ul>
      </div>
    </div>
  );
};
