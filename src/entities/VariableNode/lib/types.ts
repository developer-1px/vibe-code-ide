
export interface TokenRange {
  start: number;
  end: number;
  type: 'self' | 'dependency' | 'other-known' | 'text' | 'primitive';
  text: string;
}

export type SegmentType = 'text' | 'self' | 'token' | 'primitive';

export interface LineSegment {
    text: string;
    type: SegmentType;
    tokenId?: string; // Valid only if type is 'token' or 'self'
}

export interface ProcessedLine {
    num: number;
    segments: LineSegment[];
    hasInput: boolean;
}
