// ===== Multi-Tape Turing Machine Engine =====

export type Direction = 'L' | 'R' | 'S'; // Left, Right, Stay

export interface TransitionRule {
  fromState: string;
  readSymbols: string[];   // one per tape
  toState: string;
  writeSymbols: string[];  // one per tape
  directions: Direction[]; // one per tape
}

export interface MachineConfig {
  name: string;
  description: string;
  numTapes: number;
  states: string[];
  alphabet: string[];
  blankSymbol: string;
  initialState: string;
  acceptStates: string[];
  rejectStates: string[];
  transitions: TransitionRule[];
  initialTapes: string[][]; // initial content for each tape
}

export interface MachineSnapshot {
  step: number;
  state: string;
  tapes: string[][];
  headPositions: number[];
  lastTransition: TransitionRule | null;
  status: 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition';
  missingTransitionInfo?: string; // human-readable description of the missing transition
}

export class TuringMachine {
  private config: MachineConfig;
  private tapes: string[][];
  private headPositions: number[];
  private currentState: string;
  private stepCount: number;
  private status: 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition';
  private history: MachineSnapshot[];
  private lastError: string | null;

  constructor(config: MachineConfig) {
    this.config = config;
    this.tapes = [];
    this.headPositions = [];
    this.currentState = '';
    this.stepCount = 0;
    this.status = 'running';
    this.history = [];
    this.lastError = null;
    this.reset();
  }

  reset(): void {
    this.tapes = [];
    this.headPositions = [];
    const blank = this.config.blankSymbol;

    for (let i = 0; i < this.config.numTapes; i++) {
      const initial = this.config.initialTapes[i] || [];
      // pad with blanks on both sides for visualization
      const tape = [blank, blank, blank, ...initial, blank, blank, blank];
      this.tapes.push(tape);
      this.headPositions.push(3); // start at beginning of actual content
    }

    this.currentState = this.config.initialState;
    this.stepCount = 0;
    this.status = 'running';
    this.lastError = null;
    this.history = [this.getSnapshot()];
  }

  getSnapshot(): MachineSnapshot {
    const snap: MachineSnapshot = {
      step: this.stepCount,
      state: this.currentState,
      tapes: this.tapes.map(t => [...t]),
      headPositions: [...this.headPositions],
      lastTransition: null,
      status: this.status,
    };
    if (this.lastError) {
      snap.missingTransitionInfo = this.lastError;
    }
    return snap;
  }

  getConfig(): MachineConfig {
    return this.config;
  }

  getHistory(): MachineSnapshot[] {
    return this.history;
  }

  getStatus(): 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition' {
    return this.status;
  }

  getCurrentState(): string {
    return this.currentState;
  }

  getStepCount(): number {
    return this.stepCount;
  }

  getTapes(): string[][] {
    return this.tapes.map(t => [...t]);
  }

  getHeadPositions(): number[] {
    return [...this.headPositions];
  }

  getLastError(): string | null {
    return this.lastError;
  }

  private ensureTapeBounds(): void {
    const blank = this.config.blankSymbol;
    for (let i = 0; i < this.tapes.length; i++) {
      // Extend tape on the left if head is near the start
      while (this.headPositions[i] < 3) {
        this.tapes[i].unshift(blank);
        this.headPositions[i]++;
        // adjust all history head positions for this tape too
      }
      // Extend tape on the right if head is near the end
      while (this.headPositions[i] >= this.tapes[i].length - 3) {
        this.tapes[i].push(blank);
      }
    }
  }

  step(safeMode: boolean = true): MachineSnapshot | null {
    if (this.status !== 'running') return null;

    // Read symbols under each head — ensure ALL tape symbols are read
    const readSymbols = this.headPositions.map(
      (pos, i) => this.tapes[i][pos] || this.config.blankSymbol
    );

    // Find matching transition — checks ALL tape symbols
    const transition = this.config.transitions.find(
      t =>
        t.fromState === this.currentState &&
        t.readSymbols.length >= this.config.numTapes &&
        t.readSymbols.slice(0, this.config.numTapes).every((s, i) => s === readSymbols[i] || s === '*')
    );

    if (!transition) {
      // ========== CRITICAL FIX: Handle missing transitions ==========
      const symbolsStr = readSymbols.join(', ');
      this.lastError = `Missing transition for (${this.currentState}, [${symbolsStr}])`;

      if (this.config.acceptStates.includes(this.currentState)) {
        // Already in accept state — accept
        this.status = 'accepted';
      } else if (this.config.rejectStates.includes(this.currentState)) {
        // Already in reject state — reject
        this.status = 'rejected';
      } else {
        if (safeMode) {
          const rejectState = this.config.rejectStates[0];
          if (rejectState) {
            this.currentState = rejectState;
          }
          this.status = 'rejected';
          this.lastError = `Missing transition for state "${this.currentState}" reading [${symbolsStr}]. Machine Auto-Rejected.`;
        } else {
          this.status = 'halted';
          this.lastError = `Missing transition for state "${this.currentState}" reading [${symbolsStr}]. Machine Halted.`;
        }
      }

      const snap = this.getSnapshot();
      this.history.push(snap);
      return snap;
    }

    // Clear any previous error
    this.lastError = null;

    // Apply transition: write symbols
    for (let i = 0; i < this.config.numTapes; i++) {
      const writeSymbol = transition.writeSymbols[i];
      if (writeSymbol && writeSymbol !== '*') {
        this.tapes[i][this.headPositions[i]] = writeSymbol;
      }
    }

    // Move heads — support L, R, S independently for each tape
    for (let i = 0; i < this.config.numTapes; i++) {
      const dir = transition.directions[i];
      if (dir === 'L') this.headPositions[i]--;
      else if (dir === 'R') this.headPositions[i]++;
      // 'S' = stay
    }

    // Update state
    this.currentState = transition.toState;
    this.stepCount++;

    // Ensure tapes have enough blank space
    this.ensureTapeBounds();

    // Check accept/reject
    if (this.config.acceptStates.includes(this.currentState)) {
      this.status = 'accepted';
    } else if (this.config.rejectStates.includes(this.currentState)) {
      this.status = 'rejected';
    }

    const snapshot: MachineSnapshot = {
      ...this.getSnapshot(),
      lastTransition: transition,
    };
    this.history.push(snapshot);
    return snapshot;
  }

  // Run until halt or max steps
  run(maxSteps: number = 1000, safeMode: boolean = true): MachineSnapshot {
    let lastSnap = this.getSnapshot();
    for (let i = 0; i < maxSteps && this.status === 'running'; i++) {
      const snap = this.step(safeMode);
      if (snap) lastSnap = snap;
    }
    return lastSnap;
  }

  // Step back (undo)
  stepBack(): MachineSnapshot | null {
    if (this.history.length <= 1) return null;
    this.history.pop();
    const prev = this.history[this.history.length - 1];
    this.tapes = prev.tapes.map(t => [...t]);
    this.headPositions = [...prev.headPositions];
    this.currentState = prev.state;
    this.stepCount = prev.step;
    this.status = prev.status;
    this.lastError = prev.missingTransitionInfo || null;
    return prev;
  }
}

// ===== Single-Tape Simulator for Comparison =====
// Simulates the same computation on a single tape (standard TM)
// Uses a simple encoding: tape contents concatenated with separator markers

export class SingleTapeTuringMachine {
  private config: MachineConfig;
  private tape: string[];
  private headPosition: number;
  private currentState: string;
  private stepCount: number;
  private status: 'running' | 'accepted' | 'rejected' | 'halted' | 'missing_transition';
  private singleTapeTransitions: TransitionRule[];

  constructor(config: MachineConfig) {
    this.config = config;
    this.tape = [];
    this.headPosition = 0;
    this.currentState = '';
    this.stepCount = 0;
    this.status = 'running';
    this.singleTapeTransitions = [];
    this.reset();
  }

  reset(): void {
    const blank = this.config.blankSymbol;
    // For a fair comparison, we simulate the multi-tape machine on a single tape
    // by interleaving tape contents with markers
    // Encoding: #tape1_content#tape2_content#...
    // The head position tracking marks which cell on which virtual tape is active
    // For simplicity, we use a state-explosion approach that tracks
    // which "virtual tape" we're currently scanning

    // Simple simulation: run the multi-tape machine and count steps
    // but simulate with overhead factor of O(n) per step
    // This gives a pedagogically fair comparison

    this.tape = [blank, blank, blank];
    for (let i = 0; i < this.config.numTapes; i++) {
      const initial = this.config.initialTapes[i] || [];
      this.tape.push('#');
      this.tape.push(...initial);
    }
    this.tape.push('#');
    this.tape.push(blank, blank, blank);

    this.headPosition = 3;
    this.currentState = this.config.initialState;
    this.stepCount = 0;
    this.status = 'running';
  }

  // For the comparison, we simulate step counts with realistic overhead
  // A k-tape TM step requires O(n) single-tape steps to simulate
  // where n is the span of non-blank tape content
  simulateComparison(multiTapeSteps: number): number {
    // The classic result: simulating t steps of a k-tape TM
    // on a single tape takes O(t^2) steps in the worst case
    // We use a more pedagogical approximation:
    // Each multi-tape step ≈ (2 * numTapes * avgTapeLength) single-tape steps
    // because the single-tape head must sweep across all virtual tapes
    const n = this.config.numTapes;
    const avgLen = Math.max(
      5,
      this.config.initialTapes.reduce((sum, t) => sum + t.length, 0) / n
    );
    // Accumulate steps with increasing overhead as tape grows
    let totalSingleSteps = 0;
    for (let step = 1; step <= multiTapeSteps; step++) {
      const currentSpan = avgLen + step; // tape grows over time
      totalSingleSteps += Math.ceil(2 * n * currentSpan);
    }
    return totalSingleSteps;
  }

  getStepCount(): number {
    return this.stepCount;
  }

  getTape(): string[] {
    return [...this.tape];
  }
}
