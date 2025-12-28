
import { VariableNode } from '../model/types.ts';

export const getNodeBorderColor = (type: VariableNode['type']): string => {
    switch (type) {
        case 'template': return 'border-fuchsia-500/50 shadow-fuchsia-900/20'; // View/Component (Stronger Purple/Pink)
        case 'computed': return 'border-vibe-accent/50 shadow-blue-900/20';
        case 'ref': return 'border-emerald-500/50 shadow-emerald-900/20';
        case 'call': return 'border-yellow-500/50 shadow-yellow-900/20';
        case 'module': return 'border-indigo-500/50 shadow-indigo-900/20'; // Imported Component/Module (Distinct Indigo)
        case 'function': return 'border-amber-500/50 shadow-amber-900/20';
        case 'pure-function': return 'border-cyan-500/50 shadow-cyan-900/20'; // Pure Function (Cyan - clean and deterministic)
        default: return 'border-vibe-border shadow-black/20';
    }
};

export const getTokenStyle = (isActive: boolean, isComponent: boolean = false) => {
    if (isActive) {
        return isComponent
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]' // Component Active (Green)
            : 'bg-vibe-accent/20 border-vibe-accent text-vibe-accent shadow-[0_0_8px_rgba(56,189,248,0.4)]'; // Variable Active (Blue)
    }
    
    // Inactive State
    return isComponent
        ? 'bg-slate-800/50 border-slate-700 text-emerald-300 hover:bg-white/10 hover:border-emerald-500/50' // Component Inactive
        : 'bg-slate-800/50 border-slate-700 text-blue-300 hover:bg-white/10 hover:border-vibe-accent/50'; // Variable Inactive
};

export const getSlotColor = (type: VariableNode['type']): string => {
    switch (type) {
        case 'template':
            return 'bg-fuchsia-500/60 border-fuchsia-400/80 shadow-fuchsia-500/30 group-hover/line:border-fuchsia-300';
        case 'computed':
            return 'bg-sky-500/60 border-sky-400/80 shadow-sky-500/30 group-hover/line:border-sky-300';
        case 'ref':
            return 'bg-emerald-500/60 border-emerald-400/80 shadow-emerald-500/30 group-hover/line:border-emerald-300';
        case 'call':
            return 'bg-yellow-500/60 border-yellow-400/80 shadow-yellow-500/30 group-hover/line:border-yellow-300';
        case 'module':
            return 'bg-indigo-500/60 border-indigo-400/80 shadow-indigo-500/30 group-hover/line:border-indigo-300';
        case 'function':
            return 'bg-amber-500/60 border-amber-400/80 shadow-amber-500/30 group-hover/line:border-amber-300';
        case 'pure-function':
            return 'bg-cyan-500/60 border-cyan-400/80 shadow-cyan-500/30 group-hover/line:border-cyan-300';
        case 'hook':
            return 'bg-violet-500/60 border-violet-400/80 shadow-violet-500/30 group-hover/line:border-violet-300';
        default:
            return 'bg-slate-500/60 border-slate-400/80 shadow-slate-500/30 group-hover/line:border-slate-300';
    }
};

export const getEdgeColor = (type: VariableNode['type']): string => {
    switch (type) {
        case 'template': return '#d946ef'; // fuchsia-500
        case 'computed': return '#0ea5e9'; // sky-500
        case 'ref': return '#10b981'; // emerald-500
        case 'call': return '#eab308'; // yellow-500
        case 'module': return '#6366f1'; // indigo-500
        case 'function': return '#f59e0b'; // amber-500
        case 'pure-function': return '#06b6d4'; // cyan-500
        case 'hook': return '#8b5cf6'; // violet-500
        case 'store': return '#14b8a6'; // teal-500
        default: return '#38bdf8'; // sky-400 (default blue)
    }
};
