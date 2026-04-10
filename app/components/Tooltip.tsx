'use client';

import React from 'react';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom';
  children: React.ReactNode;
}

export default function Tooltip({ text, position = 'top', children }: TooltipProps) {
  return (
    <span className={`tooltip-wrapper${position === 'bottom' ? ' tooltip-bottom' : ''}`}>
      {children}
      <span className="tooltip-text">{text}</span>
    </span>
  );
}
