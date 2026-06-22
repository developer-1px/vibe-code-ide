/**
 * Jotai DevTools - Custom compact implementation using store
 */

import type { Atom } from 'jotai';
import { useEffect, useState } from 'react';
import * as themeAtoms from '@/entities/AppTheme/atoms';
import * as appAtoms from '@/entities/AppView/model/atoms';
import { store } from '@/entities/AppView/model/store';
import * as canvasAtoms from '@/features/Canvas/model/atoms';
import * as deadCodeAtoms from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/model/atoms';
import * as codeFoldAtoms from '@/features/Code/CodeFold/model/atoms';
import * as focusModeAtoms from '@/features/Code/FocusMode/model/atoms';
import * as explorerAtoms from '@/features/Explorer/model/atoms';
import * as navigationAtoms from '@/features/File/Navigation/model/atoms';
import * as filesAtoms from '@/features/File/OpenFiles/model/atoms';
import * as searchAtoms from '@/features/Search/UnifiedSearch/model/atoms';
import { JotaiDevToolsOpenButton } from './JotaiDevToolsOpenButton';
import { type AtomUpdate, JotaiDevToolsPanel } from './JotaiDevToolsPanel';

// Combine all atoms for DevTools tracking
const atoms = {
  ...appAtoms,
  ...themeAtoms,
  ...searchAtoms,
  ...navigationAtoms,
  ...codeFoldAtoms,
  ...focusModeAtoms,
  ...deadCodeAtoms,
  ...filesAtoms,
  ...canvasAtoms,
  ...explorerAtoms,
};

const JotaiDevTools = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [updateHistory, setUpdateHistory] = useState<AtomUpdate[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Initialize history with current atom values
    const initHistory = () => {
      const updates: AtomUpdate[] = [];
      Object.entries(atoms).forEach(([name, atom]) => {
        if (!atom || typeof atom !== 'object' || !('read' in atom)) {
          return;
        }

        try {
          const value = store.get(atom as Atom<unknown>);
          updates.push({
            name,
            value,
            timestamp: Date.now(),
            id: `${name}-${Date.now()}`,
          });
        } catch (e) {
          console.log(`Failed to read atom ${name}:`, e);
        }
      });
      setUpdateHistory(updates.reverse()); // Most recent first
    };

    initHistory();

    // Subscribe to all atom changes and add to history
    const unsubscribers: Array<() => void> = [];

    Object.entries(atoms).forEach(([name, atom]) => {
      if (!atom || typeof atom !== 'object' || !('read' in atom)) {
        return;
      }

      try {
        const unsub = store.sub(atom as Atom<unknown>, () => {
          const value = store.get(atom as Atom<unknown>);
          const timestamp = Date.now();
          const newUpdate: AtomUpdate = {
            name,
            value,
            timestamp,
            id: `${name}-${timestamp}`,
          };

          // Remove old entry with same name and add new update to the top
          setUpdateHistory((prev) => {
            const filtered = prev.filter((item) => item.name !== name);
            return [newUpdate, ...filtered];
          });
        });
        unsubscribers.push(unsub);
      } catch (_e) {
        // Skip atoms that can't be subscribed
      }
    });

    return () => {
      unsubscribers.forEach((unsub) => {
        unsub();
      });
    };
  }, [isOpen]);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  function openDevTools() {
    setIsOpen(true);
  }

  function closeDevTools() {
    setIsOpen(false);
  }

  if (!isOpen) {
    return <JotaiDevToolsOpenButton openDevTools={openDevTools} />;
  }

  return <JotaiDevToolsPanel updateHistory={updateHistory} closeDevTools={closeDevTools} />;
};

export default JotaiDevTools;
