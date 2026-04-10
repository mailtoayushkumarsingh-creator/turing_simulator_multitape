'use client';

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Position,
  Handle,
  NodeProps,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  getBezierPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { MachineConfig, TransitionRule } from '../lib/turingEngine';

// ===== Props =====
interface StateDiagramProps {
  config: MachineConfig;
  currentState: string;
  status: 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition';
  lastTransition?: TransitionRule | null;
}

// ===== Custom Node Data =====
interface StateNodeData {
  label: string;
  isInitial: boolean;
  isAccept: boolean;
  isReject: boolean;
  isCurrent: boolean;
  status: string;
  [key: string]: unknown;
}

// ===== Dagre Layout Helper =====
const NODE_WIDTH = 72;
const NODE_HEIGHT = 72;

function getLayoutedElements(
  nodes: Node<StateNodeData>[],
  edges: Edge[],
  config: MachineConfig
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 120,
    edgesep: 40,
    marginx: 40,
    marginy: 40,
  });

  // Assign ranks to control ordering: initial=min, accept/reject=max
  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Only add non-self-loop edges to dagre (self loops handled separately)
  edges.forEach((edge) => {
    if (edge.source !== edge.target) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });

  return layoutedNodes;
}

// ===== Custom Self-Loop Edge =====
function SelfLoopEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const isActive = (data as Record<string, unknown>)?.isActive as boolean;
  const loopRadius = 30;
  const offsetY = -45;

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2 + offsetY;

  const path = `M ${sourceX},${sourceY - 10}
    C ${sourceX + loopRadius + 15},${midY - loopRadius - 5}
      ${sourceX - loopRadius - 15},${midY - loopRadius - 5}
      ${targetX},${targetY - 10}`;

  const labelX = midX;
  const labelY = midY - loopRadius - 18;

  const labelLines = typeof label === 'string' ? label.split('\n') : [];

  return (
    <>
      <path
        id={id}
        d={path}
        fill="none"
        style={style}
        markerEnd={markerEnd as string}
      />
      {labelLines.length > 0 && (
        <foreignObject
          x={labelX - 52}
          y={labelY - labelLines.length * 8}
          width={104}
          height={labelLines.length * 16 + 10}
          style={{ overflow: 'visible' }}
        >
          <div
            style={{
              background: isActive
                ? 'rgba(14, 165, 233, 0.1)'
                : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${isActive ? 'rgba(14, 165, 233, 0.35)' : 'rgba(190, 200, 210, 0.4)'}`,
              borderRadius: '5px',
              padding: '3px 6px',
              textAlign: 'center',
              fontSize: '9px',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#0ea5e9' : 'rgba(55, 65, 75, 0.85)',
              lineHeight: '14px',
              whiteSpace: 'pre',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {label as string}
          </div>
        </foreignObject>
      )}
    </>
  );
}

// ===== Custom Smooth Edge with multi-line label =====
function LabeledSmoothEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const isActive = (data as Record<string, unknown>)?.isActive as boolean;
  const edgeOffset = ((data as Record<string, unknown>)?.edgeOffset as number) || 0;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY: sourceY + edgeOffset,
    targetX,
    targetY: targetY + edgeOffset,
    sourcePosition,
    targetPosition,
    borderRadius: 16,
    offset: 12,
  });

  const labelLines = typeof label === 'string' ? label.split('\n') : [];
  const labelHeight = labelLines.length * 14 + 8;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {labelLines.length > 0 && (
        <foreignObject
          x={labelX - 52}
          y={labelY - labelHeight / 2}
          width={104}
          height={labelHeight + 4}
          style={{ overflow: 'visible' }}
        >
          <div
            style={{
              background: isActive
                ? 'rgba(14, 165, 233, 0.1)'
                : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${isActive ? 'rgba(14, 165, 233, 0.35)' : 'rgba(190, 200, 210, 0.4)'}`,
              borderRadius: '5px',
              padding: '3px 6px',
              textAlign: 'center',
              fontSize: '9.5px',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#0ea5e9' : 'rgba(55, 65, 75, 0.85)',
              lineHeight: '14px',
              whiteSpace: 'pre',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {label as string}
          </div>
        </foreignObject>
      )}
    </>
  );
}

// ===== Custom Bidirectional Edge (curved to avoid overlap) =====
function CurvedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const isActive = (data as Record<string, unknown>)?.isActive as boolean;
  const curveOffset = ((data as Record<string, unknown>)?.curveOffset as number) || 25;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: curveOffset / 100,
  });

  const labelLines = typeof label === 'string' ? label.split('\n') : [];
  const labelHeight = labelLines.length * 14 + 8;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {labelLines.length > 0 && (
        <foreignObject
          x={labelX - 52}
          y={labelY - labelHeight / 2}
          width={104}
          height={labelHeight + 4}
          style={{ overflow: 'visible' }}
        >
          <div
            style={{
              background: isActive
                ? 'rgba(14, 165, 233, 0.1)'
                : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${isActive ? 'rgba(14, 165, 233, 0.35)' : 'rgba(190, 200, 210, 0.4)'}`,
              borderRadius: '5px',
              padding: '3px 6px',
              textAlign: 'center',
              fontSize: '9.5px',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#0ea5e9' : 'rgba(55, 65, 75, 0.85)',
              lineHeight: '14px',
              whiteSpace: 'pre',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            {label as string}
          </div>
        </foreignObject>
      )}
    </>
  );
}

// ===== Custom Node Component =====
const StateNode = React.memo(function StateNode({ data }: NodeProps<Node<StateNodeData>>) {
  const { label, isInitial, isAccept, isReject, isCurrent, status } = data;

  // Colors
  let bgColor = 'rgba(255, 255, 255, 0.97)';
  let borderColor = 'rgba(180, 190, 200, 0.55)';
  let textColor = '#334155';
  let boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
  let borderWidth = '2px';

  if (isAccept) {
    bgColor = 'rgba(5, 150, 105, 0.1)';
    borderColor = '#059669';
    textColor = '#047857';
  } else if (isReject) {
    bgColor = 'rgba(220, 38, 38, 0.08)';
    borderColor = '#dc2626';
    textColor = '#b91c1c';
  } else if (isInitial) {
    borderColor = '#6366f1';
    bgColor = 'rgba(99, 102, 241, 0.06)';
  }

  if (isCurrent) {
    borderWidth = '3px';
    if (status === 'accepted') {
      boxShadow = '0 0 0 4px rgba(5, 150, 105, 0.18), 0 0 16px rgba(5, 150, 105, 0.25)';
      borderColor = '#059669';
      bgColor = 'rgba(5, 150, 105, 0.15)';
    } else if (status === 'rejected') {
      boxShadow = '0 0 0 4px rgba(220, 38, 38, 0.18), 0 0 16px rgba(220, 38, 38, 0.25)';
      borderColor = '#dc2626';
      bgColor = 'rgba(220, 38, 38, 0.12)';
    } else {
      boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.2), 0 0 18px rgba(59, 130, 246, 0.3)';
      borderColor = '#3b82f6';
      bgColor = 'rgba(59, 130, 246, 0.1)';
      textColor = '#1d4ed8';
    }
  }

  const nodeSize = 62;

  return (
    <>
      {/* Target handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'transparent', border: 'none', width: 1, height: 1 }}
      />
      <Handle
        type="target"
        id="top"
        position={Position.Top}
        style={{ background: 'transparent', border: 'none', width: 1, height: 1 }}
      />

      {/* Initial arrow */}
      {isInitial && (
        <div style={{
          position: 'absolute',
          left: '-30px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
        }}>
          <svg width="24" height="16" viewBox="0 0 24 16">
            <path
              d="M0 8 L18 8 L13 3 M18 8 L13 13"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Accept state: double ring */}
      {isAccept && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${nodeSize + 10}px`,
          height: `${nodeSize + 10}px`,
          borderRadius: '50%',
          border: `2px solid ${borderColor}`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Main circle */}
      <div
        style={{
          width: `${nodeSize}px`,
          height: `${nodeSize}px`,
          borderRadius: '50%',
          background: bgColor,
          border: `${borderWidth} solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: "'JetBrains Mono', 'Fira Code', var(--font-mono)",
          fontSize: label.length > 5 ? '9px' : label.length > 3 ? '11px' : '13px',
          fontWeight: 700,
          color: textColor,
          boxShadow,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isCurrent && status === 'running' ? 'scale(1.05)' : 'scale(1)',
          animation: isCurrent && status === 'running' ? 'stateDiagramPulse 2s ease-in-out infinite' : undefined,
          position: 'relative',
          cursor: 'grab',
        }}
      >
        {label}
      </div>

      {/* Badge below node */}
      <div style={{
        position: 'absolute',
        bottom: '-18px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '7.5px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
        color: isAccept ? '#059669' : isReject ? '#dc2626' : isInitial ? '#6366f1' : 'transparent',
      }}>
        {isAccept ? 'ACCEPT' : isReject ? 'REJECT' : isInitial ? 'START' : ''}
      </div>

      {/* Source handles */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: 'transparent', border: 'none', width: 1, height: 1 }}
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        style={{ background: 'transparent', border: 'none', width: 1, height: 1 }}
      />
    </>
  );
});

const nodeTypes = { stateNode: StateNode };
const edgeTypes = {
  selfLoop: SelfLoopEdge,
  labeledSmooth: LabeledSmoothEdge,
  curved: CurvedEdge,
};

// ===== Format Transition Label (clean multi-line) =====
function formatTransitionLabel(rule: TransitionRule, numTapes: number): string {
  if (numTapes === 1) {
    const read = rule.readSymbols[0] ?? '?';
    const write = rule.writeSymbols[0] ?? '?';
    const dir = rule.directions[0] ?? '?';
    return `${read}→${write}, ${dir}`;
  }
  const parts: string[] = [];
  for (let i = 0; i < numTapes; i++) {
    const r = rule.readSymbols[i] ?? '?';
    const w = rule.writeSymbols[i] ?? '?';
    const d = rule.directions[i] ?? '?';
    parts.push(`${r}→${w},${d}`);
  }
  return parts.join('\n');
}

// ===== Auto-fit on mount =====
function FitViewOnMount() {
  const { fitView } = useReactFlow();
  const didFit = useRef(false);
  useEffect(() => {
    if (!didFit.current) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.25, duration: 400 });
        didFit.current = true;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [fitView]);
  return null;
}

// ===== Inner Diagram (needs ReactFlowProvider) =====
function StateDiagramInner({
  config,
  currentState,
  status,
  lastTransition,
}: StateDiagramProps) {
  const { fitView } = useReactFlow();

  // Build raw nodes
  const rawNodes: Node<StateNodeData>[] = useMemo(() => {
    return config.states.map((state) => ({
      id: state,
      type: 'stateNode',
      position: { x: 0, y: 0 },
      data: {
        label: state,
        isInitial: state === config.initialState,
        isAccept: config.acceptStates.includes(state),
        isReject: config.rejectStates.includes(state),
        isCurrent: state === currentState,
        status,
      },
      draggable: true,
    }));
  }, [config.states, config.initialState, config.acceptStates, config.rejectStates, currentState, status]);

  // Build edges — group transitions by (from, to) pair
  const edges: Edge[] = useMemo(() => {
    const edgeMap = new Map<string, { labels: string[]; isActive: boolean }>();

    config.transitions.forEach((rule) => {
      const key = `${rule.fromState}->${rule.toState}`;
      const label = formatTransitionLabel(rule, config.numTapes);
      const isActive = lastTransition
        ? rule.fromState === lastTransition.fromState &&
          rule.toState === lastTransition.toState &&
          rule.readSymbols.every((s, i) => s === lastTransition.readSymbols[i])
        : false;

      if (edgeMap.has(key)) {
        const existing = edgeMap.get(key)!;
        existing.labels.push(label);
        if (isActive) existing.isActive = true;
      } else {
        edgeMap.set(key, { labels: [label], isActive });
      }
    });

    // Detect bidirectional pairs (A->B and B->A both exist)
    const bidirectionalPairs = new Set<string>();
    edgeMap.forEach((_, key) => {
      const [from, to] = key.split('->');
      const reverseKey = `${to}->${from}`;
      if (from !== to && edgeMap.has(reverseKey)) {
        const pairKey = [from, to].sort().join('<>');
        bidirectionalPairs.add(pairKey);
      }
    });

    const result: Edge[] = [];
    edgeMap.forEach((value, key) => {
      const [fromState, toState] = key.split('->');
      const isSelfLoop = fromState === toState;
      const edgeLabel = value.labels.join('\n');
      const isActiveEdge = value.isActive;

      // Check if this is part of a bidirectional pair
      const pairKey = [fromState, toState].sort().join('<>');
      const isBidirectional = bidirectionalPairs.has(pairKey);

      const baseStroke = isActiveEdge ? '#3b82f6' : 'rgba(100, 116, 139, 0.45)';
      const strokeWidth = isActiveEdge ? 2.5 : 1.5;

      if (isSelfLoop) {
        result.push({
          id: key,
          source: fromState,
          target: toState,
          type: 'selfLoop',
          label: edgeLabel,
          animated: isActiveEdge,
          data: { isActive: isActiveEdge },
          style: {
            stroke: baseStroke,
            strokeWidth,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: baseStroke,
          },
          sourceHandle: 'top',
          targetHandle: 'top',
        });
      } else if (isBidirectional) {
        // Use curved edge to avoid overlap with reverse edge
        const isFirstInPair = fromState < toState;
        result.push({
          id: key,
          source: fromState,
          target: toState,
          type: 'curved',
          label: edgeLabel,
          animated: isActiveEdge,
          data: {
            isActive: isActiveEdge,
            curveOffset: isFirstInPair ? 35 : -35,
          },
          style: {
            stroke: baseStroke,
            strokeWidth,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: baseStroke,
          },
        });
      } else {
        result.push({
          id: key,
          source: fromState,
          target: toState,
          type: 'labeledSmooth',
          label: edgeLabel,
          animated: isActiveEdge,
          data: { isActive: isActiveEdge },
          style: {
            stroke: baseStroke,
            strokeWidth,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: baseStroke,
          },
        });
      }
    });

    return result;
  }, [config.transitions, config.numTapes, lastTransition]);

  // Apply dagre layout
  const nodes = useMemo(() => {
    return getLayoutedElements(rawNodes, edges, config);
  }, [rawNodes, edges, config]);

  // Re-fit when config changes
  const prevConfigRef = useRef(config);
  useEffect(() => {
    if (prevConfigRef.current !== config) {
      prevConfigRef.current = config;
      setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 200);
    }
  }, [config, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.2}
      maxZoom={2.5}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={true}
      zoomOnScroll={true}
      style={{ background: 'transparent' }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="rgba(148, 163, 184, 0.15)"
      />
      <Controls
        showInteractive={false}
        position="bottom-right"
        style={{
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          border: '1px solid rgba(226, 232, 240, 0.6)',
        }}
      />
      <FitViewOnMount />
    </ReactFlow>
  );
}

// ===== Main Export =====
export default React.memo(function StateDiagram(props: StateDiagramProps) {
  const { config } = props;

  return (
    <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div className="section-title" style={{ margin: 0 }}>
          <span className="icon">🔀</span>
          State Transition Diagram
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{
            padding: '3px 8px',
            background: 'rgba(99, 102, 241, 0.08)',
            borderRadius: '6px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#6366f1',
          }}>
            {config.states.length} states
          </span>
          <span style={{
            padding: '3px 8px',
            background: 'rgba(59, 130, 246, 0.08)',
            borderRadius: '6px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#3b82f6',
          }}>
            {config.transitions.length} transitions
          </span>
        </div>
      </div>

      {/* Diagram */}
      <div style={{ height: '380px', width: '100%' }}>
        <ReactFlowProvider>
          <StateDiagramInner {...props} />
        </ReactFlowProvider>
      </div>

      {/* Legend */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap',
        fontSize: '10px',
        color: 'var(--text-muted)',
        background: 'rgba(248, 250, 252, 0.5)',
      }}>
        {/* Current */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%',
            border: '3px solid #3b82f6',
            boxShadow: '0 0 6px rgba(59, 130, 246, 0.4)',
            background: 'rgba(59, 130, 246, 0.1)',
          }} />
          <span style={{ fontWeight: 600, color: '#3b82f6' }}>Current</span>
        </div>
        {/* Start */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%',
            border: '2px solid #6366f1',
            background: 'rgba(99, 102, 241, 0.06)',
          }} />
          <span style={{ fontWeight: 600, color: '#6366f1' }}>Start</span>
        </div>
        {/* Accept */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%',
            border: '2px solid #059669',
            background: 'rgba(5, 150, 105, 0.1)',
            outline: '1.5px solid #059669',
            outlineOffset: '2px',
          }} />
          <span style={{ fontWeight: 600, color: '#059669' }}>Accept</span>
        </div>
        {/* Reject */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%',
            border: '2px solid #dc2626',
            background: 'rgba(220, 38, 38, 0.08)',
          }} />
          <span style={{ fontWeight: 600, color: '#dc2626' }}>Reject</span>
        </div>
        {/* Active edge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '20px', height: '2.5px',
            background: '#3b82f6',
            borderRadius: '2px',
          }} />
          <span style={{ fontWeight: 600, color: '#3b82f6' }}>Active</span>
        </div>
      </div>
    </div>
  );
});
