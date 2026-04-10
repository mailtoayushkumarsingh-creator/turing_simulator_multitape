'use client';

import React from 'react';
import { EXAMPLES } from '../lib/examples';

interface ExampleSelectorProps {
  currentExample: string;
  onSelect: (name: string) => void;
}

export default function ExampleSelector({
  currentExample,
  onSelect,
}: ExampleSelectorProps) {
  // Categorize: all predefined examples vs Custom
  const prebuiltExamples = EXAMPLES;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <label style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}>
        Load Example:
      </label>
      <select
        className="input-field"
        value={currentExample}
        onChange={(e) => onSelect(e.target.value)}
        style={{ maxWidth: '280px' }}
      >
        {/* Custom Machine group */}
        <optgroup label="⚙️ Custom Machine">
          <option value="">Custom — Build from scratch</option>
        </optgroup>

        {/* Prebuilt Examples group */}
        <optgroup label="📚 Prebuilt Examples">
          {prebuiltExamples.map(ex => (
            <option key={ex.name} value={ex.name}>
              {ex.name} ({ex.numTapes} {ex.numTapes === 1 ? 'tape' : 'tapes'})
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
