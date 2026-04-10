'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MachineConfig, TransitionRule, Direction } from '../lib/turingEngine';

interface TransitionTableProps {
  config: MachineConfig;
  onConfigChange: (config: MachineConfig) => void;
  activeTransition?: TransitionRule | null;
}

interface ValidationError {
  field: string;
  message: string;
}

const DIRECTION_OPTIONS: Direction[] = ['L', 'R', 'S'];
const DIRECTION_LABELS: Record<Direction, string> = { L: '← Left', R: 'Right →', S: '• Stay' };

function validateRule(
  rule: TransitionRule,
  config: MachineConfig,
  allRules: TransitionRule[],
  ruleIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!rule.fromState) {
    errors.push({ field: 'fromState', message: 'From state is required' });
  } else if (!config.states.includes(rule.fromState)) {
    errors.push({ field: 'fromState', message: `State "${rule.fromState}" is not defined` });
  }

  if (!rule.toState) {
    errors.push({ field: 'toState', message: 'To state is required' });
  } else if (!config.states.includes(rule.toState)) {
    errors.push({ field: 'toState', message: `State "${rule.toState}" is not defined` });
  }

  rule.readSymbols.forEach((sym, i) => {
    if (sym && sym !== '*' && !config.alphabet.includes(sym) && sym !== config.blankSymbol) {
      errors.push({ field: `readSymbols-${i}`, message: `Symbol "${sym}" not in alphabet` });
    }
  });

  rule.writeSymbols.forEach((sym, i) => {
    if (sym && sym !== '*' && !config.alphabet.includes(sym) && sym !== config.blankSymbol) {
      errors.push({ field: `writeSymbols-${i}`, message: `Symbol "${sym}" not in alphabet` });
    }
  });

  const isDuplicate = allRules.some(
    (other, idx) =>
      idx !== ruleIndex &&
      other.fromState === rule.fromState &&
      other.readSymbols.every((s, i) => s === rule.readSymbols[i])
  );
  if (isDuplicate) {
    errors.push({ field: 'duplicate', message: 'Duplicate rule (same state + read symbols)' });
  }

  return errors;
}

function formatTupleNotation(rule: TransitionRule, numTapes: number): { left: string; right: string } {
  const readSyms = rule.readSymbols.slice(0, numTapes).join(', ');
  const writeSyms = rule.writeSymbols.slice(0, numTapes).join(', ');
  const dirs = rule.directions.slice(0, numTapes).join(', ');
  return {
    left: `(${rule.fromState}, ${readSyms})`,
    right: `(${rule.toState}, ${writeSyms}, ${dirs})`,
  };
}

export default function TransitionTable({
  config,
  onConfigChange,
  activeTransition,
}: TransitionTableProps) {
  const [localConfig, setLocalConfig] = useState<MachineConfig>(config);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<TransitionRule | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newDraft, setNewDraft] = useState<TransitionRule | null>(null);
  const [exitingRows, setExitingRows] = useState<Set<number>>(new Set());
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const commitConfig = useCallback(
    (updates: Partial<MachineConfig>) => {
      const newConfig = { ...localConfig, ...updates };
      setLocalConfig(newConfig);
      onConfigChange(newConfig);
    },
    [localConfig, onConfigChange]
  );

  const isActiveRule = (rule: TransitionRule) => {
    if (!activeTransition) return false;
    return (
      rule.fromState === activeTransition.fromState &&
      rule.readSymbols.every((s, i) => s === activeTransition.readSymbols[i])
    );
  };

  // ── Inline edit ───────────────────────────────────────────────
  const startEditing = (idx: number) => {
    setEditingRow(idx);
    setEditDraft({ ...localConfig.transitions[idx] });
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditDraft(null);
  };

  const saveEditing = () => {
    if (editingRow === null || !editDraft) return;
    const errors = validateRule(editDraft, localConfig, localConfig.transitions, editingRow);
    if (errors.length > 0) {
      // Still allow save but show warning briefly
    }
    const newTransitions = [...localConfig.transitions];
    newTransitions[editingRow] = editDraft;
    commitConfig({ transitions: newTransitions });
    setEditingRow(null);
    setEditDraft(null);
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = useCallback(
    (idx: number) => {
      setExitingRows((prev) => new Set(prev).add(idx));
      setTimeout(() => {
        setExitingRows((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
        const newTransitions = localConfig.transitions.filter((_, i) => i !== idx);
        commitConfig({ transitions: newTransitions });
        if (editingRow === idx) cancelEditing();
      }, 280);
    },
    [localConfig, commitConfig, editingRow]
  );

  // ── Add new ───────────────────────────────────────────────────
  const startAdding = () => {
    setAddingNew(true);
    setDuplicateWarning(null);
    setNewDraft({
      fromState: localConfig.states[0] || 'q0',
      readSymbols: Array(localConfig.numTapes).fill(localConfig.blankSymbol),
      toState: localConfig.states[0] || 'q0',
      writeSymbols: Array(localConfig.numTapes).fill(localConfig.blankSymbol),
      directions: Array(localConfig.numTapes).fill('R' as Direction),
    });
  };

  const cancelAdding = () => {
    setAddingNew(false);
    setNewDraft(null);
    setDuplicateWarning(null);
  };

  const saveNewTransition = () => {
    if (!newDraft) return;
    // Check for duplicates
    const dup = localConfig.transitions.some(
      (t) =>
        t.fromState === newDraft.fromState &&
        t.readSymbols.every((s, i) => s === newDraft.readSymbols[i])
    );
    if (dup) {
      setDuplicateWarning('⚠ A rule with this state + read symbols already exists!');
      return;
    }
    commitConfig({ transitions: [...localConfig.transitions, newDraft] });
    setAddingNew(false);
    setNewDraft(null);
    setDuplicateWarning(null);
  };

  // ── Validation map ────────────────────────────────────────────
  const allErrors: ValidationError[][] = localConfig.transitions.map((rule, idx) =>
    validateRule(rule, localConfig, localConfig.transitions, idx)
  );

  const hasFieldError = (ruleIdx: number, field: string) =>
    allErrors[ruleIdx]?.some((e) => e.field === field) ?? false;

  const rowHasErrors = (ruleIdx: number) => (allErrors[ruleIdx]?.length ?? 0) > 0;

  // ── Render helpers ────────────────────────────────────────────
  const renderReadOnlyRow = (rule: TransitionRule, idx: number) => {
    const active = isActiveRule(rule);
    const invalid = rowHasErrors(idx);
    const exiting = exitingRows.has(idx);
    const errors = allErrors[idx] ?? [];
    const hasDup = errors.some((e) => e.field === 'duplicate');
    const notation = formatTupleNotation(rule, localConfig.numTapes);

    return (
      <tr
        key={idx}
        className={[
          'tt-row',
          active ? 'tt-row-active' : '',
          invalid ? 'tt-row-invalid' : '',
          exiting ? 'tt-row-exit' : '',
          idx % 2 === 0 ? 'tt-row-even' : 'tt-row-odd',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <td className="tt-cell tt-cell-index">{idx + 1}</td>
        <td className="tt-cell tt-cell-state">
          <span className="tt-state-badge">{rule.fromState}</span>
        </td>
        {rule.readSymbols.slice(0, localConfig.numTapes).map((sym, i) => (
          <td key={`r${i}`} className="tt-cell tt-cell-symbol">
            <span className="tt-symbol">{sym}</span>
          </td>
        ))}
        <td className="tt-cell tt-cell-arrow">→</td>
        <td className="tt-cell tt-cell-state">
          <span className="tt-state-badge tt-state-badge-to">{rule.toState}</span>
        </td>
        {rule.writeSymbols.slice(0, localConfig.numTapes).map((sym, i) => (
          <td key={`w${i}`} className="tt-cell tt-cell-symbol">
            <span className="tt-symbol tt-symbol-write">{sym}</span>
          </td>
        ))}
        {rule.directions.slice(0, localConfig.numTapes).map((dir, i) => (
          <td key={`d${i}`} className="tt-cell tt-cell-dir">
            <span className={`tt-dir tt-dir-${dir}`}>{dir}</span>
          </td>
        ))}
        <td className="tt-cell tt-cell-notation">
          <span className="tt-notation-text">
            {notation.left} → {notation.right}
          </span>
        </td>
        <td className="tt-cell tt-cell-actions">
          <div className="tt-action-group">
            <button
              className="tt-action-btn tt-edit-btn"
              title="Edit transition"
              onClick={() => startEditing(idx)}
            >
              ✏️
            </button>
            <button
              className="tt-action-btn tt-delete-btn"
              title="Delete transition"
              onClick={() => handleDelete(idx)}
            >
              🗑️
            </button>
          </div>
        </td>
        {hasDup && (
          <td className="tt-cell" style={{ position: 'absolute', right: 0 }}>
            <span className="tt-dup-badge">DUPLICATE</span>
          </td>
        )}
      </tr>
    );
  };

  const renderEditableRow = (rule: TransitionRule, idx: number | 'new', draft: TransitionRule) => {
    const isNew = idx === 'new';
    const setDraft = isNew
      ? (fn: (prev: TransitionRule) => TransitionRule) => setNewDraft((prev) => (prev ? fn(prev) : prev))
      : (fn: (prev: TransitionRule) => TransitionRule) => setEditDraft((prev) => (prev ? fn(prev) : prev));

    return (
      <tr key={isNew ? 'new' : idx} className="tt-row tt-row-editing">
        <td className="tt-cell tt-cell-index">{isNew ? '+' : (idx as number) + 1}</td>
        <td className="tt-cell">
          <input
            className="tt-inline-input"
            value={draft.fromState}
            onChange={(e) => setDraft((d) => ({ ...d, fromState: e.target.value }))}
            placeholder="q0"
          />
        </td>
        {draft.readSymbols.slice(0, localConfig.numTapes).map((sym, i) => (
          <td key={`r${i}`} className="tt-cell">
            <input
              className="tt-inline-input tt-inline-sym"
              value={sym}
              maxLength={1}
              onChange={(e) =>
                setDraft((d) => {
                  const newRead = [...d.readSymbols];
                  newRead[i] = e.target.value;
                  return { ...d, readSymbols: newRead };
                })
              }
            />
          </td>
        ))}
        <td className="tt-cell tt-cell-arrow">→</td>
        <td className="tt-cell">
          <input
            className="tt-inline-input"
            value={draft.toState}
            onChange={(e) => setDraft((d) => ({ ...d, toState: e.target.value }))}
            placeholder="q1"
          />
        </td>
        {draft.writeSymbols.slice(0, localConfig.numTapes).map((sym, i) => (
          <td key={`w${i}`} className="tt-cell">
            <input
              className="tt-inline-input tt-inline-sym"
              value={sym}
              maxLength={1}
              onChange={(e) =>
                setDraft((d) => {
                  const newWrite = [...d.writeSymbols];
                  newWrite[i] = e.target.value;
                  return { ...d, writeSymbols: newWrite };
                })
              }
            />
          </td>
        ))}
        {draft.directions.slice(0, localConfig.numTapes).map((dir, i) => (
          <td key={`d${i}`} className="tt-cell">
            <select
              className="tt-inline-select"
              value={dir}
              onChange={(e) =>
                setDraft((d) => {
                  const newDirs = [...d.directions];
                  newDirs[i] = e.target.value as Direction;
                  return { ...d, directions: newDirs };
                })
              }
            >
              {DIRECTION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </td>
        ))}
        <td className="tt-cell tt-cell-notation" />
        <td className="tt-cell tt-cell-actions">
          <div className="tt-action-group">
            <button
              className="tt-action-btn tt-save-btn"
              title={isNew ? 'Add transition' : 'Save changes'}
              onClick={isNew ? saveNewTransition : saveEditing}
            >
              ✓
            </button>
            <button
              className="tt-action-btn tt-cancel-btn"
              title="Cancel"
              onClick={isNew ? cancelAdding : cancelEditing}
            >
              ✕
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="glass-card tt-container">
      {/* Header */}
      <div className="tt-header">
        <div className="section-title" style={{ margin: 0 }}>
          <span className="icon">📋</span>
          Transition Table
          <span className="tt-count-badge">{localConfig.transitions.length} rules</span>
        </div>
        <button className="btn btn-primary tt-add-btn" onClick={startAdding} disabled={addingNew}>
          <span style={{ fontSize: '15px' }}>+</span> Add Transition
        </button>
      </div>

      {/* Duplicate warning */}
      {duplicateWarning && (
        <div className="tt-warning-banner">
          {duplicateWarning}
        </div>
      )}

      {/* Table */}
      <div className="tt-table-wrapper">
        <table className="tt-table">
          <thead>
            <tr>
              <th className="tt-th tt-th-index">#</th>
              <th className="tt-th">Current State</th>
              {Array.from({ length: localConfig.numTapes }).map((_, i) => (
                <th key={`rh${i}`} className="tt-th">
                  Read<sub>{i + 1}</sub>
                </th>
              ))}
              <th className="tt-th tt-th-arrow" />
              <th className="tt-th">Next State</th>
              {Array.from({ length: localConfig.numTapes }).map((_, i) => (
                <th key={`wh${i}`} className="tt-th">
                  Write<sub>{i + 1}</sub>
                </th>
              ))}
              {Array.from({ length: localConfig.numTapes }).map((_, i) => (
                <th key={`dh${i}`} className="tt-th">
                  Move<sub>{i + 1}</sub>
                </th>
              ))}
              <th className="tt-th tt-th-notation">Formal Notation</th>
              <th className="tt-th tt-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {localConfig.transitions.map((rule, idx) =>
              editingRow === idx && editDraft
                ? renderEditableRow(rule, idx, editDraft)
                : renderReadOnlyRow(rule, idx)
            )}
            {addingNew && newDraft && renderEditableRow(null as unknown as TransitionRule, 'new', newDraft)}
          </tbody>
        </table>

        {localConfig.transitions.length === 0 && !addingNew && (
          <div className="tt-empty-state">
            <span style={{ fontSize: '28px' }}>📭</span>
            <p>No transition rules defined yet.</p>
            <button className="btn btn-secondary" onClick={startAdding}>
              + Add your first transition
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="tt-legend">
        <div className="tt-legend-item">
          <span className="tt-legend-swatch tt-legend-active" />
          Active transition
        </div>
        <div className="tt-legend-item">
          <span className="tt-legend-swatch tt-legend-invalid" />
          Invalid / duplicate
        </div>
        <div className="tt-legend-item">
          <span className="tt-legend-sym">L</span> = Left&ensp;
          <span className="tt-legend-sym">R</span> = Right&ensp;
          <span className="tt-legend-sym">S</span> = Stay
        </div>
      </div>
    </div>
  );
}
