'use client';

import React from 'react';
import { MachineSnapshot } from '../lib/turingEngine';

interface StepExplanationProps {
  snapshot: MachineSnapshot;
  numTapes: number;
  learningMode?: boolean;
}

function directionName(d: string): string {
  switch (d) {
    case 'L': return 'Left';
    case 'R': return 'Right';
    case 'S': return 'Stay';
    default: return d;
  }
}

function generateActionSummary(snapshot: MachineSnapshot, numTapes: number): string {
  const t = snapshot.lastTransition;
  if (!t) return '';

  // Build a concise one-line summary
  const writtenParts: string[] = [];
  t.writeSymbols.forEach((sym, i) => {
    if (sym !== '*' && sym !== t.readSymbols[i]) {
      writtenParts.push(`'${sym}' to Tape ${i + 1}`);
    }
  });

  if (writtenParts.length > 0) {
    const readParts = t.readSymbols.map((sym, i) =>
      `'${sym}' from Tape ${i + 1}`
    ).join(', ');
    return `Reading ${readParts}, writing ${writtenParts.join(' and ')}`;
  }

  // If nothing written differently, describe the movement
  const moveParts: string[] = [];
  t.directions.forEach((d, i) => {
    if (d !== 'S') moveParts.push(`Tape ${i + 1} ${directionName(d)}`);
  });

  if (moveParts.length > 0) {
    return `Scanning: moving ${moveParts.join(', ')}`;
  }

  return `Processing in state ${t.fromState}`;
}

/** Classify the current operation conceptually for learning mode */
function classifyOperation(snapshot: MachineSnapshot): { concept: string; icon: string; explanation: string } {
  const t = snapshot.lastTransition;
  if (!t) return { concept: 'Idle', icon: '⏸️', explanation: 'Machine is ready to begin.' };

  const hasWrite = t.writeSymbols.some((s, i) => s !== '*' && s !== t.readSymbols[i]);
  const allStay = t.directions.every(d => d === 'S');
  const allLeft = t.directions.every(d => d === 'L' || d === 'S');
  const allRight = t.directions.every(d => d === 'R' || d === 'S');

  // Detect marking operations (writing a different symbol to mark)
  const isMarking = hasWrite && t.writeSymbols.some((s, i) =>
    s !== '*' && s !== t.readSymbols[i] && s !== 'B'
  );

  // Detect erasing (writing blank)
  const isErasing = hasWrite && t.writeSymbols.some((s) => s === 'B');

  // Detect copying (reading from one tape, writing same to another)
  const isCopying = t.readSymbols.some((rsym, i) =>
    t.writeSymbols.some((wsym, j) => j !== i && wsym === rsym && wsym !== '*' && wsym !== 'B')
  );

  if (snapshot.status === 'accepted') {
    return {
      concept: 'Accepting',
      icon: '✅',
      explanation: `The machine has reached accept state "${t.toState}". All conditions for acceptance are met — the input is valid for this machine's language.`
    };
  }
  if (snapshot.status === 'rejected') {
    return {
      concept: 'Rejecting',
      icon: '❌',
      explanation: `The machine has reached reject state "${t.toState}". The input does not satisfy the requirements. This means the input is NOT in the language recognized by this machine.`
    };
  }

  if (isCopying) {
    return {
      concept: 'Copying',
      icon: '📋',
      explanation: `The machine is copying data between tapes. It reads symbol(s) from one tape and writes the same value to another, allowing parallel data duplication.`
    };
  }
  if (isMarking) {
    const from = t.readSymbols.filter((s, i) => t.writeSymbols[i] !== '*' && t.writeSymbols[i] !== s).join(', ');
    const to = t.writeSymbols.filter((s, i) => s !== '*' && s !== t.readSymbols[i]).join(', ');
    return {
      concept: 'Marking',
      icon: '✏️',
      explanation: `The machine marks symbol '${from}' → '${to}' to remember it has been processed. This is a common technique: symbols are replaced with markers so the machine doesn't process them again on future passes.`
    };
  }
  if (isErasing) {
    return {
      concept: 'Erasing',
      icon: '🧹',
      explanation: `The machine is erasing (writing blank). This clears previously written data or resets tape cells.`
    };
  }
  if (allStay && !hasWrite) {
    return {
      concept: 'Transitioning',
      icon: '🔄',
      explanation: `The machine changes its internal state without moving or writing. This is a pure state transition — the machine is preparing for a different phase of computation.`
    };
  }
  if (allLeft) {
    return {
      concept: 'Rewinding',
      icon: '⏪',
      explanation: `The machine is moving left (rewinding). After processing symbols to the right, TMs often need to rewind back to the beginning to start a new scanning pass. This back-and-forth pattern is fundamental to how TMs process data.`
    };
  }
  if (allRight && !hasWrite) {
    return {
      concept: 'Scanning',
      icon: '🔍',
      explanation: `The machine is scanning right — reading symbols without modifying them. It's searching for a specific symbol or pattern. The current read symbols will determine which transition fires next.`
    };
  }
  if (hasWrite) {
    return {
      concept: 'Writing',
      icon: '✍️',
      explanation: `The machine writes new symbol(s) and moves the head(s). This is the core computation step: the machine transforms the tape content based on its transition rules.`
    };
  }

  return {
    concept: 'Processing',
    icon: '⚙️',
    explanation: `The machine is executing a computation step — reading, potentially writing, and moving heads according to its transition function δ(state, read) → (state', write, move).`
  };
}

function generateLearningExplanation(snapshot: MachineSnapshot, numTapes: number): string {
  const t = snapshot.lastTransition;
  if (!t) return '';

  const parts: string[] = [];

  // Why did this transition fire?
  const readDesc = t.readSymbols.map((sym, i) =>
    sym === '*' ? `any symbol on Tape ${i + 1}` : `'${sym}' on Tape ${i + 1}`
  ).join(' and ');
  parts.push(`🔎 The machine is in state "${t.fromState}" and reads ${readDesc}.`);
  parts.push(`This matches a transition rule, so it fires.`);

  // What does it do?
  const writeActions: string[] = [];
  t.writeSymbols.forEach((sym, i) => {
    if (sym === '*') {
      writeActions.push(`Tape ${i + 1}: keeps current symbol`);
    } else if (sym === t.readSymbols[i]) {
      writeActions.push(`Tape ${i + 1}: no change ('${sym}')`);
    } else {
      writeActions.push(`Tape ${i + 1}: overwrites '${t.readSymbols[i]}' → '${sym}'`);
    }
  });
  if (writeActions.length > 0) {
    parts.push(`✍️ Write actions: ${writeActions.join('; ')}.`);
  }

  // Head movements
  const moveDesc = t.directions.map((d, i) => {
    if (d === 'L') return `Tape ${i + 1} moves ← Left`;
    if (d === 'R') return `Tape ${i + 1} moves → Right`;
    return `Tape ${i + 1} stays in place`;
  }).join(', ');
  parts.push(`🔄 Head movement: ${moveDesc}.`);

  // State change
  if (t.fromState !== t.toState) {
    parts.push(`📍 State changes: ${t.fromState} → ${t.toState}`);
  } else {
    parts.push(`📍 Remains in state: ${t.fromState} (self-loop — still processing)`);
  }

  return parts.join('\n');
}

export default function StepExplanation({ snapshot, numTapes, learningMode = false }: StepExplanationProps) {
  const { step, lastTransition, status } = snapshot;

  if (step === 0 && !lastTransition) {
    return (
      <div className="glass-card" style={{ padding: '16px' }}>
        <div className="section-title">
          <span className="icon">📖</span>
          Step Explanation
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          lineHeight: 1.7,
          padding: '8px 12px',
          background: 'rgba(226, 232, 240, 0.5)',
          borderRadius: '10px',
          textAlign: 'center',
        }}>
          Press <strong style={{ color: 'var(--text-secondary)' }}>Step</strong> or <strong style={{ color: 'var(--text-secondary)' }}>Play</strong> to begin. Each step will be explained here.
          {learningMode && (
            <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--accent-violet)' }}>
              🎓 Learning Mode is ON — you&apos;ll get detailed explanations for every step.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Build explanation text
  const t = lastTransition;
  let readLine = '';
  let writeLine = '';
  let moveLine = '';
  let transLine = '';

  if (t) {
    const readParts = t.readSymbols.map((sym, i) =>
      `'${sym}' from Tape ${i + 1}`
    );
    readLine = `Reading ${readParts.join(' and ')}.`;

    const writeParts: string[] = [];
    t.writeSymbols.forEach((sym, i) => {
      if (sym !== '*') {
        writeParts.push(`'${sym}' on Tape ${i + 1}`);
      }
    });
    writeLine = writeParts.length > 0
      ? `Writing ${writeParts.join(' and ')}.`
      : 'No symbols written (unchanged).';

    const moveParts = t.directions.map((d, i) =>
      `${directionName(d)} (Tape ${i + 1})`
    );
    moveLine = `Moving heads: ${moveParts.join(', ')}.`;
    transLine = `Transition: (${t.fromState} → ${t.toState})`;
  }

  // Current action summary
  const actionSummary = generateActionSummary(snapshot, numTapes);

  // Learning mode analysis
  const operation = classifyOperation(snapshot);
  const learningDetail = learningMode && t ? generateLearningExplanation(snapshot, numTapes) : '';

  // Status message
  let statusMsg = '';
  if (status === 'accepted') statusMsg = '✅ Machine has ACCEPTED the input.';
  else if (status === 'rejected') statusMsg = '❌ Machine has REJECTED the input.';
  else if (status === 'halted') statusMsg = '⏹ Machine has HALTED (no matching transition).';
  else if (status === 'missing_transition') statusMsg = '🔴 Missing transition detected — define the transition or enable Safe Mode.';

  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <div className="section-title">
        <span className="icon">📖</span>
        Step Explanation
        {learningMode && (
          <span style={{
            marginLeft: '8px',
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '6px',
            background: 'rgba(124, 58, 237, 0.1)',
            color: 'var(--accent-violet)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
          }}>
            🎓 LEARNING
          </span>
        )}
      </div>

      {/* Feature 2: Current Action Summary */}
      {actionSummary && (
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--accent-emerald)',
          padding: '8px 14px',
          marginBottom: '8px',
          background: 'rgba(0, 184, 148, 0.08)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 184, 148, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '14px' }}>⚡</span>
          Current Action: {actionSummary}
        </div>
      )}

      {/* Learning Mode: Concept Tag */}
      {learningMode && t && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}>
          <span className="concept-tag">
            {operation.icon} {operation.concept}
          </span>
        </div>
      )}

      <div style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: 1.8,
        padding: '10px 14px',
        background: 'rgba(226, 232, 240, 0.5)',
        borderRadius: '10px',
      }}>
        <div style={{
          fontWeight: 700,
          color: 'var(--accent-cyan)',
          marginBottom: '6px',
          fontSize: '14px',
        }}>
          Step {step}:
        </div>
        {t && (
          <>
            <div>{readLine}</div>
            <div>{writeLine}</div>
            <div>{moveLine}</div>
            <div style={{
              color: 'var(--accent-violet)',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              marginTop: '4px',
            }}>
              {transLine}
            </div>
          </>
        )}
        {statusMsg && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: status === 'accepted'
              ? 'rgba(5, 150, 105, 0.08)'
              : status === 'rejected'
                ? 'rgba(225, 29, 72, 0.08)'
                : 'rgba(217, 119, 6, 0.08)',
            fontWeight: 600,
            color: status === 'accepted'
              ? 'var(--accent-emerald)'
              : status === 'rejected'
                ? 'var(--accent-rose)'
                : 'var(--accent-amber)',
          }}>
            {statusMsg}
          </div>
        )}
      </div>

      {/* Learning Mode: Detailed Explanation Panel */}
      {learningMode && t && (
        <div className="learning-detail">
          <div className="learning-detail-title">
            🎓 Why This Happened
          </div>
          <div style={{ whiteSpace: 'pre-line' }}>
            {learningDetail}
          </div>
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(14, 165, 233, 0.06)',
            border: '1px solid rgba(14, 165, 233, 0.12)',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--accent-cyan)' }}>💡 Insight:</strong> {operation.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
