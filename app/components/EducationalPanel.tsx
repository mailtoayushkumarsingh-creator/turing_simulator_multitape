'use client';

import React, { useState } from 'react';

export default function EducationalPanel() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const sections = [
    {
      id: 'robust',
      title: '🔧 Building Robust Machines',
      content: `When designing multi-tape Turing machines, it's critical to account for all possible inputs:

• Complete Transition Coverage: For each state, define transitions for every possible combination of tape symbols. Missing transitions cause the machine to halt or reject unexpectedly.

• Use Safe Mode: Enable Safe Mode (🛡️) to automatically reject on missing transitions instead of halting silently. This helps identify gaps in your transition function.

• Always Define Reject States: Include a reject state (e.g., qReject) so the machine can cleanly reject invalid inputs rather than getting stuck.

• Test Your Machine: Use the Test Runner (🧪) to verify your machine handles both valid and invalid inputs correctly.

• Check Coverage: The Transition Coverage panel (⚠️) shows which state-symbol combinations are missing transitions. Use "Auto-fill → qReject" to quickly complete your transition function.

Tip: A well-designed Turing machine should never halt — it should always reach either an accept or reject state for any input.`,
    },
    {
      id: 'what',
      title: '🤖 What is a Turing Machine?',
      content: `A Turing machine is a mathematical model of computation invented by Alan Turing in 1936. It consists of:

• An infinite tape divided into cells, each containing a symbol
• A head that can read and write symbols on the tape and move left or right
• A state register that stores the current state of the machine
• A finite table of transition rules that determine the machine's behavior

Despite its simplicity, a Turing machine can simulate any computer algorithm. It is the foundation of the theory of computation and helps us understand what problems can (and cannot) be solved by computers.`,
    },
    {
      id: 'multi',
      title: '📼 Multi-Tape Machines',
      content: `A multi-tape Turing machine extends the standard model with multiple tapes, each with its own independently controlled read/write head. This allows:

• Simultaneous access to different parts of the data
• One tape for input, another for working memory, another for output
• Parallel data manipulation without the overhead of searching

In a single step, a multi-tape machine can read from all tapes simultaneously, write to all tapes, and move each head independently. This makes many algorithms much more natural and efficient to express.`,
    },
    {
      id: 'equivalence',
      title: '🔄 Equivalence Theorem',
      content: `One of the most important results in computability theory:

Every multi-tape Turing machine can be simulated by a single-tape Turing machine.

This means multi-tape machines don't compute anything that a single-tape machine can't. However, the simulation comes with a cost:

• If a k-tape machine takes t steps, the single-tape simulation requires O(t²) steps
• The single-tape machine must encode all k tapes onto one tape with special markers
• Each simulated step requires sweeping across the entire tape to find all virtual heads

This quadratic slowdown is the key insight visualized in the Efficiency Comparison panel.`,
    },
    {
      id: 'efficiency',
      title: '⚡ Why Multi-Tape is Faster',
      content: `The efficiency advantage of multi-tape machines comes from eliminating unnecessary data movement:

Example — String Copy:
• Multi-tape (2 tapes): Read from tape 1, write to tape 2 simultaneously → O(n) steps
• Single-tape: Must shuttle back and forth between input and output regions → O(n²) steps

Example — Binary Addition:
• Multi-tape (3 tapes): Read both operands in parallel, write result directly → O(n) steps
• Single-tape: Must repeatedly scan to find matching digit positions → O(n²) steps

While both machines compute the same result, the multi-tape machine does it with far fewer steps. This is why real computers use multiple storage devices (RAM, registers, cache) rather than a single sequential tape!`,
    },
  ];

  return (
    <div className="glass-card" style={{ padding: '16px' }}>
      <div className="section-title">
        <span className="icon">📚</span>
        Learn More
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sections.map(section => (
          <div key={section.id}>
            <button
              onClick={() => toggle(section.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: openSection === section.id
                  ? 'rgba(8, 145, 178, 0.06)'
                  : 'rgba(226, 232, 240, 0.5)',
                border: '1px solid',
                borderColor: openSection === section.id
                  ? 'rgba(8, 145, 178, 0.2)'
                  : 'transparent',
                borderRadius: '8px',
                color: openSection === section.id
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span>{section.title}</span>
              <span style={{
                transform: openSection === section.id ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease',
                fontSize: '10px',
                color: 'var(--text-muted)',
              }}>
                ▼
              </span>
            </button>
            <div
              className={`edu-panel${openSection === section.id ? ' open' : ''}`}
            >
              <div style={{
                padding: '12px 14px',
                fontSize: '13px',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-line',
              }}>
                {section.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feature 10: Conclusion Section */}
      <div style={{
        marginTop: '14px',
        padding: '14px 16px',
        background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.06), rgba(124, 58, 237, 0.06))',
        borderRadius: '10px',
        border: '1px solid rgba(8, 145, 178, 0.15)',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          🎯 Conclusion
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
        }}>
          Multi-tape Turing Machines do not increase computational power,
          but significantly improve efficiency by reducing repeated tape scans.
          Any problem solvable by a multi-tape machine can also be solved by a single-tape
          machine — just with more steps.
        </div>
      </div>

      {/* Feature 8: Key Takeaways */}
      <div style={{
        marginTop: '10px',
        padding: '14px 16px',
        background: 'rgba(5, 150, 105, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(5, 150, 105, 0.15)',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--accent-emerald)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          📌 Key Takeaways
        </div>
        <ul style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
          margin: 0,
          paddingLeft: '20px',
        }}>
          <li>Multi-tape Turing Machines are more <strong style={{ color: 'var(--text-primary)' }}>efficient</strong> but not more <strong style={{ color: 'var(--text-primary)' }}>powerful</strong></li>
          <li>They reduce repeated scanning of the tape</li>
          <li>They are equivalent to single-tape machines in computation ability</li>
        </ul>
      </div>
    </div>
  );
}
