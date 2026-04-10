'use client';

import React, { useRef, useEffect } from 'react';
import { MachineSnapshot } from '../lib/turingEngine';

interface StatePanelProps {
  currentState: string;
  status: 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition';
  history: MachineSnapshot[];
  allStates: string[];
  acceptStates: string[];
  rejectStates: string[];
}

export default function StatePanel({
  currentState,
  status,
  history,
  allStates,
  acceptStates,
  rejectStates,
}: StatePanelProps) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [history]);

  // Format transition in formal notation
  const formatTransition = (snap: MachineSnapshot): string => {
    const t = snap.lastTransition;
    if (!t) return '';
    const reads = t.readSymbols.join(', ');
    const writes = t.writeSymbols.join(', ');
    const dirs = t.directions.join(', ');
    return `(${t.fromState}, ${reads}) → (${t.toState}, ${writes}, ${dirs})`;
  };

  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <div className="section-title">
        <span className="icon">🔄</span>
        State Machine
      </div>

      {/* Feature 6: Current State Display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '10px 14px',
        marginBottom: '14px',
        background: status === 'accepted'
          ? 'rgba(5, 150, 105, 0.08)'
          : status === 'rejected'
            ? 'rgba(225, 29, 72, 0.08)'
            : 'rgba(8, 145, 178, 0.08)',
        borderRadius: '10px',
        border: `1.5px solid ${
          status === 'accepted'
            ? 'rgba(5, 150, 105, 0.25)'
            : status === 'rejected'
              ? 'rgba(225, 29, 72, 0.25)'
              : 'rgba(8, 145, 178, 0.25)'
        }`,
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Current State:
        </span>
        <span style={{
          fontSize: '18px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: status === 'accepted'
            ? 'var(--accent-emerald)'
            : status === 'rejected'
              ? 'var(--accent-rose)'
              : 'var(--accent-cyan)',
        }}>
          {currentState}
        </span>
      </div>

      {/* State diagram */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '14px',
        padding: '10px',
        background: 'rgba(226, 232, 240, 0.5)',
        borderRadius: '10px',
      }}>
        {allStates.map(state => {
          const isCurrent = state === currentState;
          const isAccept = acceptStates.includes(state);
          const isReject = rejectStates.includes(state);

          let bg = 'rgba(226, 232, 240, 0.6)';
          let border = 'rgba(180, 190, 210, 0.4)';
          let color = 'var(--text-muted)';

          if (isCurrent) {
            bg = 'rgba(8, 145, 178, 0.1)';
            border = 'var(--accent-cyan)';
            color = 'var(--accent-cyan)';
          }
          if (isAccept) {
            if (isCurrent) {
              bg = 'rgba(5, 150, 105, 0.1)';
              border = 'var(--accent-emerald)';
              color = 'var(--accent-emerald)';
            } else {
              border = 'rgba(5, 150, 105, 0.3)';
            }
          }
          if (isReject) {
            if (isCurrent) {
              bg = 'rgba(225, 29, 72, 0.1)';
              border = 'var(--accent-rose)';
              color = 'var(--accent-rose)';
            } else {
              border = 'rgba(225, 29, 72, 0.3)';
            }
          }

          return (
            <div
              key={state}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                background: bg,
                border: `1.5px solid ${border}`,
                color,
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: isCurrent ? 700 : 500,
                transition: 'all 0.3s ease',
                position: 'relative',
              }}
            >
              {state}
              {isAccept && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  fontSize: '10px',
                }}>✓</span>
              )}
              {isReject && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  fontSize: '10px',
                }}>✗</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Transition log */}
      <div className="section-title" style={{ marginBottom: '6px', marginTop: '4px' }}>
        <span className="icon">📝</span>
        Transition Log
      </div>
      <div className="log-list" ref={logRef}>
        {history.length <= 1 ? (
          <div style={{
            padding: '12px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}>
            No transitions yet. Press Step or Play to begin.
          </div>
        ) : (
          history.slice(1).map((snap, idx) => (
            <div key={idx} className="log-entry">
              <span className="step-num">#{idx + 1}</span>
              {snap.lastTransition ? (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11.5px',
                }}>
                  <span className="state-name">
                    ({snap.lastTransition.fromState}
                  </span>
                  <span className="symbol">
                    , {snap.lastTransition.readSymbols.join(', ')}
                  </span>
                  <span className="state-name">)</span>
                  <span className="arrow"> → </span>
                  <span className="state-name">
                    ({snap.lastTransition.toState}
                  </span>
                  <span className="symbol">
                    , {snap.lastTransition.writeSymbols.join(', ')}
                  </span>
                  <span className="direction">
                    , {snap.lastTransition.directions.join(', ')}
                  </span>
                  <span className="state-name">)</span>
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>
                  {snap.status === 'halted' ? 'HALTED' :
                    snap.status === 'accepted' ? '✓ ACCEPTED' :
                      snap.status === 'rejected' ? '✗ REJECTED' : '—'}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
