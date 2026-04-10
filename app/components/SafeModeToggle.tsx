'use client';

import React from 'react';
import Tooltip from './Tooltip';

interface SafeModeToggleProps {
  safeMode: boolean;
  onToggle: (value: boolean) => void;
}

export default function SafeModeToggle({ safeMode, onToggle }: SafeModeToggleProps) {
  return (
    <Tooltip
      text={
        safeMode
          ? 'Safe Mode ON: Missing transitions auto-reject instead of halting'
          : 'Strict Mode: Machine halts on missing transitions (standard TM behavior)'
      }
    >
      <button
        className={`safe-mode-toggle ${safeMode ? 'safe-on' : 'safe-off'}`}
        onClick={() => onToggle(!safeMode)}
        aria-label={safeMode ? 'Safe Mode is ON' : 'Safe Mode is OFF'}
        id="safe-mode-toggle"
      >
        <span className="safe-mode-icon">{safeMode ? '🛡️' : '⚡'}</span>
        <span className="safe-mode-label">
          {safeMode ? 'Safe' : 'Strict'}
        </span>
        <span className={`safe-mode-indicator ${safeMode ? 'on' : 'off'}`}>
          <span className="safe-mode-dot" />
        </span>
      </button>
    </Tooltip>
  );
}
