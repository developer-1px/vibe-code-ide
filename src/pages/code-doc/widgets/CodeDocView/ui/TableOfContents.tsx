import type { SymbolDetail } from '../model/types';
import { Icon } from './Icon';

export const TableOfContents = ({ symbols }: { symbols: SymbolDetail[] }) => {
  const scrollToSymbol = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-64 flex-none hidden xl:block pl-8">
      <div className="fixed w-56 pt-12">
        <h4 className="font-sans text-2xs font-bold text-gray-400 uppercase tracking-widest mb-6">On This Page</h4>
        <ul className="space-y-3 relative border-l border-gray-200 ml-1">
          {symbols.map((s, i) => {
            let icon = 'info';
            if (s.type === 'function') icon = 'function';
            if (s.type === 'interface') icon = 'interface';
            if (s.type === 'class') icon = 'class';
            if (s.type === 'test-suite') icon = 'testSuite';
            if (s.type === 'test-case') icon = 'testCase';
            if (s.type === 'test-hook') icon = 'testHook';

            return (
              <li
                key={i}
                className="-ml-[1px] pl-4 border-l border-transparent hover:border-gray-400 transition-colors"
              >
                <button
                  onClick={() => scrollToSymbol(s.name)}
                  className="text-left group flex items-start gap-2 w-full"
                >
                  <span className="flex-none pt-0.5 text-gray-300 group-hover:text-gray-500 transition-colors">
                    <Icon name={icon} className="w-3 h-3" />
                  </span>
                  <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900 transition-colors leading-snug break-all">
                    {s.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
