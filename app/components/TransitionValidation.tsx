'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { MachineConfig, TransitionRule, Direction } from '../lib/turingEngine';
import { getValidationSummary, generateMissingTransitionRules, ValidationSummary } from '../lib/transitionValidator';

interface TransitionValidationProps {
  config: MachineConfig;
  onConfigChange: (config: MachineConfig) => void;
  onToast?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function TransitionValidation({
  config,
  onConfigChange,
  onToast,
}: TransitionValidationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedState, setExpandedState] = useState<string | null>(null);

  const summary: ValidationSummary = useMemo(() => {
    return getValidationSummary(config);
  }, [config]);

  const toggleState = (state: string) => {
    setExpandedState(expandedState === state ? null : state);
  };

  const handleAutoFillReject = useCallback(() => {
    const missingRules = generateMissingTransitionRules(config);
    if (missingRules.length === 0) return;

    // Ensure reject state exists
    const newStates = [...config.states];
    const rejectState = config.rejectStates[0] || 'qReject';
    if (!newStates.includes(rejectState)) {
      newStates.push(rejectState);
    }

    const newRejectStates = [...config.rejectStates];
    if (!newRejectStates.includes(rejectState)) {
      newRejectStates.push(rejectState);
    }

    const newConfig: MachineConfig = {
      ...config,
      states: newStates,
      rejectStates: newRejectStates,
      transitions: [...config.transitions, ...missingRules],
    };

    onConfigChange(newConfig);
    onToast?.('success', `Added ${missingRules.length} missing transition(s) → ${rejectState}`);
  }, [config, onConfigChange, onToast]);

  // Don't render if no states to validate
  if (summary.stateValidations.length === 0) return null;

  const completionPct = summary.totalRequired > 0
    ? Math.round((summary.totalCovered / summary.totalRequired) * 100)
    : 100;

  return (
    <div className="glass-card validation-container" id="transition-validation-panel">
      {/* Header */}
      <button
        className="validation-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="section-title" style={{ margin: 0, cursor: 'pointer' }}>
            <span className="icon">{summary.isComplete ? '✅' : '⚠️'}</span>
            Transition Coverage
          </span>
          <span className={`validation-badge ${summary.isComplete ? 'complete' : 'incomplete'}`}>
            {completionPct}%
          </span>
          {!summary.isComplete && (
            <span className="validation-missing-count">
              {summary.totalMissing} missing
            </span>
          )}
        </div>
        <span
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
            fontSize: '10px',
            color: 'var(--text-muted)',
          }}
        >
          ▼
        </span>
      </button>

      {/* Warning Banner */}
      {!summary.isComplete && (
        <div className="validation-warning">
          <span>⚠️</span>
          <span>Incomplete transition function — machine may halt on undefined combinations</span>
        </div>
      )}

      {/* Expandable Content */}
      <div className={`validation-body ${isExpanded ? 'open' : ''}`}>
        {/* Progress Bar */}
        <div className="validation-progress-wrap">
          <div className="validation-progress-label">
            <span>{summary.totalCovered} / {summary.totalRequired} transitions defined</span>
            <span>{completionPct}%</span>
          </div>
          <div className="validation-progress-track">
            <div
              className={`validation-progress-fill ${summary.isComplete ? 'complete' : completionPct > 50 ? 'partial' : 'low'}`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Per-State Breakdown */}
        <div className="validation-states">
          {summary.stateValidations.map(sv => (
            <div key={sv.state} className="validation-state-item">
              <button
                className={`validation-state-header ${sv.missingCombinations > 0 ? 'has-missing' : 'all-covered'}`}
                onClick={() => toggleState(sv.state)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`validation-state-dot ${sv.missingCombinations > 0 ? 'missing' : 'ok'}`} />
                  <span className="validation-state-name">{sv.state}</span>
                  <span className="validation-state-ratio">
                    {sv.coveredCombinations}/{sv.totalCombinations}
                  </span>
                </div>
                {sv.missingCombinations > 0 && (
                  <span className="validation-state-missing-badge">
                    {sv.missingCombinations} missing
                  </span>
                )}
              </button>

              {/* Missing combos for this state */}
              {expandedState === sv.state && sv.missing.length > 0 && (
                <div className="validation-missing-list">
                  {sv.missing.slice(0, 20).map((m, idx) => (
                    <span key={idx} className="validation-missing-chip">
                      ({sv.state}, {m.symbolsLabel})
                    </span>
                  ))}
                  {sv.missing.length > 20 && (
                    <span className="validation-missing-more">
                      +{sv.missing.length - 20} more...
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Auto-Fill Button */}
        {!summary.isComplete && (
          <button
            className="btn btn-primary validation-autofill-btn"
            onClick={handleAutoFillReject}
            id="autofill-reject-btn"
          >
            <span>🔧</span>
            Auto-fill {summary.totalMissing} missing → qReject
          </button>
        )}

        {summary.isComplete && (
          <div className="validation-complete-msg">
            <span>🎉</span>
            <span>All state-symbol combinations are covered! The machine has a complete transition function.</span>
          </div>
        )}
      </div>
    </div>
  );
}
