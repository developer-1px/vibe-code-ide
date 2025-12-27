
export interface TokenRange {
  start: number;
  end: number;
  type: 'self' | 'dependency' | 'other-known' | 'text' | 'primitive' | 'import-source' | 'string';
  text: string;
}

export type SegmentType = 'text' | 'self' | 'token' | 'primitive' | 'import-source' | 'string';

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
