/**
 * PageAnalysis - Dead Code Analysis 독립 페이지
 * 자체 Left/Right Panel을 가진 독립적인 레이아웃
 */

import { DeadCodePanel } from './DeadCodePanel/DeadCodePanel';

export function PageAnalysis() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* DeadCodePanel이 이미 자체 레이아웃을 가지고 있음 (Left Panel + Main Content) */}
      <DeadCodePanel />

      {/* 우측 패널은 필요 시 추가 가능 */}
      {/* 예: <AnalysisDetailsPanel /> */}
    </div>
  );
}
