
export interface TokenRange {
  start: number;
  end: number;
  type: 'self' | 'dependency' | 'other-known' | 'text' | 'primitive' | 'import-source' | 'string' | 'comment';
  text: string;
}

export type SegmentType = 'text' | 'self' | 'token' | 'primitive' | 'import-source' | 'string' | 'comment' | 'directive-if' | 'directive-for' | 'directive-else' | 'directive-else-if';

export interface LineSegment {
    text: string;
    type: SegmentType;
    tokenId?: string; // Valid only if type is 'token', 'self', or 'import-source'
}

export interface ProcessedLine {
    num: number;
    segments: LineSegment[];
    hasInput: boolean;
}
