import React from 'react';
import { Icon } from './Icon';

export const Breadcrumb = ({ path, filename }: { path: string; filename: string }) => {
  const segments = path.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-[11px] font-sans font-medium text-gray-400 tracking-wider mb-8">
      <div className="flex items-center gap-1 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
        <Icon name="home" className="w-3 h-3" />
        <span>Home</span>
      </div>
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          <Icon name="chevronRight" className="w-3 h-3 text-gray-300" />
          <span className="hover:text-gray-600 cursor-pointer transition-colors">{seg}</span>
        </React.Fragment>
      ))}
      <Icon name="chevronRight" className="w-3 h-3 text-gray-300" />
      <span className="text-gray-900 font-bold">{filename}</span>
    </nav>
  );
};
