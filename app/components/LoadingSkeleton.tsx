'use client';

import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="app-grid" style={{ opacity: 1 }}>
      {/* Header skeleton */}
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="skeleton skeleton-header" />
      </div>

      {/* Main area skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Description card */}
        <div className="skeleton" style={{ height: '60px', borderRadius: '16px' }} />
        {/* Tape area */}
        <div className="skeleton skeleton-card" />
        {/* Step explanation */}
        <div className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
      </div>

      {/* Sidebar skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton skeleton-card-tall" />
        <div className="skeleton skeleton-card" />
      </div>

      {/* Bottom bar skeleton */}
      <div style={{ gridColumn: '1 / -1' }}>
        <div className="skeleton skeleton-bar" />
      </div>
    </div>
  );
}
