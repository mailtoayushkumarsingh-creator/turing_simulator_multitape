'use client';

import React, { useRef, useEffect } from 'react';

interface StateFlowProps {
  stateHistory: string[];
  currentState: string;
  status: 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition';
  acceptStates: string[];
  rejectStates: string[];
}

export default function StateFlow({
  stateHistory,
  currentState,
  status,
  acceptStates,
  rejectStates,
}: StateFlowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the right when new states are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [stateHistory]);

  const getNodeClass = (state: string, index: number): string => {
    const isLast = index === stateHistory.length - 1;
    const isAccept = acceptStates.includes(state);
    const isReject = rejectStates.includes(state);

    let cls = 'sf-node';

    if (isLast) {
      cls += ' sf-node-current';
      if (isAccept) cls += ' sf-node-accept';
      else if (isReject) cls += ' sf-node-reject';
    } else {
      // Past states
      cls += ' sf-node-past';
      if (isAccept) cls += ' sf-node-accept-past';
      else if (isReject) cls += ' sf-node-reject-past';
    }

    return cls;
  };

  return (
    <div className="glass-card sf-container">
      <div className="sf-header">
        <div className="section-title" style={{ margin: 0 }}>
          <span className="icon">🔀</span>
          State Flow
        </div>
        <span className="sf-count-badge">
          {stateHistory.length} state{stateHistory.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="sf-scroll-area" ref={scrollRef}>
        {stateHistory.length === 0 ? (
          <div className="sf-empty">
            No states visited yet. Press Step or Play to begin.
          </div>
        ) : (
          <div className="sf-flow">
            {stateHistory.map((state, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <div className="sf-arrow-wrapper">
                    <svg
                      width="32"
                      height="16"
                      viewBox="0 0 32 16"
                      className="sf-arrow-svg"
                    >
                      <line
                        x1="0"
                        y1="8"
                        x2="24"
                        y2="8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="3,2"
                      />
                      <polygon
                        points="22,4 30,8 22,12"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                )}
                <div
                  className={getNodeClass(state, index)}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <span className="sf-node-label">{state}</span>
                  {index === stateHistory.length - 1 && status === 'running' && (
                    <span className="sf-pulse-ring" />
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
