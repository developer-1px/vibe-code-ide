
import { VariableNode } from '../model/types';

export const getNodeBorderColor = (type: VariableNode['type']): string => {
    switch (type) {
        case 'template': return 'border-pink-500/50 shadow-pink-900/20';
        case 'computed': return 'border-vibe-accent/50 shadow-blue-900/20';
        case 'ref': return 'border-emerald-500/50 shadow-emerald-900/20';
        case 'call': return 'border-yellow-500/50 shadow-yellow-900/20';
        case 'module': return 'border-orange-500/50 shadow-orange-900/20';
        default: return 'border-vibe-border shadow-black/20';
    }
};

export const getTokenStyle = (isActive: boolean) => {
    return isActive
        ? 'bg-vibe-accent/20 border-vibe-accent text-vibe-accent shadow-[0_0_8px_rgba(56,189,248,0.4)]'
        : 'bg-slate-800/50 border-slate-700 text-blue-300 hover:bg-white/10 hover:border-vibe-accent/50';
};
