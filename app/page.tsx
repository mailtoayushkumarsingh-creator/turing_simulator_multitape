'use client';
import Image from "next/image";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TuringMachine, MachineConfig, MachineSnapshot, SingleTapeTuringMachine } from './lib/turingEngine';
import { EXAMPLES, getExampleByName } from './lib/examples';
import TapeVisualization from './components/TapeVisualization';
import PlaybackControls from './components/PlaybackControls';
import TransitionEditor from './components/TransitionEditor';
import ComparativeView from './components/ComparativeView';
import StatePanel from './components/StatePanel';
import ExampleSelector from './components/ExampleSelector';
import EducationalPanel from './components/EducationalPanel';
import StepExplanation from './components/StepExplanation';
import ThemeToggle from './components/ThemeToggle';
import TransitionTable from './components/TransitionTable';
import StateFlow from './components/StateFlow';
import Tooltip from './components/Tooltip';
import LoadingSkeleton from './components/LoadingSkeleton';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import ShortcutsModal from './components/ShortcutsModal';
import Toast, { ToastMessage } from './components/Toast';
import InstructionPanel from './components/InstructionPanel';
import TransitionValidation from './components/TransitionValidation';
import TestRunner from './components/TestRunner';
import dynamic from 'next/dynamic';

// Dynamic import for StateDiagram (ReactFlow is heavy — code split)
const StateDiagram = dynamic(() => import('./components/StateDiagram'), {
  ssr: false,
  loading: () => (
    <div className="glass-card" style={{ padding: '16px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading state diagram...</div>
    </div>
  ),
});

// Estimate max steps for progress bar (heuristic: 120 steps shown as 100%)
const PROGRESS_MAX_STEPS = 120;

export default function Home() {
  const [config, setConfig] = useState<MachineConfig>(() => ({ ...EXAMPLES[0] }));
  const [currentExample, setCurrentExample] = useState<string>(EXAMPLES[0].name);
  const [machine, setMachine] = useState<TuringMachine>(() => new TuringMachine({ ...EXAMPLES[0] }));
  const [snapshot, setSnapshot] = useState<MachineSnapshot>(() => new TuringMachine({ ...EXAMPLES[0] }).getSnapshot());
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(400);
  const [writtenCells, setWrittenCells] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [stateHistory, setStateHistory] = useState<string[]>([EXAMPLES[0].initialState]);
  const [learningMode, setLearningMode] = useState(false);
  const [safeMode, setSafeMode] = useState(true);
  const [modeMessage, setModeMessage] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [efficiencyHistory, setEfficiencyHistory] = useState<Array<{ inputSize: number; multi: number; single: number }>>([]);
  const [currentProblem, setCurrentProblem] = useState<string>(EXAMPLES[0].name);
  const toastIdRef = useRef(0);
  const stepRef = useRef(snapshot.step);
  const configRef = useRef(config);

  useEffect(() => { stepRef.current = snapshot.step; }, [snapshot.step]);
  useEffect(() => { configRef.current = config; }, [config]);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const machineRef = useRef<TuringMachine>(machine);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (modeMessage) {
      const timer = setTimeout(() => setModeMessage(""), 2500);
      return () => clearTimeout(timer);
    }
  }, [modeMessage]);

  useEffect(() => {
    machineRef.current = machine;
  }, [machine]);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Track previous status to fire toasts on transitions
  const prevStatusRef = useRef<string>('running');

  useEffect(() => {
    if (snapshot.status !== 'running' && isPlaying) {
      setIsPlaying(false);
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    // Fire toast on status change
    if (snapshot.status !== prevStatusRef.current) {
      if (snapshot.status === 'accepted') addToast('success', 'Machine ACCEPTED the input');
      else if (snapshot.status === 'rejected') {
        if (snapshot.missingTransitionInfo) {
          addToast('error', `Machine REJECTED — ${snapshot.missingTransitionInfo}`);
        } else {
          addToast('error', 'Machine REJECTED the input');
        }
      }
      else if (snapshot.status === 'halted') addToast('warning', 'Machine halted: No transition rule found for current state and tape symbols');
      else if (snapshot.status === 'missing_transition') {
        addToast('error', snapshot.missingTransitionInfo || 'Missing transition detected');
      }

      if (snapshot.status !== 'running' && stepRef.current > 0) {
        const currentConfig = configRef.current;
        
        // Ensure data only appends for same problem.
        if (currentConfig.name !== currentProblem) {
           setCurrentProblem(currentConfig.name);
           setEfficiencyHistory([]);
        }

        const inputLen = currentConfig.initialTapes[0]?.filter(s => s !== currentConfig.blankSymbol).length || 1;
        const singleTapeSim = new SingleTapeTuringMachine(currentConfig);
        const stSteps = singleTapeSim.simulateComparison(stepRef.current);
        
        setEfficiencyHistory(prev => {
          const basePrev = currentConfig.name !== currentProblem ? [] : prev;
          // Avoid duplicate runs of the exact same size/steps if user just spams play
          const isDuplicate = basePrev.some(p => p.inputSize === inputLen && p.multi === stepRef.current);
          if (isDuplicate) return basePrev;

          const newData = [...basePrev, { inputSize: inputLen, multi: stepRef.current, single: stSteps }];
          return newData.sort((a, b) => a.inputSize - b.inputSize);
        });
      }

      prevStatusRef.current = snapshot.status;
    }
  }, [snapshot.status, isPlaying, addToast, snapshot.missingTransitionInfo]);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        const m = machineRef.current;
        const result = m.step(safeMode);
        if (result) {
          setSnapshot({ ...result });
          setStateHistory(prev => [...prev, result.state]);
          if (result.lastTransition) {
            const newWritten = new Set<string>();
            result.lastTransition.writeSymbols.forEach((_, i) => {
              if (result.lastTransition!.writeSymbols[i] !== '*') {
                const prevSnap = m.getHistory()[m.getHistory().length - 2];
                if (prevSnap) {
                  newWritten.add(`${i}-${prevSnap.headPositions[i]}`);
                }
              }
            });
            setWrittenCells(newWritten);
            setTimeout(() => setWrittenCells(new Set()), 400);
          }
        }
        if (m.getStatus() !== 'running') {
          setIsPlaying(false);
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
          }
        }
      }, speed);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, speed, safeMode]);

  const handleStep = useCallback(() => {
    const result = machine.step(safeMode);
    if (result) {
      setSnapshot({ ...result });
      setStateHistory(prev => [...prev, result.state]);
      if (result.lastTransition) {
        const newWritten = new Set<string>();
        result.lastTransition.writeSymbols.forEach((_, i) => {
          if (result.lastTransition!.writeSymbols[i] !== '*') {
            const hist = machine.getHistory();
            const prevSnap = hist[hist.length - 2];
            if (prevSnap) {
              newWritten.add(`${i}-${prevSnap.headPositions[i]}`);
            }
          }
        });
        setWrittenCells(newWritten);
        setTimeout(() => setWrittenCells(new Set()), 400);
      }
    }
  }, [machine, safeMode]);

  const handleStepBack = useCallback(() => {
    const result = machine.stepBack();
    if (result) {
      setSnapshot({ ...result });
      setWrittenCells(new Set());
      setStateHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    }
  }, [machine]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    machine.reset();
    setSnapshot(machine.getSnapshot());
    setWrittenCells(new Set());
    setStateHistory([machine.getSnapshot().state]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [machine]);

  const handleExport = useCallback(async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const appEl = document.querySelector('.app-grid') as HTMLElement;
      if (!appEl) return;
      const canvas = await html2canvas(appEl, {
        backgroundColor: '#f7f9fb',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `turing-machine-${config.name.replace(/\s+/g, '-').toLowerCase()}-step${snapshot.step}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('Export failed. Please try again.');
    }
  }, [config.name, snapshot.step]);

  const handlePlay = useCallback(() => {
    if (machine.getStatus() === 'running') {
      setIsPlaying(true);
    }
  }, [machine]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) handlePause();
    else handlePlay();
  }, [isPlaying, handlePlay, handlePause]);

  const handleExampleSelect = useCallback((name: string) => {
    setIsPlaying(false);
    setCurrentExample(name);
    const example = getExampleByName(name);
    let newConfig: MachineConfig;
    if (example) {
      newConfig = { ...example };
    } else {
      // Custom Machine Mode — empty config for building from scratch
      newConfig = {
        name: 'Custom Machine',
        description: 'Build your own Turing Machine from scratch. Define states, alphabet, transitions, and input.',
        numTapes: 1,
        states: ['q0', 'q1', 'qAccept', 'qReject'],
        alphabet: ['0', '1', 'B'],
        blankSymbol: 'B',
        initialState: 'q0',
        acceptStates: ['qAccept'],
        rejectStates: ['qReject'],
        transitions: [],
        initialTapes: [[]],
      };
      addToast('info', 'Custom Machine mode — define your own transitions');
    }
    setConfig(newConfig);
    const newMachine = new TuringMachine(newConfig);
    setMachine(newMachine);
    machineRef.current = newMachine;
    setSnapshot(newMachine.getSnapshot());
    setWrittenCells(new Set());
    setStateHistory([newConfig.initialState]);
    
    if (newConfig.name !== currentProblem) {
      setEfficiencyHistory([]);
      setCurrentProblem(newConfig.name);
    }
  }, [addToast, currentProblem]);

  // Feature 6: Auto-reset — handleConfigChange already resets the machine
  const handleConfigChange = useCallback((newConfig: MachineConfig) => {
    setIsPlaying(false);
    setConfig(newConfig);
    setCurrentExample('');
    const newMachine = new TuringMachine(newConfig);
    setMachine(newMachine);
    machineRef.current = newMachine;
    setSnapshot(newMachine.getSnapshot());
    setWrittenCells(new Set());
    setStateHistory([newConfig.initialState]);

    if (newConfig.name !== currentProblem) {
      setEfficiencyHistory([]);
      setCurrentProblem(newConfig.name);
    }
  }, [currentProblem]);

  const toggleShortcutsModal = useCallback(() => {
    setShowShortcutsModal(prev => !prev);
  }, []);

  const canStep = snapshot.status === 'running';
  const canStepBack = machine.getHistory().length > 1;

  // All modes are editable — custom mode shows extra guidance when building from scratch
  const isCustomMode = currentExample === '';

  // Progress bar calculation
  const progressPct = Math.min(100, (snapshot.step / PROGRESS_MAX_STEPS) * 100);

  if (!isLoaded) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      <KeyboardShortcuts
        onPlayPause={handlePlayPause}
        onStepForward={handleStep}
        onStepBack={handleStepBack}
        onReset={handleReset}
        onToggleHelp={toggleShortcutsModal}
      />

      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <div className="app-grid app-enter">
        {/* ===== Header ===== */}
        <header className="app-header">
          <div className="header-top">
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
                padding: '4px',
                boxShadow: '0 3px 10px rgba(14, 165, 233, 0.3)',
              }}>
                <Image
                  src="/logo.jpg"
                  alt="Logo"
                  width={30}
                  height={30}
                  style={{ borderRadius: '8px', objectFit: "cover" }}
                />
              </div>
              <div>
                <h1 style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}>
                  Multi-Tape Turing Machine
                </h1>
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  margin: 0,
                  fontWeight: 500,
                }}>
                  Interactive computational model simulator
                </p>
              </div>

              {/* Nav links (desktop) */}
              <nav style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: '16px',
              }} className="desktop-nav">
                <span style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0ea5e9',
                  background: 'rgba(14, 165, 233, 0.08)',
                  borderBottom: '2px solid #0ea5e9',
                  cursor: 'default',
                }}>
                  Simulate
                </span>
              </nav>
            </div>

            {/* Actions */}
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <ExampleSelector
                currentExample={currentExample}
                onSelect={handleExampleSelect}
              />

              <div style={{ width: '1px', height: '24px', background: 'var(--border-glass)' }} />



              {/* Learning Mode Toggle */}
              <Tooltip text="Toggle between simulation and learning mode">
                <div className="mode-toggle">
                  <button
                    className={`mode-toggle-btn${!learningMode ? ' active' : ''}`}
                    onClick={() => setLearningMode(false)}
                  >
                    🔬 Simulate
                  </button>
                  <button
                    className={`mode-toggle-btn${learningMode ? ' active' : ''}`}
                    onClick={() => setLearningMode(true)}
                  >
                    🎓 Learn
                  </button>
                </div>
              </Tooltip>

              <div style={{ width: '1px', height: '24px', background: 'var(--border-glass)' }} />

              {/* Safe Mode Toggle */}
              <Tooltip text="Toggle Safe Mode vs Strict Mode">
                <div className="mode-toggle">
                  <button
                    className={`mode-toggle-btn${safeMode ? ' active' : ''}`}
                    onClick={() => {
                      setSafeMode(true);
                      setModeMessage("Safe Mode Enabled: Missing transitions will automatically REJECT.");
                    }}
                    style={safeMode ? { color: '#0ea5e9' } : {}}
                  >
                    🛡️ Safe Mode ON
                  </button>
                  <button
                    className={`mode-toggle-btn${!safeMode ? ' active' : ''}`}
                    onClick={() => {
                      setSafeMode(false);
                      setModeMessage("Strict Mode Enabled: Missing transitions will HALT the machine.");
                    }}
                    style={!safeMode ? { color: '#ef4444' } : {}}
                  >
                    ⚠️ Strict Mode
                  </button>
                </div>
              </Tooltip>

              <div style={{ width: '1px', height: '24px', background: 'var(--border-glass)' }} />

              <Tooltip text="Compare multi-tape vs single-tape efficiency">
                <button
                  className={`btn ${showComparison ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowComparison(!showComparison)}
                >
                  📊 Compare
                </button>
              </Tooltip>
              <Tooltip text="Export current state as PNG">
                <button className="btn btn-secondary" onClick={handleExport}>
                  📷 Export
                </button>
              </Tooltip>
              <Tooltip text="Keyboard shortcuts (?)">
                <button
                  className="btn btn-secondary btn-icon"
                  onClick={toggleShortcutsModal}
                >
                  ⌨️
                </button>
              </Tooltip>
              <ThemeToggle />
            </div>
          </div>

          {/* Progress bar */}
          <div className="header-progress">
            <div className="progress-label">
              <span className="progress-label-text">Execution Progress</span>
              <span className="progress-step-text">
                Step {snapshot.step} / {PROGRESS_MAX_STEPS}+
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </header>

        {/* ===== Main Content ===== */}
        <main className="main-area">
          {/* Example description — always visible */}
          <div className="glass-card" style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}>
            <span style={{ fontSize: '16px', marginTop: '1px', flexShrink: 0 }}>💡</span>
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                {config.name}
                {currentExample && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    background: 'rgba(5, 150, 105, 0.1)',
                    color: 'var(--accent-emerald)',
                    borderRadius: '6px',
                    border: '1px solid rgba(5, 150, 105, 0.2)',
                  }}>EDITABLE</span>
                )}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}>
                {config.description}
              </div>
            </div>
          </div>

          {/* Halt / Missing Transition message */}
          {(snapshot.status === 'halted' || snapshot.status === 'missing_transition') && (
            <div className="glass-card" style={{
              padding: '12px 16px',
              background: snapshot.status === 'missing_transition' ? 'rgba(186, 26, 26, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: snapshot.status === 'missing_transition' ? '1px solid rgba(186, 26, 26, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <span style={{ fontSize: '18px' }}>{snapshot.status === 'missing_transition' ? '🔴' : '⚠️'}</span>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: snapshot.status === 'missing_transition' ? 'var(--accent-rose)' : 'var(--accent-amber)',
                  marginBottom: '2px',
                }}>
                  {snapshot.status === 'missing_transition'
                    ? 'Missing Transition Detected'
                    : 'Machine Halted: No Transition Rule Found'}
                </div>
                <div style={{
                  fontSize: '11.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}>
                  {snapshot.missingTransitionInfo || (
                    <>
                      The machine rejected unexpectedly because no transition rule matches state <strong style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)',
                      }}>{snapshot.state}</strong> with the current tape symbols. Add a matching transition rule or check your input.
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instruction Panel — only for Custom Mode (Feature 2) */}
          <InstructionPanel isCustomMode={isCustomMode} />

          {/* Tape Visualization */}
          <div className="glass-card" style={{ padding: '14px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '14px', paddingRight: '14px', marginBottom: '4px' }}>
              <div className="section-title" style={{ margin: 0 }}>
                <span className="icon">📼</span>
                Tape Execution Visualizer
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{
                  padding: '3px 8px',
                  background: 'rgba(226, 232, 240, 0.7)',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                }}>
                  K = {config.numTapes}
                </span>
                <span style={{
                  padding: '3px 8px',
                  background: snapshot.status === 'running'
                    ? 'rgba(14, 165, 233, 0.1)'
                    : snapshot.status === 'accepted'
                    ? 'rgba(5, 150, 105, 0.1)'
                    : 'rgba(186, 26, 26, 0.1)',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: snapshot.status === 'running'
                    ? '#0ea5e9'
                    : snapshot.status === 'accepted'
                    ? 'var(--accent-emerald)'
                    : 'var(--accent-rose)',
                  animation: snapshot.status === 'running' ? 'pulse 2s ease-in-out infinite' : undefined,
                }}>
                  {snapshot.status.toUpperCase()}
                </span>
              </div>
            </div>
            <TapeVisualization
              tapes={snapshot.tapes}
              headPositions={snapshot.headPositions}
              numTapes={config.numTapes}
              writtenCells={writtenCells}
              blankSymbol={config.blankSymbol}
              currentState={snapshot.state}
              status={snapshot.status}
            />
            
            {/* Current State Text Display */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                backgroundColor: snapshot.status === 'running' ? '#3b82f6' :
                                 snapshot.status === 'accepted' ? '#22c55e' :
                                 (snapshot.status === 'rejected' || snapshot.status === 'missing_transition') ? '#ef4444' :
                                 '#f59e0b',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                Current State: {snapshot.state} ({snapshot.status})
              </div>
            </div>

          </div>

          {/* State Transition Diagram */}
          <StateDiagram
            config={config}
            currentState={snapshot.state}
            status={snapshot.status}
            lastTransition={snapshot.lastTransition}
          />

          {/* Step Explanation Panel */}
          <StepExplanation
            snapshot={snapshot}
            numTapes={config.numTapes}
            learningMode={learningMode}
          />

          {/* State Flow Visualization */}
          <StateFlow
            stateHistory={stateHistory}
            currentState={snapshot.state}
            status={snapshot.status}
            acceptStates={config.acceptStates}
            rejectStates={config.rejectStates}
          />

          {/* Transition Table View */}
          <TransitionTable
            config={config}
            onConfigChange={handleConfigChange}
            activeTransition={snapshot.lastTransition}
          />

          {/* Transition Validation Panel */}
          <TransitionValidation
            config={config}
            onConfigChange={handleConfigChange}
            onToast={addToast}
          />

          {/* Test Runner Panel */}
          <TestRunner
            config={config}
            onToast={addToast}
          />

          {/* Comparative View */}
          {showComparison && (
            <ComparativeView
              config={config}
              multiTapeSteps={snapshot.step}
              status={snapshot.status}
              history={efficiencyHistory}
            />
          )}

          {/* Educational Panel */}
          <EducationalPanel />
        </main>

        {/* ===== Sidebar ===== */}
        <aside className="sidebar">
          <TransitionEditor
            config={config}
            onConfigChange={handleConfigChange}
            activeTransition={snapshot.lastTransition}
            isCustomMode={true}
            onToast={addToast}
          />
          <StatePanel
            currentState={snapshot.state}
            status={snapshot.status}
            history={machine.getHistory()}
            allStates={config.states}
            acceptStates={config.acceptStates}
            rejectStates={config.rejectStates}
          />
        </aside>

        {/* ===== Bottom Bar (Playback Controls) ===== */}
        <div className="bottom-bar">
          <PlaybackControls
            isPlaying={isPlaying}
            canStep={canStep}
            canStepBack={canStepBack}
            speed={speed}
            stepCount={snapshot.step}
            currentState={snapshot.state}
            status={snapshot.status}
            onPlay={handlePlay}
            onPause={handlePause}
            onStep={handleStep}
            onStepBack={handleStepBack}
            onReset={handleReset}
            onSpeedChange={setSpeed}
          />
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {modeMessage && (
        <div className="mode-toast" style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: safeMode ? '#10b981' : '#f59e0b',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
          zIndex: 9999,
          fontWeight: 500,
        }}>
          {modeMessage}
        </div>
      )}
    </>
  );
}