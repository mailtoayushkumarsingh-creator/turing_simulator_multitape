'use client';

import React, { useMemo, useState } from 'react';
import type { MachineConfig, TransitionRule } from '../lib/turingEngine';

// ===== Props =====
export interface StateDiagramProps {
  config: MachineConfig;
  currentState: string;
  status: 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition';
  lastTransition?: TransitionRule | null;
}

// ── Constants ─────────────────────────────────────────────────────────────
const NR = 22; // node radius
const LOOP_CLEARANCE = 90; // px of vertical space at top for self-loop arcs

// ── Layout ────────────────────────────────────────────────────────────────
function layoutStates(stateList: string[], W: number, H: number) {
  const n = stateList.length;
  if (n === 0) return {} as Record<string, { x: number; y: number }>;

  // Usable drawing area: leave LOOP_CLEARANCE at top, 50px padding everywhere else
  const padX = 70;
  const padTop = LOOP_CLEARANCE + NR + 10;
  const padBot = NR + 30;

  const drawW = W - padX * 2;
  const drawH = H - padTop - padBot;
  const cx = W / 2;
  const cy = padTop + drawH / 2;

  if (n === 1) return { [stateList[0]]: { x: cx, y: cy } };

  // Ellipse radii that keep all nodes strictly inside
  const rx = Math.min(drawW / 2, 270);
  const ry = Math.min(drawH / 2, 150);

  const pos: Record<string, { x: number; y: number }> = {};
  stateList.forEach((s, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    // Clamp to [NR+padX, W-NR-padX] x [padTop, H-padBot]
    const rawX = cx + rx * Math.cos(a);
    const rawY = cy + ry * Math.sin(a);
    pos[s] = {
      x: Math.max(NR + padX, Math.min(W - NR - padX, rawX)),
      y: Math.max(padTop, Math.min(H - padBot, rawY)),
    };
  });
  return pos;
}

// ── Self-loop path ────────────────────────────────────────────────────────
// One arc per state — always above the node
function selfLoopPath(cx: number, cy: number) {
  const r = 34;
  return {
    d: `M ${cx - 12},${cy - NR + 2} C ${cx - r - 8},${cy - NR - r - 14} ${cx + r + 8},${cy - NR - r - 14} ${cx + 12},${cy - NR + 2}`,
    lx: cx,
    ly: cy - NR - r - 20,
  };
}

// ── Regular edge path ─────────────────────────────────────────────────────
// curveOffset: perpendicular displacement of the bezier control point
function edgePath(
  fp: { x: number; y: number },
  tp: { x: number; y: number },
  curveOffset: number,
) {
  const dx = tp.x - fp.x, dy = tp.y - fp.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux; // perpendicular normal

  const sx = fp.x + ux * NR, sy = fp.y + uy * NR;
  const ex = tp.x - ux * NR, ey = tp.y - uy * NR;

  const mx = (sx + ex) / 2 + nx * curveOffset;
  const my = (sy + ey) / 2 + ny * curveOffset;

  return {
    d: `M ${sx},${sy} Q ${mx},${my} ${ex},${ey}`,
    lx: mx,
    ly: my,
  };
}

// ── Label formatter ───────────────────────────────────────────────────────
function formatLabel(rule: TransitionRule, numTapes: number, short: boolean): string {
  if (numTapes === 1) {
    const r = rule.readSymbols[0] ?? '?';
    const w = rule.writeSymbols[0] ?? '?';
    const d = rule.directions[0] ?? '?';
    if (short) return `${r}/${d}`;
    if (r === w) return `${r},${d}`;
    return `${r}→${w},${d}`;
  }
  const reads  = rule.readSymbols.slice(0, numTapes).map(s => s ?? '?').join(',');
  const writes = rule.writeSymbols.slice(0, numTapes).map(s => s ?? '?').join(',');
  const dirs   = rule.directions.slice(0, numTapes).map(d => d ?? '?').join('');
  if (short) return `${reads}/${dirs}`;
  if (reads === writes) return `${reads} ${dirs}`;
  return `${reads}→${writes} ${dirs}`;
}

// ── Tooltip ───────────────────────────────────────────────────────────────
function EdgeTooltip({ labels, x, y }: { labels: string[]; x: number; y: number }) {
  const lineH = 15, pad = 7;
  const maxLen = Math.max(...labels.map(l => l.length), 4);
  const w = Math.min(220, maxLen * 6.5 + pad * 2);
  const h = labels.length * lineH + pad * 2;
  const tx = Math.max(4, x - w / 2);
  const ty = y - h - 10;

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={tx} y={Math.max(2, ty)} width={w} height={h} rx="4"
        fill="var(--bg-card)" stroke="var(--border-glass)" strokeWidth="1"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.13))' }} />
      {labels.map((l, i) => (
        <text key={i}
          x={tx + pad}
          y={Math.max(2, ty) + pad + i * lineH + 11}
          fontSize="9" fill="var(--text-primary)"
          fontFamily="var(--font-mono)">
          {l}
        </text>
      ))}
    </g>
  );
}

// ── Edge record ───────────────────────────────────────────────────────────
interface EdgeRecord {
  id: string;
  from: string;
  to: string;
  isSelfLoop: boolean;
  d: string;
  lx: number;
  ly: number;
  shortLabel: string;  // compact label shown on the arc
  fullLabels: string[];  // one line per transition, shown in tooltip
  rules: TransitionRule[];
}

// ── SVG Graph ─────────────────────────────────────────────────────────────
function StateGraph({ config, currentState, status, lastTransition }: StateDiagramProps) {
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const W = 840, H = 520;

  const { states, edges } = useMemo<{
    states: { id: string; x: number; y: number }[];
    edges: EdgeRecord[];
  }>(() => {
    const sl = [...config.states];
    const pos = layoutStates(sl, W, H);

    // Group ALL transitions by (from → to)
    const pairMap = new Map<string, TransitionRule[]>();
    config.transitions.forEach(rule => {
      const key = `${rule.fromState}|||${rule.toState}`;
      if (!pairMap.has(key)) pairMap.set(key, []);
      pairMap.get(key)!.push(rule);
    });

    // Bidirectional pairs
    const bidiSet = new Set<string>();
    pairMap.forEach((_, key) => {
      const [a, b] = key.split('|||');
      if (a !== b && pairMap.has(`${b}|||${a}`)) {
        bidiSet.add([a, b].sort().join('<>'));
      }
    });

    const edgeList: EdgeRecord[] = [];

    pairMap.forEach((rules, key) => {
      const [from, to] = key.split('|||');
      const fp = pos[from], tp = pos[to];
      if (!fp || !tp) return;

      const isSelfLoop = from === to;

      // One edge per (from, to) pair — group ALL transitions together
      const shortLabels = rules.map(r => formatLabel(r, config.numTapes, true));
      const fullLabels  = rules.map(r => formatLabel(r, config.numTapes, false));

      // Short display: show first 2, then "+N" if more
      const MAX_SHOW = 2;
      const shortLabel = shortLabels.length <= MAX_SHOW
        ? shortLabels.join(' | ')
        : `${shortLabels.slice(0, MAX_SHOW).join(' | ')} +${shortLabels.length - MAX_SHOW}`;

      if (isSelfLoop) {
        const { d, lx, ly } = selfLoopPath(fp.x, fp.y);
        edgeList.push({ id: key, from, to, isSelfLoop: true, d, lx, ly, shortLabel, fullLabels, rules });
      } else {
        const pairKey = [from, to].sort().join('<>');
        const isBidi  = bidiSet.has(pairKey);
        const isFirst = from < to;
        // Bidirectional: one curve each side; unidirectional: straight (offset=0)
        const off = isBidi ? (isFirst ? 26 : -26) : 0;
        const { d, lx, ly } = edgePath(fp, tp, off);
        edgeList.push({ id: key, from, to, isSelfLoop: false, d, lx, ly, shortLabel, fullLabels, rules });
      }
    });

    return { states: sl.map(s => ({ id: s, ...pos[s] })), edges: edgeList };
  }, [config, W, H]);

  // ── Active edge detection ─────────────────────────────────────────────
  const isEdgeActive = (e: EdgeRecord) => {
    if (!lastTransition) return false;
    return e.from === lastTransition.fromState
      && e.to   === lastTransition.toState
      && e.rules.some(rule =>
          rule.readSymbols.length >= config.numTapes &&
          rule.readSymbols.slice(0, config.numTapes).every((s, i) => s === lastTransition.readSymbols[i])
        );
  };

  const uid = `sg_${config.numTapes}`;
  const isErrStatus = status === 'rejected' || status === 'missing_transition';

  return (
    <div style={{ width: '100%', height: '520px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%" height="100%"
        style={{ display: 'block', maxWidth: `${W}px`, maxHeight: `${H}px`, overflow: 'hidden' }}
        overflow="hidden"
        onMouseLeave={() => setHoveredEdge(null)}
      >
        <defs>
          {(['arr','arr_active','arr_halt','arr_err','arr_hover'] as const).map(name => {
            const color = name === 'arr_active' ? 'var(--accent-cyan-light, #0ea5e9)'
              : name === 'arr_halt'  ? 'var(--accent-emerald)'
              : name === 'arr_err'   ? 'var(--accent-rose)'
              : name === 'arr_hover' ? 'var(--text-secondary)'
              : 'rgba(148,163,184,0.7)';
            return (
              <marker key={name} id={`${uid}_${name}`}
                markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 Z" fill={color}/>
              </marker>
            );
          })}
          <filter id={`${uid}_glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── EDGES (drawn before nodes) ── */}
        {edges.map(e => {
          const active  = isEdgeActive(e);
          const isErr   = isErrStatus && e.from === currentState;
          const toHalt  = config.acceptStates.includes(e.to) || config.rejectStates.includes(e.to);
          const isHover = hoveredEdge === e.id;

          const stroke = isErr   ? 'var(--accent-rose)'
            : active  ? 'var(--accent-cyan-light, #0ea5e9)'
            : isHover ? 'var(--text-secondary)'
            : toHalt  ? 'var(--accent-emerald)'
            : 'rgba(148,163,184,0.55)';

          const markerKey = isErr ? 'arr_err' : active ? 'arr_active'
            : isHover ? 'arr_hover' : toHalt ? 'arr_halt' : 'arr';

          const labelColor = isErr   ? 'var(--accent-rose)'
            : active  ? 'var(--accent-cyan-light, #0ea5e9)'
            : isHover ? 'var(--text-secondary)'
            : 'rgba(100,116,139,0.9)';

          const sw = active || isErr ? 2.2 : isHover ? 1.7 : 1.1;

          // Compute a nice label background box size
          const txt = e.shortLabel.length > 22 ? e.shortLabel.slice(0, 20) + '…' : e.shortLabel;
          const boxW = Math.max(36, txt.length * 6 + 12);
          const boxH = 14;

          return (
            <g key={e.id}
              onMouseEnter={() => setHoveredEdge(e.id)}
              onMouseLeave={() => setHoveredEdge(null)}
              style={{ cursor: 'default' }}>

              {/* Wide invisible hit zone */}
              <path d={e.d} fill="none" stroke="transparent" strokeWidth="18" />

              {/* Visible arc */}
              <path d={e.d} fill="none"
                stroke={stroke} strokeWidth={sw}
                markerEnd={`url(#${uid}_${markerKey})`}
                filter={active ? `url(#${uid}_glow)` : undefined}
                strokeDasharray={toHalt && !active ? '5 3' : undefined}
                opacity={toHalt && !active ? 0.65 : 1}
              />

              {/* Label pill background for readability */}
              <rect
                x={e.lx - boxW / 2} y={e.ly - boxH / 2 - 1}
                width={boxW} height={boxH + 2} rx="3"
                fill={active
                  ? 'rgba(14,165,233,0.08)'
                  : isErr
                  ? 'rgba(220,38,38,0.07)'
                  : 'rgba(255,255,255,0.88)'}
                stroke={active ? 'rgba(14,165,233,0.3)' : 'rgba(190,200,215,0.35)'}
                strokeWidth="0.6"
                style={{ pointerEvents: 'none' }}
              />

              {/* Label text */}
              <text
                x={e.lx} y={e.ly + 0.5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={active || isHover ? '8.5' : '7.5'}
                fontWeight={active ? '700' : '500'}
                fill={labelColor}
                fontFamily="var(--font-mono)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {txt}
              </text>

              {/* Tooltip on hover */}
              {isHover && e.fullLabels.length > 0 && (
                <EdgeTooltip labels={e.fullLabels} x={e.lx} y={e.ly} />
              )}
            </g>
          );
        })}

        {/* ── NODES ── */}
        {states.map(s => {
          const isActive  = s.id === currentState;
          const isAccept  = config.acceptStates.includes(s.id);
          const isReject  = config.rejectStates.includes(s.id);
          const isInitial = config.initialState === s.id;
          const isErr     = isErrStatus && isActive;

          let stroke = 'rgba(148,163,184,0.65)';
          let fill   = 'var(--bg-card)';
          let txtClr = 'var(--text-primary)';
          let sw     = 1.5;

          if (isAccept)  { stroke = 'var(--accent-emerald)'; fill = 'rgba(5,150,105,0.10)'; txtClr = 'var(--accent-emerald)'; }
          if (isReject)  { stroke = 'var(--accent-rose)';    fill = 'rgba(220,38,38,0.08)'; txtClr = 'var(--accent-rose)'; }
          if (isInitial && !isAccept && !isReject) { stroke = '#6366f1'; fill = 'rgba(99,102,241,0.07)'; }

          if (isActive) {
            sw = 2.5;
            if (status === 'accepted') {
              stroke = 'var(--accent-emerald)'; fill = 'rgba(5,150,105,0.15)';
            } else if (isErr) {
              stroke = 'var(--accent-rose)'; fill = 'rgba(220,38,38,0.13)';
            } else {
              stroke = 'var(--accent-cyan-light, #0ea5e9)';
              fill   = 'rgba(14,165,233,0.10)';
              txtClr = 'var(--accent-cyan-light, #0ea5e9)';
            }
          }

          const label = s.id.length > 7 ? s.id.slice(0, 6) + '…' : s.id;
          const fs    = s.id.length > 5 ? '8.5' : s.id.length > 3 ? '10' : '11';

          return (
            <g key={s.id} filter={isActive ? `url(#${uid}_glow)` : undefined}>
              {/* Double ring for accept states */}
              {isAccept && (
                <circle cx={s.x} cy={s.y} r={NR + 5}
                  fill="none" stroke={stroke} strokeWidth={1} opacity={0.55} />
              )}
              {/* Entry arrow for initial state */}
              {isInitial && !isAccept && !isReject && (
                <line
                  x1={s.x - NR - 22} y1={s.y}
                  x2={s.x - NR - 2}  y2={s.y}
                  stroke="#6366f1" strokeWidth="1.8"
                  markerEnd={`url(#${uid}_arr)`}
                />
              )}
              <circle cx={s.x} cy={s.y} r={NR}
                fill={fill} stroke={stroke} strokeWidth={sw} />
              <text
                x={s.x} y={s.y + 0.5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={fs} fill={txtClr}
                fontFamily="var(--font-mono)" fontWeight={isActive ? '700' : '600'}
                style={{ userSelect: 'none' }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ===== Main Export =====
export default React.memo(function StateDiagram(props: StateDiagramProps) {
  const { config } = props;

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div className="section-title" style={{ margin: 0 }}>
          <span className="icon">🔀</span> State Transition Diagram
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ padding: '3px 8px', background: 'rgba(99,102,241,0.08)', borderRadius: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#6366f1' }}>
            {config.states.length} states
          </span>
          <span style={{ padding: '3px 8px', background: 'rgba(59,130,246,0.08)', borderRadius: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#3b82f6' }}>
            {config.transitions.length} transitions
          </span>
        </div>
      </div>

      {/* Notation guide */}
      <div style={{
        padding: '5px 16px', borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(248,250,252,0.6)', display: 'flex', alignItems: 'center',
        gap: '12px', fontSize: '10px', color: 'var(--text-muted)',
        fontFamily: "'JetBrains Mono', var(--font-mono)",
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>Format:</span>
        {config.numTapes === 1 ? (
          <span>read/dir &nbsp;|&nbsp; hover edge for full details</span>
        ) : (
          <span>reads/dirs &nbsp;|&nbsp; {config.numTapes} tapes &nbsp;|&nbsp; hover edge for full details</span>
        )}
      </div>

      {/* SVG */}
      <StateGraph {...props} />

      {/* Legend */}
      <div style={{
        padding: '8px 16px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap',
        fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(248,250,252,0.5)',
      }}>
        {([
          { c: 'var(--accent-cyan-light, #0ea5e9)', label: 'Current', sw: 3, glow: true },
          { c: '#6366f1',                           label: 'Start',   sw: 2 },
          { c: 'var(--accent-emerald)',              label: 'Accept',  sw: 2, double: true },
          { c: 'var(--accent-rose)',                 label: 'Reject',  sw: 2 },
        ] as { c: string; label: string; sw: number; glow?: boolean; double?: boolean }[]).map(({ c, label, sw, glow, double: dbl }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '13px', height: '13px', borderRadius: '50%',
              border: `${sw}px solid ${c}`, background: `${c}22`,
              boxShadow: glow ? `0 0 5px ${c}88` : undefined,
              outline: dbl ? `1.5px solid ${c}` : undefined, outlineOffset: dbl ? '2px' : undefined,
            }} />
            <span style={{ fontWeight: 600, color: c }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '18px', height: '2px', background: 'var(--accent-cyan-light, #0ea5e9)', borderRadius: '2px' }} />
          <span style={{ fontWeight: 600, color: 'var(--accent-cyan-light, #0ea5e9)' }}>Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Hover an edge to see all transitions</span>
        </div>
      </div>
    </div>
  );
});
