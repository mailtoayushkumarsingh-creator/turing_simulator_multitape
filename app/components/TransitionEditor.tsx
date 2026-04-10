'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MachineConfig, TransitionRule, Direction } from '../lib/turingEngine';
import { TEMPLATES, MachineTemplate } from '../lib/templates';
import Tooltip from './Tooltip';

interface TransitionEditorProps {
  config: MachineConfig;
  onConfigChange: (config: MachineConfig) => void;
  activeTransition?: TransitionRule | null;
  isCustomMode?: boolean;
  onToast?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const DIRECTION_OPTIONS: Direction[] = ['L', 'R', 'S'];

interface ValidationError {
  field: string; // e.g. "fromState", "readSymbols-0", "toState", "writeSymbols-1", "directions-0"
  message: string;
}

function validateRule(rule: TransitionRule, config: MachineConfig, allRules: TransitionRule[], ruleIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check fromState exists in states
  if (rule.fromState && !config.states.includes(rule.fromState)) {
    errors.push({ field: 'fromState', message: `State "${rule.fromState}" is not defined` });
  }

  // Check toState exists in states
  if (rule.toState && !config.states.includes(rule.toState)) {
    errors.push({ field: 'toState', message: `State "${rule.toState}" is not defined` });
  }

  // Check readSymbols are in alphabet or wildcard
  rule.readSymbols.forEach((sym, i) => {
    if (sym && sym !== '*' && !config.alphabet.includes(sym) && sym !== config.blankSymbol) {
      errors.push({ field: `readSymbols-${i}`, message: `Symbol "${sym}" not in alphabet` });
    }
  });

  // Check writeSymbols are in alphabet or wildcard
  rule.writeSymbols.forEach((sym, i) => {
    if (sym && sym !== '*' && !config.alphabet.includes(sym) && sym !== config.blankSymbol) {
      errors.push({ field: `writeSymbols-${i}`, message: `Symbol "${sym}" not in alphabet` });
    }
  });

  // Check for empty required fields
  if (!rule.fromState) {
    errors.push({ field: 'fromState', message: 'From state is required' });
  }
  if (!rule.toState) {
    errors.push({ field: 'toState', message: 'To state is required' });
  }

  // Check for duplicate rules (same fromState + readSymbols)
  const isDuplicate = allRules.some((other, idx) =>
    idx !== ruleIndex &&
    other.fromState === rule.fromState &&
    other.readSymbols.every((s, i) => s === rule.readSymbols[i])
  );
  if (isDuplicate) {
    errors.push({ field: 'fromState', message: 'Duplicate rule (same state + read symbols)' });
  }

  return errors;
}

export default function TransitionEditor({
  config,
  onConfigChange,
  activeTransition,
  isCustomMode = false,
  onToast,
}: TransitionEditorProps) {
  const [localConfig, setLocalConfig] = useState<MachineConfig>(config);
  const [activeTab, setActiveTab] = useState<'rules' | 'config'>('rules');
  const [exitingRows, setExitingRows] = useState<Set<number>>(new Set());
  const [inputString, setInputString] = useState('');
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    setLocalConfig(config);
    // Sync inputString from config tape 1
    const tape1 = config.initialTapes[0] || [];
    const tape1Str = tape1.filter(c => c !== config.blankSymbol).join('');
    setInputString(tape1Str);
  }, [config]);

  const updateConfig = (updates: Partial<MachineConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const updateTransition = (idx: number, updates: Partial<TransitionRule>) => {
    const newTransitions = [...localConfig.transitions];
    newTransitions[idx] = { ...newTransitions[idx], ...updates };
    updateConfig({ transitions: newTransitions });
  };

  const addTransition = () => {
    const emptyRule: TransitionRule = {
      fromState: localConfig.states[0] || 'q0',
      readSymbols: Array(localConfig.numTapes).fill(localConfig.blankSymbol),
      toState: localConfig.states[0] || 'q0',
      writeSymbols: Array(localConfig.numTapes).fill(localConfig.blankSymbol),
      directions: Array(localConfig.numTapes).fill('S' as Direction),
    };
    updateConfig({ transitions: [...localConfig.transitions, emptyRule] });
  };

  const removeTransition = useCallback((idx: number) => {
    // Animate exit first
    setExitingRows(prev => new Set(prev).add(idx));
    setTimeout(() => {
      setExitingRows(prev => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
      const newTransitions = localConfig.transitions.filter((_, i) => i !== idx);
      updateConfig({ transitions: newTransitions });
    }, 280);
  }, [localConfig, updateConfig]);

  const isActiveRule = (rule: TransitionRule) => {
    if (!activeTransition) return false;
    return (
      rule.fromState === activeTransition.fromState &&
      rule.readSymbols.every((s, i) => s === activeTransition.readSymbols[i])
    );
  };

  const updateTapeInput = (tapeIdx: number, value: string) => {
    const newTapes = [...localConfig.initialTapes];
    newTapes[tapeIdx] = value.split('').filter(c => c.trim() !== '');
    updateConfig({ initialTapes: newTapes });
  };

  // Handle input string change with validation
  const handleInputStringChange = (value: string) => {
    setInputString(value);

    // Validate against alphabet
    const validSymbols = localConfig.alphabet.filter(s => s !== localConfig.blankSymbol);
    const invalidChars = value.split('').filter(c => c.trim() !== '' && !validSymbols.includes(c));

    if (invalidChars.length > 0) {
      setInputError(`Invalid symbol(s): ${[...new Set(invalidChars)].map(c => `'${c}'`).join(', ')} — not in alphabet [${validSymbols.join(', ')}]`);
      return;
    }

    setInputError('');

    // Update Tape 1 with the input
    const newTapes = [...localConfig.initialTapes];
    newTapes[0] = value.split('').filter(c => c.trim() !== '');

    // Fill other tapes with blank
    for (let i = 1; i < localConfig.numTapes; i++) {
      if (!newTapes[i] || newTapes[i].length === 0) {
        newTapes[i] = [];
      }
    }

    updateConfig({ initialTapes: newTapes });
  };

  const handleResetInput = () => {
    setInputString('');
    setInputError('');
    const newTapes = localConfig.initialTapes.map(() => [] as string[]);
    updateConfig({ initialTapes: newTapes });
  };

  // Load template
  const handleLoadTemplate = (template: MachineTemplate) => {
    const newConfig = { ...template.config };
    setInputString(template.sampleInput);
    setInputError('');
    onConfigChange(newConfig);
    if (onToast) {
      onToast('info', `Loaded "${template.label.replace('Load ', '')}" — ready to simulate!`);
    }
  };

  // Compute validation errors for all rules
  const allValidationErrors: ValidationError[][] = localConfig.transitions.map((rule, idx) =>
    validateRule(rule, localConfig, localConfig.transitions, idx)
  );

  const getFieldError = (ruleIdx: number, field: string): string | null => {
    const errors = allValidationErrors[ruleIdx];
    const err = errors?.find(e => e.field === field);
    return err ? err.message : null;
  };

  const isRowInvalid = (ruleIdx: number): boolean => {
    return (allValidationErrors[ruleIdx]?.length ?? 0) > 0;
  };

  return (
    <div className="glass-card" style={{ padding: '16px', overflow: 'hidden' }}>
      <div className="section-title">
        <span className="icon">⚙️</span>
        Machine Configuration
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: '12px' }}>
        <button
          className={`tab-btn${activeTab === 'rules' ? ' active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Transition Rules
        </button>
        <button
          className={`tab-btn${activeTab === 'config' ? ' active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          Settings
        </button>
      </div>

      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* === INPUT STRING FIELD (Feature 1) === */}
          <div
            style={{
              background: 'rgba(14, 165, 233, 0.05)',
              border: '1px solid rgba(14, 165, 233, 0.15)',
              borderRadius: '10px',
              padding: '12px 14px',
            }}
          >
            <label style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--accent-cyan-light, #0ea5e9)',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              ✏️ Enter Input String (Tape 1)
            </label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                id="input-string-field"
                className={`input-field${inputError ? ' input-invalid' : ''}`}
                value={inputString}
                onChange={(e) => handleInputStringChange(e.target.value)}
                placeholder="e.g., aabb, abcba"
                style={{
                  flex: 1,
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '8px 12px',
                }}
              />
              <Tooltip text="Clear input and reset tapes">
                <button
                  className="btn btn-secondary"
                  onClick={handleResetInput}
                  style={{ fontSize: '11px', padding: '7px 10px', whiteSpace: 'nowrap' }}
                >
                  ↺ Reset
                </button>
              </Tooltip>
            </div>
            {inputError && (
              <div style={{
                fontSize: '11px',
                color: 'var(--accent-rose)',
                marginTop: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span>⚠</span> {inputError}
              </div>
            )}
            {!inputError && inputString && (
              <div style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginTop: '4px',
              }}>
                Tape 1 will contain: [{inputString.split('').join(', ')}]
              </div>
            )}
          </div>

          {/* === TEMPLATE BUTTONS (Feature 3) === */}
          {isCustomMode && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <label style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Quick Load Templates
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {TEMPLATES.map((template) => (
                  <Tooltip key={template.label} text={template.description}>
                    <button
                      className="btn btn-secondary template-btn"
                      onClick={() => handleLoadTemplate(template)}
                      style={{
                        fontSize: '11.5px',
                        padding: '6px 12px',
                        gap: '4px',
                      }}
                    >
                      <span>{template.emoji}</span>
                      {template.label}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {/* States */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              States (comma-separated)
            </label>
            <input
              className="input-field"
              value={localConfig.states.join(', ')}
              onChange={(e) =>
                updateConfig({
                  states: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                })
              }
            />
          </div>

          {/* Alphabet */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Alphabet (comma-separated)
            </label>
            <input
              className="input-field"
              value={localConfig.alphabet.join(', ')}
              onChange={(e) =>
                updateConfig({
                  alphabet: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                })
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Number of tapes */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Number of Tapes
              </label>
              <input
                className="input-field"
                type="number"
                min={1}
                max={4}
                value={localConfig.numTapes}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(4, parseInt(e.target.value) || 1));
                  const newTapes = [...localConfig.initialTapes];
                  while (newTapes.length < n) newTapes.push([]);
                  updateConfig({ numTapes: n, initialTapes: newTapes.slice(0, n) });
                }}
              />
            </div>

            {/* Blank symbol */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Blank Symbol
              </label>
              <input
                className="input-field"
                value={localConfig.blankSymbol}
                onChange={(e) => updateConfig({ blankSymbol: e.target.value || '_' })}
                maxLength={1}
              />
            </div>

            {/* Initial state */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Initial State
              </label>
              <input
                className="input-field"
                value={localConfig.initialState}
                onChange={(e) => updateConfig({ initialState: e.target.value })}
              />
            </div>

            {/* Accept states */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Accept States
              </label>
              <input
                className="input-field"
                value={localConfig.acceptStates.join(', ')}
                onChange={(e) =>
                  updateConfig({
                    acceptStates: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                  })
                }
              />
            </div>

            {/* Reject states */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                Reject States
              </label>
              <input
                className="input-field"
                value={localConfig.rejectStates.join(', ')}
                onChange={(e) =>
                  updateConfig({
                    rejectStates: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </div>

          {/* Initial tape contents */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Initial Tape Contents
            </label>
            {Array.from({ length: localConfig.numTapes }).map((_, i) => {
              const tapeValue = (localConfig.initialTapes[i] || []).join('');
              const validSymbols = [...localConfig.alphabet, localConfig.blankSymbol];
              const invalidChars = tapeValue.split('').filter(c => c.trim() !== '' && !validSymbols.includes(c));
              const hasInvalid = invalidChars.length > 0;

              return (
                <div key={i} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="tape-label" style={{ margin: 0, padding: 0, minWidth: '60px' }}>
                      <span className="tape-num">{i + 1}</span>
                    </span>
                    <input
                      className={`input-field${hasInvalid ? ' input-invalid' : ''}`}
                      value={tapeValue}
                      onChange={(e) => updateTapeInput(i, e.target.value)}
                      placeholder={`Tape ${i + 1} input (use alphabet: ${localConfig.alphabet.join(', ')})`}
                    />
                  </div>
                  {hasInvalid && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--accent-rose)',
                      marginTop: '2px',
                      marginLeft: '68px',
                    }}>
                      ⚠ Invalid symbol(s): {[...new Set(invalidChars)].map(c => `'${c}'`).join(', ')} — not in alphabet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div>
          {/* === EMPTY STATE MESSAGE (Feature 4) === */}
          {localConfig.transitions.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              textAlign: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(14, 165, 233, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                marginBottom: '4px',
              }}>
                📝
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
              }}>
                No transition rules defined
              </div>
              <div style={{
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                maxWidth: '240px',
              }}>
                Click &quot;Add Transition Rule&quot; below to begin building your Turing Machine.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '350px', overflowY: 'auto' }}>
              <table className="transition-table">
                <thead>
                  <tr>
                    <th>From</th>
                    {Array.from({ length: localConfig.numTapes }).map((_, i) => (
                      <th key={`r${i}`}>Read {i + 1}</th>
                    ))}
                    <th>To</th>
                    {Array.from({ length: localConfig.numTapes }).map((_, i) => (
                      <th key={`w${i}`}>Write {i + 1}</th>
                    ))}
                    {Array.from({ length: localConfig.numTapes }).map((_, i) => (
                      <th key={`d${i}`}>Dir {i + 1}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {localConfig.transitions.map((rule, idx) => {
                    const rowInvalid = isRowInvalid(idx);
                    const isExiting = exitingRows.has(idx);

                    return (
                      <tr
                        key={idx}
                        className={[
                          isActiveRule(rule) ? 'active-transition' : '',
                          rowInvalid ? 'transition-row-invalid' : '',
                          isExiting ? 'transition-row-exit' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        <td>
                          <Tooltip text={getFieldError(idx, 'fromState') || 'Source state'} position="bottom">
                            <input
                              className={`input-field${getFieldError(idx, 'fromState') ? ' input-invalid' : ''}`}
                              value={rule.fromState}
                              onChange={(e) => updateTransition(idx, { fromState: e.target.value })}
                              style={{ width: '60px' }}
                            />
                          </Tooltip>
                        </td>
                        {Array.from({ length: localConfig.numTapes }).map((_, i) => {
                          const err = getFieldError(idx, `readSymbols-${i}`);
                          return (
                            <td key={`r${i}`}>
                              <Tooltip text={err || `Read symbol for tape ${i + 1}`} position="bottom">
                                <input
                                  className={`input-field${err ? ' input-invalid' : ''}`}
                                  value={rule.readSymbols[i] || ''}
                                  onChange={(e) => {
                                    const newRead = [...rule.readSymbols];
                                    newRead[i] = e.target.value;
                                    updateTransition(idx, { readSymbols: newRead });
                                  }}
                                  style={{ width: '40px' }}
                                  maxLength={1}
                                />
                              </Tooltip>
                            </td>
                          );
                        })}
                        <td>
                          <Tooltip text={getFieldError(idx, 'toState') || 'Destination state'} position="bottom">
                            <input
                              className={`input-field${getFieldError(idx, 'toState') ? ' input-invalid' : ''}`}
                              value={rule.toState}
                              onChange={(e) => updateTransition(idx, { toState: e.target.value })}
                              style={{ width: '60px' }}
                            />
                          </Tooltip>
                        </td>
                        {Array.from({ length: localConfig.numTapes }).map((_, i) => {
                          const err = getFieldError(idx, `writeSymbols-${i}`);
                          return (
                            <td key={`w${i}`}>
                              <Tooltip text={err || `Write symbol for tape ${i + 1}`} position="bottom">
                                <input
                                  className={`input-field${err ? ' input-invalid' : ''}`}
                                  value={rule.writeSymbols[i] || ''}
                                  onChange={(e) => {
                                    const newWrite = [...rule.writeSymbols];
                                    newWrite[i] = e.target.value;
                                    updateTransition(idx, { writeSymbols: newWrite });
                                  }}
                                  style={{ width: '40px' }}
                                  maxLength={1}
                                />
                              </Tooltip>
                            </td>
                          );
                        })}
                        {Array.from({ length: localConfig.numTapes }).map((_, i) => (
                          <td key={`d${i}`}>
                            <select
                              className="input-field"
                              value={rule.directions[i] || 'S'}
                              onChange={(e) => {
                                const newDirs = [...rule.directions];
                                newDirs[i] = e.target.value as Direction;
                                updateTransition(idx, { directions: newDirs });
                              }}
                              style={{ width: '44px', padding: '4px' }}
                            >
                              {DIRECTION_OPTIONS.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </td>
                        ))}
                        <td>
                          <Tooltip text="Delete this rule" position="bottom">
                            <button
                              className="btn btn-danger btn-icon"
                              onClick={() => removeTransition(idx)}
                              style={{ width: '28px', height: '28px', fontSize: '14px' }}
                              title="Remove rule"
                            >
                              ×
                            </button>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <button
            className="btn btn-secondary"
            onClick={addTransition}
            style={{ marginTop: '10px', width: '100%' }}
          >
            + Add Transition Rule
          </button>
        </div>
      )}
    </div>
  );
}
