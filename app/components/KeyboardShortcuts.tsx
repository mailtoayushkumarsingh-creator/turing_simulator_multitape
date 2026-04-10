'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onToggleHelp: () => void;
}

export default function KeyboardShortcuts({
  onPlayPause,
  onStepForward,
  onStepBack,
  onReset,
  onToggleHelp,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, select, or textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onStepForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onStepBack();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          onReset();
          break;
        case '?':
          e.preventDefault();
          onToggleHelp();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPlayPause, onStepForward, onStepBack, onReset, onToggleHelp]);

  return null; // This is a hook-like component, no UI
}
