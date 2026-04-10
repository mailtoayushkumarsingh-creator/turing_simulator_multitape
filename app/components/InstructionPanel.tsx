'use client';

import React, { useState } from 'react';

interface InstructionPanelProps {
  isCustomMode: boolean;
}

export default function InstructionPanel({ isCustomMode }: InstructionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isCustomMode) return null;

  return (
    <div className="glass-card instruction-panel" style={{ padding: '18px 20px', overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="section-title" style={{ margin: 0 }}>
          <span className="icon">📖</span>
          How to Use — Custom Mode
        </div>
        <span
          style={{
            fontSize: '16px',
            color: 'var(--text-muted)',
            transition: 'transform 0.3s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▾
        </span>
      </div>

      <div
        style={{
          maxHeight: isExpanded ? '600px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div style={{ paddingTop: '14px' }}>
          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <StepItem
              number={1}
              title="Enter Input String"
              description="Go to the Settings tab and type your input into the 'Enter Input String (Tape 1)' field."
              color="var(--accent-cyan-light, #0ea5e9)"
            />
            <StepItem
              number={2}
              title="Define Transition Rules"
              description="Switch to the 'Transition Rules' tab and add your δ-function rules one by one."
              color="var(--accent-emerald)"
            />
            <StepItem
              number={3}
              title="Run the Simulation"
              description="Click ▶ Play to auto-run, or use Step (→) for one transition at a time."
              color="var(--accent-violet)"
            />
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'var(--border-glass)',
            margin: '6px 0 14px',
          }} />

          {/* Example callout */}
          <div
            style={{
              background: 'rgba(14, 165, 233, 0.06)',
              border: '1px solid rgba(14, 165, 233, 0.15)',
              borderRadius: '10px',
              padding: '12px 14px',
            }}
          >
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-cyan-light, #0ea5e9)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              💡 Example: Implementing aⁿbⁿ
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              <div style={{ marginBottom: '4px' }}>
                The classic language <code style={{
                  background: 'rgba(14, 165, 233, 0.1)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>{'{ aⁿbⁿ | n ≥ 1 }'}</code> accepts strings like <strong>ab, aabb, aaabbb</strong>.
              </div>
              <ul style={{
                margin: '6px 0 0',
                paddingLeft: '16px',
                fontSize: '11.5px',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
              }}>
                <li>Find the leftmost <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>a</code> → mark it as <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>X</code></li>
                <li>Scan right to find the matching <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>b</code> → mark it as <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Y</code></li>
                <li>Rewind and repeat until all symbols are matched</li>
                <li>Accept if everything is paired, reject otherwise</li>
              </ul>
            </div>
          </div>

          {/* Tip */}
          <div style={{
            marginTop: '12px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>⌨️</span>
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}>
              <strong>Tip:</strong> Use the template buttons below to load pre-built machines and study how they work!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({
  number,
  title,
  description,
  color,
}: {
  number: number;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
    }}>
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '8px',
          background: `${color}18`,
          border: `1.5px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 800,
          color: color,
          flexShrink: 0,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {number}
      </div>
      <div>
        <div style={{
          fontSize: '12.5px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '1px',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '11.5px',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}>
          {description}
        </div>
      </div>
    </div>
  );
}
