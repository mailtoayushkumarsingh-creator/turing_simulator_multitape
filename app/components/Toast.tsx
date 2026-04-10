'use client';

import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

const TOAST_ICONS: Record<ToastMessage['type'], string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colorMap: Record<ToastMessage['type'], { bg: string; border: string; color: string }> = {
    success: {
      bg: 'rgba(5, 150, 105, 0.12)',
      border: 'rgba(5, 150, 105, 0.35)',
      color: 'var(--accent-emerald)',
    },
    error: {
      bg: 'rgba(186, 26, 26, 0.12)',
      border: 'rgba(186, 26, 26, 0.35)',
      color: 'var(--accent-rose)',
    },
    warning: {
      bg: 'rgba(138, 81, 0, 0.12)',
      border: 'rgba(138, 81, 0, 0.35)',
      color: 'var(--accent-amber)',
    },
    info: {
      bg: 'rgba(14, 165, 233, 0.12)',
      border: 'rgba(14, 165, 233, 0.35)',
      color: 'var(--accent-cyan-light, #0ea5e9)',
    },
  };

  const scheme = colorMap[toast.type];

  return (
    <div
      className={`toast-item ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{
        background: scheme.bg,
        border: `1.5px solid ${scheme.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={() => {
        setExiting(true);
        setTimeout(onDismiss, 300);
      }}
    >
      <span className="toast-icon">{TOAST_ICONS[toast.type]}</span>
      <span className="toast-message" style={{ color: scheme.color }}>
        {toast.message}
      </span>
    </div>
  );
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}
