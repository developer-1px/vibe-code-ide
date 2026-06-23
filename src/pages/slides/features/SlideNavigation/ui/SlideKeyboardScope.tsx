import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { useHotkeys, useHotkeysContext } from 'react-hotkeys-hook';
import { chunkCountAtom, chunksAtom, currentChunkIndexAtom, targetDepthAtom } from '../model/atoms';

/**
 * 슬라이드 키보드 네비게이션 scope
 */
export function SlideKeyboardScope() {
  const [currentChunkIndex, setCurrentChunkIndex] = useAtom(currentChunkIndexAtom);
  const chunkCount = useAtomValue(chunkCountAtom);
  const chunks = useAtomValue(chunksAtom);
  const [targetDepth, setTargetDepth] = useAtom(targetDepthAtom);

  const { enableScope, disableScope } = useHotkeysContext();

  // 컴포넌트 마운트 시 'slide' scope 활성화
  useEffect(() => {
    console.log('[SlideKeyboard] Enabling slide scope');
    enableScope('slide');
    return () => {
      console.log('[SlideKeyboard] Disabling slide scope');
      disableScope('slide');
    };
  }, [enableScope, disableScope]);

  function handleUpKey() {
    console.log('[SlideKeyboard] UP key pressed', { currentChunkIndex, chunkCount, targetDepth });

    if (currentChunkIndex < 0 || chunks.length === 0) return;

    // 1. targetDepth와 정확히 일치하는 이전 chunk 찾기
    let exactMatch = -1;
    for (let i = currentChunkIndex - 1; i >= 0; i--) {
      if (chunks[i].depth === targetDepth) {
        exactMatch = i;
        break;
      }
    }

    if (exactMatch >= 0) {
      setCurrentChunkIndex(exactMatch);
      console.log('[SlideKeyboard] Moving to exact depth match:', exactMatch);
      return;
    }

    // 2. targetDepth가 없으면 가장 가까운 depth로 (이전 chunk)
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex(currentChunkIndex - 1);
      console.log('[SlideKeyboard] Moving to closest (previous chunk):', currentChunkIndex - 1);
    } else {
      console.log('[SlideKeyboard] Already at first chunk');
    }
  }

  function handleDownKey() {
    console.log('[SlideKeyboard] DOWN key pressed', { currentChunkIndex, chunkCount, targetDepth });

    if (currentChunkIndex < 0 || chunks.length === 0) return;

    // 1. targetDepth와 정확히 일치하는 다음 chunk 찾기
    let exactMatch = -1;
    for (let i = currentChunkIndex + 1; i < chunks.length; i++) {
      if (chunks[i].depth === targetDepth) {
        exactMatch = i;
        break;
      }
    }

    if (exactMatch >= 0) {
      setCurrentChunkIndex(exactMatch);
      console.log('[SlideKeyboard] Moving to exact depth match:', exactMatch);
      return;
    }

    // 2. targetDepth가 없으면 가장 가까운 depth로 (다음 chunk)
    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
      console.log('[SlideKeyboard] Moving to closest (next chunk):', currentChunkIndex + 1);
    } else {
      console.log('[SlideKeyboard] Already at last chunk');
    }
  }

  function handleLeftKey() {
    console.log('[SlideKeyboard] LEFT key pressed', {
      currentChunkIndex,
      chunkCount,
    });

    if (currentChunkIndex > 0) {
      const newIndex = currentChunkIndex - 1;
      setCurrentChunkIndex(newIndex);
      // targetDepth를 새 위치의 depth로 갱신
      setTargetDepth(chunks[newIndex].depth);
      console.log('[SlideKeyboard] Moving to previous chunk, targetDepth updated:', chunks[newIndex].depth);
    } else {
      console.log('[SlideKeyboard] Already at first chunk');
    }
  }

  function handleRightKey() {
    console.log('[SlideKeyboard] RIGHT key pressed', {
      currentChunkIndex,
      chunkCount,
    });

    if (currentChunkIndex < 0) {
      // chunk 없음 상태 → 첫 chunk로 시작
      if (chunks.length > 0) {
        setCurrentChunkIndex(0);
        setTargetDepth(chunks[0].depth);
        console.log('[SlideKeyboard] Starting from first chunk, targetDepth:', chunks[0].depth);
      }
      return;
    }

    if (currentChunkIndex < chunkCount - 1) {
      const newIndex = currentChunkIndex + 1;
      setCurrentChunkIndex(newIndex);
      // targetDepth를 새 위치의 depth로 갱신
      setTargetDepth(chunks[newIndex].depth);
      console.log('[SlideKeyboard] Moving to next chunk, targetDepth updated:', chunks[newIndex].depth);
    } else {
      console.log('[SlideKeyboard] Already at last chunk');
    }
  }

  // ↑ - 이전 chunk로 이동 (targetDepth 기억, 없으면 가장 가까운 곳)
  useHotkeys(
    'up',
    handleUpKey,
    {
      scopes: ['slide'],
      enabled: true,
      preventDefault: true,
    },
    [currentChunkIndex, chunks, targetDepth, setCurrentChunkIndex]
  );

  // ↓ - 다음 chunk로 이동 (targetDepth 기억, 없으면 가장 가까운 곳)
  useHotkeys(
    'down',
    handleDownKey,
    {
      scopes: ['slide'],
      enabled: true,
      preventDefault: true,
    },
    [currentChunkIndex, chunks, targetDepth, setCurrentChunkIndex]
  );

  // ← - 이전 chunk로 이동 (codeline 순서, targetDepth 갱신)
  useHotkeys(
    'left',
    handleLeftKey,
    {
      scopes: ['slide'],
      enabled: true,
      preventDefault: true,
    },
    [currentChunkIndex, chunks, setCurrentChunkIndex, setTargetDepth]
  );

  // → - 다음 chunk로 이동 (codeline 순서, targetDepth 갱신)
  useHotkeys(
    'right',
    handleRightKey,
    {
      scopes: ['slide'],
      enabled: true,
      preventDefault: true,
    },
    [currentChunkIndex, chunkCount, chunks, setCurrentChunkIndex, setTargetDepth]
  );

  return null;
}
