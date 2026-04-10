'use client';

import React, { useEffect } from 'react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Space'], description: 'Play / Pause simulation' },
  { keys: ['→'], description: 'Step forward one transition' },
  { keys: ['←'], description: 'Step back one transition' },
  { keys: ['R'], description: 'Reset machine to initial state' },
  { keys: ['?'], description: 'Toggle this shortcuts panel' },
];

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div style={{
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ⌨️ Keyboard Shortcuts
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginBottom: '18px',
        }}>
          Use these shortcuts to control the simulation without clicking.
        </div>

        <table className="shortcuts-table">
          <tbody>
            {SHORTCUTS.map((shortcut, idx) => (
              <tr key={idx}>
                <td>
                  {shortcut.keys.map((key, ki) => (
                    <span key={ki} className="kbd">{key}</span>
                  ))}
                </td>
                <td>{shortcut.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{
          marginTop: '16px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          Shortcuts are disabled when typing in input fields.
        </div>
      </div>
    </div>
  );
}
