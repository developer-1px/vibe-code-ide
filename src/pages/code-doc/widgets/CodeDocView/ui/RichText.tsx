import type React from 'react';

interface ListItem {
  type: 'ul' | 'ol';
  indent: number;
  content: string;
  lineIdx: number;
}

interface ParsedLine {
  type: 'list' | 'header' | 'paragraph' | 'empty';
  data: ListItem | string;
  lineIdx: number;
}

export const RichText: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');

  // 1단계: 모든 라인을 파싱
  const parsedLines: ParsedLine[] = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      parsedLines.push({ type: 'empty', data: '', lineIdx: idx });
      return;
    }

    // 들여쓰기 수준 계산 (스페이스 2개 = 1 레벨)
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? Math.floor(indentMatch[1].length / 2) : 0;

    // Bullets: "- " or "* "
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)/);
    // Numbers: "1. " or "1) "
    const numberMatch = line.match(/^\s*\d+[.)]\s+(.*)/);

    if (bulletMatch) {
      parsedLines.push({
        type: 'list',
        data: { type: 'ul', indent, content: bulletMatch[1], lineIdx: idx },
        lineIdx: idx,
      });
    } else if (numberMatch) {
      parsedLines.push({
        type: 'list',
        data: { type: 'ol', indent, content: numberMatch[1], lineIdx: idx },
        lineIdx: idx,
      });
    } else if (trimmed.endsWith(':') && trimmed.length < 50 && !bulletMatch && !numberMatch) {
      // ✅ 헤더는 리스트가 아닐 때만 인식
      parsedLines.push({ type: 'header', data: trimmed, lineIdx: idx });
    } else {
      parsedLines.push({ type: 'paragraph', data: trimmed, lineIdx: idx });
    }
  });

  // 🔍 디버깅: 파싱 결과 출력
  if (content.includes('데이터 모델')) {
    console.log(
      '[RichText Debug] Parsed lines:',
      parsedLines.map((p) => ({
        type: p.type,
        data: typeof p.data === 'string' ? p.data : (p.data as ListItem).content,
        line: p.lineIdx,
      }))
    );
  }

  // 2단계: 재귀적으로 nested list 렌더링
  const renderListItems = (items: ListItem[], startIdx: number, parentIndent: number): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let i = startIdx;

    while (i < items.length) {
      const item = items[i];

      // 상위 레벨로 돌아감
      if (item.indent < parentIndent) {
        break;
      }

      // 같은 레벨 항목 처리
      if (item.indent === parentIndent) {
        // 다음 항목들 중 더 깊은 indent가 있는지 확인 (nested list)
        const nextIdx = i + 1;
        let hasNested = false;
        const nestedItems: ListItem[] = [];

        if (nextIdx < items.length && items[nextIdx].indent > parentIndent) {
          hasNested = true;
          // 같은 nested group 수집
          let j = nextIdx;
          while (j < items.length && items[j].indent > parentIndent) {
            nestedItems.push(items[j]);
            j++;
          }
          i = j - 1; // 외부 루프에서 i++되므로 j-1
        }

        result.push(
          <li key={`li-${item.lineIdx}`} className="pl-1 leading-7">
            {item.content}
            {hasNested && <RenderNestedList items={nestedItems} parentIndent={parentIndent} />}
          </li>
        );
      }

      i++;
    }

    return result;
  };

  const RenderNestedList: React.FC<{ items: ListItem[]; parentIndent: number }> = ({ items, parentIndent }) => {
    const groups: { type: 'ul' | 'ol'; items: ListItem[] }[] = [];
    let currentGroup: ListItem[] = [];
    let currentType: 'ul' | 'ol' | null = null;

    items.forEach((item) => {
      if (currentType === null) {
        currentType = item.type;
        currentGroup = [item];
      } else if (item.type === currentType && item.indent === parentIndent + 1) {
        currentGroup.push(item);
      } else {
        // 타입이 바뀌거나 indent가 변함
        if (currentGroup.length > 0) {
          groups.push({ type: currentType, items: currentGroup });
        }
        currentType = item.type;
        currentGroup = [item];
      }
    });

    if (currentGroup.length > 0 && currentType) {
      groups.push({ type: currentType, items: currentGroup });
    }

    return (
      <>
        {groups.map((group, gIdx) => {
          const ListTag = group.type === 'ol' ? 'ol' : 'ul';
          return (
            <ListTag
              key={`nested-${gIdx}`}
              className={`pl-5 mt-1 mb-1 space-y-1 ${group.type === 'ol' ? 'list-decimal' : 'list-disc'} marker:text-gray-300 text-gray-700`}
            >
              {renderListItems(group.items, 0, parentIndent + 1)}
            </ListTag>
          );
        })}
      </>
    );
  };

  // 3단계: 최종 렌더링
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < parsedLines.length) {
    const parsed = parsedLines[i];

    if (parsed.type === 'empty') {
      i++;
      continue;
    }

    if (parsed.type === 'list') {
      // ✅ 모든 연속된 list 항목들을 수집 (타입별로 그룹화는 나중에)
      const allListItems: ListItem[] = [];

      // 빈 줄이 2개 이상 나오거나 header/paragraph를 만날 때까지 수집
      let consecutiveEmptyLines = 0;
      while (i < parsedLines.length) {
        const current = parsedLines[i];

        if (current.type === 'list') {
          allListItems.push(current.data as ListItem);
          consecutiveEmptyLines = 0;
          i++;
        } else if (current.type === 'empty') {
          consecutiveEmptyLines++;
          if (consecutiveEmptyLines >= 2) {
            // 빈 줄 2개 이상 → 리스트 그룹 종료
            break;
          }
          i++;
        } else {
          // header나 paragraph를 만나면 종료
          break;
        }
      }

      // ✅ 수집된 모든 리스트를 indent와 type별로 그룹화
      const topLevelGroups: { type: 'ul' | 'ol'; items: ListItem[] }[] = [];
      let currentGroup: ListItem[] = [];
      let currentType: 'ul' | 'ol' | null = null;

      allListItems.forEach((item) => {
        // indent 0인 최상위 항목만 그룹화 (nested는 renderListItems에서 처리)
        if (item.indent === 0) {
          if (currentType === null || item.type !== currentType) {
            // 타입이 바뀌면 새 그룹 시작
            if (currentGroup.length > 0 && currentType) {
              topLevelGroups.push({ type: currentType, items: currentGroup });
            }
            currentType = item.type;
            currentGroup = [item];
          } else {
            // 같은 타입이면 기존 그룹에 추가
            currentGroup.push(item);
          }
        } else {
          // nested item은 마지막 top-level 항목에 붙임
          if (currentGroup.length > 0) {
            currentGroup.push(item);
          }
        }
      });

      // 마지막 그룹 추가
      if (currentGroup.length > 0 && currentType) {
        topLevelGroups.push({ type: currentType, items: currentGroup });
      }

      // ✅ 각 타입별 그룹을 하나의 <ul> 또는 <ol>로 렌더링
      topLevelGroups.forEach((group, gIdx) => {
        const ListTag = group.type === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag
            key={`list-${elements.length}-${gIdx}`}
            className={`pl-5 mb-4 space-y-1 text-[13px] ${group.type === 'ol' ? 'list-decimal' : 'list-disc'} marker:text-gray-300 text-gray-700`}
          >
            {renderListItems(group.items, 0, 0)}
          </ListTag>
        );
      });

      continue;
    }

    if (parsed.type === 'header') {
      elements.push(
        <div
          key={`header-${elements.length}`}
          className="font-sans font-bold text-xs text-gray-900 uppercase tracking-widest mt-5 mb-2"
        >
          {parsed.data as string}
        </div>
      );
      i++;
      continue;
    }

    if (parsed.type === 'paragraph') {
      // 연속된 paragraph를 그룹화
      const paragraphs: React.ReactNode[] = [];
      while (i < parsedLines.length && parsedLines[i].type === 'paragraph') {
        const p = parsedLines[i];
        paragraphs.push(
          <p key={`p-${p.lineIdx}`} className="leading-7">
            {p.data as string}
          </p>
        );
        i++;
      }
      elements.push(
        <div key={`pg-${elements.length}`} className="space-y-1.5">
          {paragraphs}
        </div>
      );
      continue;
    }

    i++;
  }

  if (className) {
    return <div className={className}>{elements}</div>;
  }
  return <>{elements}</>;
};
