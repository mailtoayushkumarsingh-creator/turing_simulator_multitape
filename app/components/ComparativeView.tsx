'use client';

import React from 'react';
import { SingleTapeTuringMachine } from '../lib/turingEngine';
import type { MachineConfig } from '../lib/turingEngine';

interface ComparativeViewProps {
  config: MachineConfig;
  multiTapeSteps: number;
  status: 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition';
}

export default function ComparativeView({
  config,
  multiTapeSteps,
  status,
}: ComparativeViewProps) {
  const singleTapeSim = new SingleTapeTuringMachine(config);
  const singleTapeSteps = singleTapeSim.simulateComparison(multiTapeSteps);

  const maxSteps = Math.max(singleTapeSteps, multiTapeSteps, 1);
  const multiWidth = Math.max(5, (multiTapeSteps / maxSteps) * 100);
  const singleWidth = Math.max(5, (singleTapeSteps / maxSteps) * 100);

  const speedup = multiTapeSteps > 0
    ? (singleTapeSteps / multiTapeSteps).toFixed(1)
    : '—';

  const percentReduction = multiTapeSteps > 0 && singleTapeSteps > 0
    ? Math.round(((singleTapeSteps - multiTapeSteps) / singleTapeSteps) * 100)
    : 0;

  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <div className="section-title">
        <span className="icon">📊</span>
        Efficiency Comparison
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Live Step Counters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}>
          <div style={{
            padding: '10px 14px',
            background: 'rgba(8, 145, 178, 0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(8, 145, 178, 0.15)',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}>
              Multi-Tape Steps
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
            }}>
              {multiTapeSteps}
            </div>
          </div>
          <div style={{
            padding: '10px 14px',
            background: 'rgba(217, 119, 6, 0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(217, 119, 6, 0.15)',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}>
              Single-Tape Steps (est.)
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-amber)',
            }}>
              ~{singleTapeSteps}
            </div>
          </div>
        </div>

        {/* Multi-tape bar */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
            fontSize: '12px',
          }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
              Multi-Tape ({config.numTapes} tapes)
            </span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {multiTapeSteps} steps
            </span>
          </div>
          <div style={{
            background: 'rgba(226, 232, 240, 0.6)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}>
            <div
              className="comparison-bar multi"
              style={{ width: `${multiWidth}%` }}
            >
              {multiTapeSteps > 0 ? multiTapeSteps : ''}
            </div>
          </div>
        </div>

        {/* Single-tape bar */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
            fontSize: '12px',
          }}>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
              Single-Tape (equivalent)
            </span>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              ~{singleTapeSteps} steps
            </span>
          </div>
          <div style={{
            background: 'rgba(226, 232, 240, 0.6)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}>
            <div
              className="comparison-bar single"
              style={{ width: `${singleWidth}%` }}
            >
              {singleTapeSteps > 0 ? `~${singleTapeSteps}` : ''}
            </div>
          </div>
        </div>

        {/* Speedup + Percentage indicator */}
        {multiTapeSteps > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '12px',
            background: 'rgba(5, 150, 105, 0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(5, 150, 105, 0.15)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '22px' }}>⚡</span>
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--accent-emerald)',
                fontFamily: 'var(--font-mono)',
              }}>
                {speedup}× faster
              </div>
            </div>
            <div style={{
              width: '1px',
              height: '36px',
              background: 'rgba(5, 150, 105, 0.2)',
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--accent-emerald)',
                fontFamily: 'var(--font-mono)',
              }}>
                ~{percentReduction}% fewer
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginTop: '2px',
              }}>
                Multi-tape reduces steps by ~{percentReduction}%
              </div>
            </div>
          </div>
        )}

        {/* Improved "Why the Difference" Explanation */}
        <div style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          padding: '12px 14px',
          background: 'rgba(226, 232, 240, 0.5)',
          borderRadius: '10px',
        }}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
            💡 Why the difference?
          </strong>
          A single-tape Turing machine simulates multiple tapes by storing them on one tape.
          To access different tape heads, it must scan back and forth repeatedly,
          increasing time complexity from{' '}
          <span style={{
            color: 'var(--accent-cyan)',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
          }}>O(t)</span>{' '}
          to{' '}
          <span style={{
            color: 'var(--accent-amber)',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
          }}>O(t²)</span>.
        </div>

        {/* Performance Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
        }}>
          <div style={{
            padding: '10px 12px',
            background: 'rgba(14, 165, 233, 0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(14, 165, 233, 0.12)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Steps Used
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
              {multiTapeSteps}
            </div>
          </div>
          <div style={{
            padding: '10px 12px',
            background: 'rgba(124, 58, 237, 0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(124, 58, 237, 0.12)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Tapes
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)' }}>
              {config.numTapes}
            </div>
          </div>
          <div style={{
            padding: '10px 12px',
            background: 'rgba(5, 150, 105, 0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(5, 150, 105, 0.12)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Status
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: status === 'accepted' ? 'var(--accent-emerald)'
                : status === 'rejected' ? 'var(--accent-rose)'
                : status === 'halted' ? 'var(--accent-amber)'
                : 'var(--text-secondary)',
            }}>
              {status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Time Complexity Insight */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '12px',
          color: 'var(--accent-violet)',
          lineHeight: 1.6,
          padding: '10px 14px',
          background: 'rgba(124, 58, 237, 0.06)',
          borderRadius: '10px',
          border: '1px solid rgba(124, 58, 237, 0.15)',
        }}>
          <span style={{ fontSize: '16px', marginTop: '1px' }}>🧮</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '2px', fontSize: '12px' }}>
              Time Complexity Insight
            </strong>
            <span style={{ color: 'var(--text-secondary)' }}>
              Single-tape simulation takes{' '}
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>O(t²)</span>
              {' '}time, while multi-tape operates in{' '}
              <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>O(t)</span>.
            </span>
          </div>
        </div>

        {/* Key Educational Insight */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '12px',
          lineHeight: 1.6,
          padding: '12px 14px',
          background: 'rgba(14, 165, 233, 0.04)',
          borderRadius: '10px',
          border: '1px solid rgba(14, 165, 233, 0.12)',
        }}>
          <span style={{ fontSize: '16px', marginTop: '1px' }}>🎓</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '3px', fontSize: '12px', color: 'var(--text-primary)' }}>
              Key Takeaway (Church-Turing Thesis)
            </strong>
            <span style={{ color: 'var(--text-secondary)' }}>
              Multi-tape machines improve <em>efficiency</em> but not <em>computational power</em>.
              Any language decidable by a multi-tape TM can also be decided by a single-tape TM —
              the multi-tape version simply does it faster (fewer steps).
              Both models recognize the same class of languages.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
