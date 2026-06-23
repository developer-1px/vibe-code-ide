export const getTokenStyle = (isActive: boolean, isComponent: boolean = false) => {
  if (isActive) {
    return isComponent
      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
      : 'bg-vibe-accent/20 border-vibe-accent text-vibe-accent shadow-[0_0_8px_rgba(56,189,248,0.4)]';
  }

  return isComponent
    ? 'bg-slate-800/50 text-emerald-300 hover:bg-white/10 hover:border-emerald-500/50'
    : 'bg-slate-800/50 text-blue-300';
};

export const getSlotColor = (nodeType: string): string => {
  switch (nodeType) {
    case 'pure-function':
      return 'bg-cyan-500/60 border-cyan-400/80 shadow-cyan-500/30 group-hover/line:border-cyan-300';
    case 'immutable-data':
      return 'bg-blue-500/60 border-blue-400/80 shadow-blue-500/30 group-hover/line:border-blue-300';
    case 'computed':
      return 'bg-sky-500/60 border-sky-400/80 shadow-sky-500/30 group-hover/line:border-sky-300';
    case 'ref':
      return 'bg-emerald-500/60 border-emerald-400/80 shadow-emerald-500/30 group-hover/line:border-emerald-300';
    case 'state-ref':
      return 'bg-amber-500/60 border-amber-400/80 shadow-amber-500/30 group-hover/line:border-amber-300';
    case 'state-action':
      return 'bg-orange-500/60 border-orange-400/80 shadow-orange-500/30 group-hover/line:border-orange-300';
    case 'mutable-ref':
      return 'bg-yellow-500/60 border-yellow-400/80 shadow-yellow-500/30 group-hover/line:border-yellow-300';
    case 'effect-action':
      return 'bg-red-500/60 border-red-400/80 shadow-red-500/30 group-hover/line:border-red-300';
    case 'hook':
      return 'bg-violet-500/60 border-violet-400/80 shadow-violet-500/30 group-hover/line:border-violet-300';
    case 'function':
      return 'bg-amber-500/60 border-amber-400/80 shadow-amber-500/30 group-hover/line:border-amber-300';
    case 'template':
      return 'bg-fuchsia-500/60 border-fuchsia-400/80 shadow-fuchsia-500/30 group-hover/line:border-fuchsia-300';
    case 'call':
      return 'bg-yellow-500/60 border-yellow-400/80 shadow-yellow-500/30 group-hover/line:border-yellow-300';
    default:
      return 'bg-slate-500/60 border-slate-400/80 shadow-slate-500/30 group-hover/line:border-slate-300';
  }
};
