'use client';

import React from 'react';
import Tooltip from './Tooltip';

interface PlaybackControlsProps {
  isPlaying: boolean;
  canStep: boolean;
  canStepBack: boolean;
  speed: number;
  stepCount: number;
  currentState: string;
  status: 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition';
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function PlaybackControls({
  isPlaying,
  canStep,
  canStepBack,
  speed,
  stepCount,
  currentState,
  status,
  onPlay,
  onPause,
  onStep,
  onStepBack,
  onReset,
  onSpeedChange,
}: PlaybackControlsProps) {
  const statusClass = `status-${status}`;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="playback-card">
        {/* Reset */}
        <Tooltip text="Reset to initial state (R)">
          <button
            className="btn btn-secondary btn-icon"
            onClick={onReset}
            title="Reset"
            style={{ borderRadius: '9999px' }}
          >
            ⏮
          </button>
        </Tooltip>

        {/* Step back */}
        <Tooltip text="Step backward (←)">
          <button
            className="btn btn-secondary btn-icon"
            onClick={onStepBack}
            disabled={!canStepBack}
            title="Step Back"
            style={{ borderRadius: '9999px' }}
          >
            ◀
          </button>
        </Tooltip>

        {/* Play / Pause */}
        {isPlaying ? (
          <Tooltip text="Pause simulation (Space)">
            <button
              className="btn btn-primary"
              onClick={onPause}
              style={{ minWidth: '88px', borderRadius: '9999px' }}
            >
              ⏸ Pause
            </button>
          </Tooltip>
        ) : (
          <Tooltip text="Play simulation (Space)">
            <button
              className="btn btn-primary"
              onClick={onPlay}
              disabled={!canStep}
              style={{
                minWidth: '88px',
                borderRadius: '9999px',
                boxShadow: canStep ? '0 0 20px rgba(14,165,233,0.4)' : undefined,
                animation: canStep ? 'pulse 2s ease-in-out infinite' : undefined,
              }}
            >
              ▶ Play
            </button>
          </Tooltip>
        )}

        {/* Step forward */}
        <Tooltip text="Step forward (→)">
          <button
            className="btn btn-secondary btn-icon"
            onClick={onStep}
            disabled={!canStep}
            title="Step Forward"
            style={{ borderRadius: '9999px' }}
          >
            ▶
          </button>
        </Tooltip>

        <div className="divider" />

        {/* Speed control */}
        <Tooltip text="Adjust simulation speed" position="bottom">
          <div className="playback-speed">
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>🐢</span>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={2050 - speed}
              onChange={(e) => onSpeedChange(2050 - parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>🐇</span>
            <span style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              minWidth: '44px',
            }}>
              {speed}ms
            </span>
          </div>
        </Tooltip>

        <div className="divider" />

        {/* Status */}
        <div className="playback-status">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Step
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan-light, #0ea5e9)',
              lineHeight: 1,
            }}>
              {stepCount}
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              State
            </div>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
            }}>
              {currentState}
            </div>
          </div>

          <Tooltip text={`Machine status: ${status}`}>
            <span className={`status-badge ${statusClass}`}>
              <span
                className="pulse-dot"
                style={{
                  background:
                    status === 'running' ? 'var(--accent-cyan-light, #0ea5e9)' :
                    status === 'accepted' ? 'var(--accent-emerald)' :
                    status === 'rejected' ? 'var(--accent-rose)' :
                    'var(--accent-amber)',
                }}
              />
              {status}
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}