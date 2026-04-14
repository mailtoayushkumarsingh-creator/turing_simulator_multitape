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
  blankSymbol = 'B',
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
      default: return '#10b981'; // Green for active running state
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'accepted': return 'rgba(5, 150, 105, 0.1)';
      case 'rejected': return 'rgba(186, 26, 26, 0.1)';
      case 'halted': return 'rgba(138, 81, 0, 0.1)';
      case 'missing_transition': return 'rgba(186, 26, 26, 0.1)';
      default: return 'rgba(16, 185, 129, 0.15)'; // Green for active running state
    }
  };

  const getStatusBorder = () => {
    switch (status) {
      case 'accepted': return 'rgba(5, 150, 105, 0.3)';
      case 'rejected': return 'rgba(186, 26, 26, 0.3)';
      case 'halted': return 'rgba(138, 81, 0, 0.25)';
      case 'missing_transition': return 'rgba(186, 26, 26, 0.3)';
      default: return 'rgba(16, 185, 129, 0.4)'; // Green for active running state
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
                {/* Removed state badge from next to tape label as per point 3 - move below tape head */}
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
                      <div className="head-indicator-wrapper" style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 10,
                        marginTop: '-4px'
                      }}>
                        <span className="head-indicator" style={{
                           color: getStatusColor(),
                           textShadow: `0 0 6px ${getStatusBorder()}`
                        }}>▲</span>
                        <div style={{
                          background: getStatusBg(),
                          color: getStatusColor(),
                          border: `1px solid ${getStatusBorder()}`,
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          marginTop: '2px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          animation: status === 'running' ? 'pulse 2s infinite' : 'none'
                        }}>
                          {currentState}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* REMOVED: large bottom state display (Feature 3: move below tape heads) */}
    </div>
  );
}