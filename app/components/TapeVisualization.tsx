'use client';

import React, { useEffect, useRef, useState } from 'react';

interface TapeVisualizationProps {
  tapes: string[][];
  headPositions: number[];
  numTapes: number;
  writtenCells?: Set<string>;
  blankSymbol?: string;
  currentState?: string;
  status?: 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition';
}

export default function TapeVisualization({
  tapes,
  headPositions,
  numTapes,
  writtenCells,
  blankSymbol = '_',
  currentState,
  status = 'running',
}: TapeVisualizationProps) {
  const tapeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevHeadPositions = useRef<number[]>([...headPositions]);
  const [stateAnimating, setStateAnimating] = useState(false);
  const prevState = useRef<string | undefined>(currentState);

  const moveDirections = headPositions.map((pos, i) => {
    const prev = prevHeadPositions.current[i] ?? pos;
    if (pos > prev) return 'right';
    if (pos < prev) return 'left';
    return 'none';
  });

  useEffect(() => {
    prevHeadPositions.current = [...headPositions];
  }, [headPositions]);

  // Trigger animation when state changes
  useEffect(() => {
    if (currentState !== prevState.current) {
      setStateAnimating(true);
      const timer = setTimeout(() => setStateAnimating(false), 350);
      prevState.current = currentState;
      return () => clearTimeout(timer);
    }
  }, [currentState]);

  useEffect(() => {
    headPositions.forEach((pos, tapeIdx) => {
      const container = tapeRefs.current[tapeIdx];
      if (container) {
        const cellWidth = 58; // cell-size + gap
        const scrollTarget = pos * cellWidth - container.clientWidth / 2 + cellWidth / 2;
        container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
      }
    });
  }, [headPositions]);

  const tapeNames = ['INPUT', 'WORK', 'OUTPUT', 'AUX1', 'AUX2'];

  // Status display helpers
  const getStatusLabel = () => {
    switch (status) {
      case 'accepted': return 'ACCEPT';
      case 'rejected': return 'REJECT';
      case 'halted': return 'HALTED';
      case 'missing_transition': return 'MISSING';
      default: return 'RUNNING';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'accepted': return 'var(--accent-emerald)';
      case 'rejected': return 'var(--accent-rose)';
      case 'halted': return 'var(--accent-amber)';
      case 'missing_transition': return 'var(--accent-rose)';
      default: return 'var(--accent-cyan-light, #0ea5e9)';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'accepted': return 'rgba(5, 150, 105, 0.1)';
      case 'rejected': return 'rgba(186, 26, 26, 0.1)';
      case 'halted': return 'rgba(138, 81, 0, 0.1)';
      case 'missing_transition': return 'rgba(186, 26, 26, 0.1)';
      default: return 'rgba(14, 165, 233, 0.1)';
    }
  };

  const getStatusBorder = () => {
    switch (status) {
      case 'accepted': return 'rgba(5, 150, 105, 0.3)';
      case 'rejected': return 'rgba(186, 26, 26, 0.3)';
      case 'halted': return 'rgba(138, 81, 0, 0.25)';
      case 'missing_transition': return 'rgba(186, 26, 26, 0.3)';
      default: return 'rgba(14, 165, 233, 0.25)';
    }
  };

  const getGlowShadow = () => {
    if (status === 'accepted') return '0 0 18px rgba(5, 150, 105, 0.25), 0 0 40px rgba(5, 150, 105, 0.1)';
    if (status === 'rejected' || status === 'missing_transition') return '0 0 18px rgba(186, 26, 26, 0.25), 0 0 40px rgba(186, 26, 26, 0.1)';
    return 'none';
  };

  const getContainerBg = () => {
    switch (status) {
      case 'accepted': return 'rgba(5, 150, 105, 0.04)';
      case 'rejected': return 'rgba(186, 26, 26, 0.04)';
      case 'missing_transition': return 'rgba(186, 26, 26, 0.04)';
      default: return 'rgba(8, 145, 178, 0.03)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {Array.from({ length: numTapes }).map((_, tapeIdx) => {
        const tape = tapes[tapeIdx] || [];
        const headPos = headPositions[tapeIdx] ?? 0;
        const moveDir = moveDirections[tapeIdx];
        const tapeName = tapeNames[tapeIdx] ?? `TAPE_${tapeIdx + 1}`;

        return (
          <div key={tapeIdx}>
            <div className="tape-label">
              <div className="tape-label-left">
                <span className="tape-num">{tapeIdx + 1}</span>
                <span>TAPE_{String(tapeIdx + 1).padStart(2, '0')} ({tapeName})</span>
                {/* Current state badge next to each tape */}
                {currentState && (
                  <span
                    className="tape-state-badge"
                    style={{
                      color: getStatusColor(),
                      background: getStatusBg(),
                      borderColor: getStatusBorder(),
                      transform: stateAnimating ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    {currentState}
                  </span>
                )}
              </div>
              <span className="tape-pos-badge">HEAD: {String(headPos).padStart(2, '0')}</span>
            </div>
            <div
              className="tape-container"
              ref={(el) => { tapeRefs.current[tapeIdx] = el; }}
            >
              {tape.map((symbol, cellIdx) => {
                const isActive = cellIdx === headPos;
                const isWritten = writtenCells?.has(`${tapeIdx}-${cellIdx}`);
                const isBlank = symbol === blankSymbol;

                let dirClass = '';
                if (isActive && moveDir === 'right') dirClass = ' head-move-right';
                else if (isActive && moveDir === 'left') dirClass = ' head-move-left';

                return (
                  <div
                    key={cellIdx}
                    className={`tape-cell${isActive ? ' active' : ''}${isWritten ? ' written' : ''}${isBlank ? ' blank-cell' : ''}${dirClass}`}
                  >
                    {/* Cell index above active cell */}
                    {isActive && (
                      <span className="cell-index-label">{cellIdx}</span>
                    )}
                    {symbol}
                    {isActive && (
                      <span className="head-indicator">▲</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Current State Display — below all tapes */}
      {currentState !== undefined && (
        <div
          className="current-state-display"
          style={{
            background: getContainerBg(),
            border: `1.5px solid ${getStatusBorder()}`,
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '4px',
            boxShadow: getGlowShadow(),
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Current State:
          </span>

          <span
            style={{
              fontSize: '20px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: getStatusColor(),
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: stateAnimating ? 'scale(1.2)' : 'scale(1)',
              display: 'inline-block',
            }}
          >
            {currentState}
          </span>

          {/* Status badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              background: getStatusBg(),
              color: getStatusColor(),
              border: `1px solid ${getStatusBorder()}`,
              animation: status === 'running' ? 'pulse 2s ease-in-out infinite' : undefined,
              transition: 'all 0.3s ease',
            }}
          >
            {/* Pulse dot for running */}
            {status === 'running' && (
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent-cyan-light, #0ea5e9)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            )}
            {status === 'accepted' && <span>✓</span>}
            {(status === 'rejected' || status === 'missing_transition') && <span>✗</span>}
            {getStatusLabel()}
          </span>
        </div>
      )}
    </div>
  );
}