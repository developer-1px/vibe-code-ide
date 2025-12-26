
import { ProcessedLine, TokenRange, LineSegment } from './types';

export const processCodeLines = (
    codeSnippet: string,
    startLineNum: number,
    nodeId: string,
    dependencies: string[],
    tokenRanges: TokenRange[],
    isTemplate: boolean
): ProcessedLine[] => {
    const rawLines = codeSnippet.split('\n');
    
    // --- Strategy A: Template Processing (Regex-based) ---
    if (isTemplate) {
        const depNames = dependencies.map(d => d.split('::').pop() || '').filter(Boolean);
        
        if (depNames.length === 0) {
            return rawLines.map((line, idx) => ({
                num: startLineNum + idx,
                segments: [{ text: line, type: 'text' }],
                hasInput: false
            }));
        }

        const pattern = new RegExp(`(?<![a-zA-Z0-9_$])(${depNames.map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![a-zA-Z0-9_$])`, 'g');

        return rawLines.map((line, idx) => {
            const parts = line.split(pattern);
            const segments: LineSegment[] = [];
            let hasInput = false;

            parts.forEach((part) => {
                const matchedDepFullId = dependencies.find(d => d.endsWith(`::${part}`));
                if (matchedDepFullId) {
                    hasInput = true;
                    segments.push({ text: part, type: 'token', tokenId: matchedDepFullId });
                } else {
                    if (part) segments.push({ text: part, type: 'text' });
                }
            });

            return {
                num: startLineNum + idx,
                segments,
                hasInput
            };
        });
    }

    // --- Strategy B: Script Processing (AST Token-based) ---
    let currentGlobalIndex = 0;

    return rawLines.map((lineContent, lineIdx) => {
        const lineStartIdx = currentGlobalIndex;
        const lineEndIdx = lineStartIdx + lineContent.length;
        const currentLineNum = startLineNum + lineIdx;
        currentGlobalIndex = lineEndIdx + 1; // +1 for newline

        const lineTokens = tokenRanges.filter(t => t.start >= lineStartIdx && t.start < lineEndIdx);
        let hasInputDeps = false;
        const segments: LineSegment[] = [];
        let cursor = lineStartIdx;

        lineTokens.forEach((token) => {
            // Text before token
            if (token.start > cursor) {
                segments.push({
                    text: codeSnippet.slice(cursor, token.start),
                    type: 'text'
                });
            }

            const isSelf = token.type === 'self';
            const fullDepId = isSelf ? nodeId : dependencies.find(d => d.endsWith(`::${token.text}`));

            if (token.type === 'dependency') hasInputDeps = true;

            segments.push({
                text: token.text,
                type: isSelf ? 'self' : 'token',
                tokenId: fullDepId // Can be undefined if logic fails, handled in UI
            });

            cursor = token.end;
        });

        // Trailing text
        if (cursor < lineEndIdx) {
            segments.push({
                text: codeSnippet.slice(cursor, lineEndIdx),
                type: 'text'
            });
        }

        // If line was empty or just pure text with no tokens processed via cursor
        if (segments.length === 0 && lineContent.length > 0) {
             segments.push({ text: lineContent, type: 'text' });
        }

        return {
            num: currentLineNum,
            segments,
            hasInput: hasInputDeps
        };
    });
};
