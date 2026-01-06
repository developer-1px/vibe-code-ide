import { ArrowDown, ArrowUp, GitBranch } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/components/lib/utils';
import { Indicator } from '@/components/ui/Indicator';

export interface StatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  branch?: string;
  ahead?: number;
  behind?: number;
  line?: number;
  column?: number;
  encoding?: string;
  language?: string;
  aiActive?: boolean;
  statusText?: string; // Custom status text (e.g., parsing progress)
}

const StatusBar = React.forwardRef<HTMLDivElement, StatusBarProps>(
  (
    {
      className,
      branch = 'main',
      ahead = 0,
      behind = 0,
      line = 1,
      column = 1,
      encoding = 'UTF-8',
      language = 'TS',
      aiActive = false,
      statusText,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-[var(--limn-statusbar-height)] items-center justify-between border-t px-3 text-xs text-text-secondary',
          'border-border-warm/30 bg-[rgba(255,200,150,0.08)]',
          className
        )}
        {...props}
      >
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {/* Custom status text (parsing progress, etc.) */}
          {statusText && (
            <div className="flex items-center gap-1 text-warm-400 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-warm-400 animate-pulse" />
              <span>{statusText}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <GitBranch size={11} className="text-text-muted" strokeWidth={1.5} />
            <span>{branch}</span>
            {(ahead > 0 || behind > 0) && (
              <div className="flex items-center gap-0.5 text-2xs">
                {ahead > 0 && (
                  <span className="flex items-center">
                    <ArrowUp size={9} />
                    {ahead}
                  </span>
                )}
                {behind > 0 && (
                  <span className="flex items-center">
                    <ArrowDown size={9} />
                    {behind}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <span>
            Ln {line}, Col {column}
          </span>
          <span>{encoding}</span>
          <span>{language}</span>
          {aiActive && (
            <div className="flex items-center gap-1">
              <Indicator variant="working" />
              <span className="text-warm-300">AI</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);
StatusBar.displayName = 'StatusBar';

export { StatusBar };
