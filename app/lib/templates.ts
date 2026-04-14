import { MachineConfig } from './turingEngine';

// ===== Learner-Friendly Templates for Custom Mode =====

export interface MachineTemplate {
  label: string;
  emoji: string;
  description: string;
  config: MachineConfig;
  sampleInput: string;
}

export const TEMPLATES: MachineTemplate[] = [
  {
    label: 'Load aⁿbⁿ Template',
    emoji: '🔤',
    description: 'Checks if input has equal a\'s followed by equal b\'s',
    sampleInput: 'aabb',
    config: {
      name: 'aⁿbⁿ Checker (Template)',
      description:
        'Checks if the input string is in the language { aⁿbⁿ | n ≥ 1 }. Marks each \'a\' as \'X\', scans right to find matching \'b\' and marks it as \'Y\', then rewinds.',
      numTapes: 1,
      states: ['q0', 'q1', 'q2', 'q3', 'qAccept', 'qReject'],
      alphabet: ['a', 'b', 'X', 'Y', 'B'],
      blankSymbol: 'B',
      initialState: 'q0',
      acceptStates: ['qAccept'],
      rejectStates: ['qReject'],
      transitions: [
        { fromState: 'q0', readSymbols: ['a'], toState: 'q1', writeSymbols: ['X'], directions: ['R'] },
        { fromState: 'q0', readSymbols: ['Y'], toState: 'q3', writeSymbols: ['Y'], directions: ['R'] },
        { fromState: 'q0', readSymbols: ['B'], toState: 'qReject', writeSymbols: ['B'], directions: ['S'] },
        { fromState: 'q0', readSymbols: ['b'], toState: 'qReject', writeSymbols: ['b'], directions: ['S'] },
        { fromState: 'q1', readSymbols: ['a'], toState: 'q1', writeSymbols: ['a'], directions: ['R'] },
        { fromState: 'q1', readSymbols: ['Y'], toState: 'q1', writeSymbols: ['Y'], directions: ['R'] },
        { fromState: 'q1', readSymbols: ['b'], toState: 'q2', writeSymbols: ['Y'], directions: ['L'] },
        { fromState: 'q1', readSymbols: ['B'], toState: 'qReject', writeSymbols: ['B'], directions: ['S'] },
        { fromState: 'q2', readSymbols: ['a'], toState: 'q2', writeSymbols: ['a'], directions: ['L'] },
        { fromState: 'q2', readSymbols: ['Y'], toState: 'q2', writeSymbols: ['Y'], directions: ['L'] },
        { fromState: 'q2', readSymbols: ['X'], toState: 'q0', writeSymbols: ['X'], directions: ['R'] },
        { fromState: 'q3', readSymbols: ['Y'], toState: 'q3', writeSymbols: ['Y'], directions: ['R'] },
        { fromState: 'q3', readSymbols: ['B'], toState: 'qAccept', writeSymbols: ['B'], directions: ['S'] },
        { fromState: 'q3', readSymbols: ['b'], toState: 'qReject', writeSymbols: ['b'], directions: ['S'] },
      ],
      initialTapes: [['a', 'a', 'b', 'b']],
    },
  },
  {
    label: 'Load Palindrome Template',
    emoji: '🔁',
    description: 'Checks if input reads the same forwards and backwards',
    sampleInput: 'abba',
    config: {
      name: 'Palindrome Checker (Template)',
      description:
        'Checks if the input is a palindrome by copying it in reverse to Tape 2, then comparing both tapes character by character.',
      numTapes: 2,
      states: ['qCopy', 'qRewind1', 'qRewind2', 'qCompare', 'qAccept', 'qReject'],
      alphabet: ['a', 'b', 'B'],
      blankSymbol: 'B',
      initialState: 'qCopy',
      acceptStates: ['qAccept'],
      rejectStates: ['qReject'],
      transitions: [
        { fromState: 'qCopy', readSymbols: ['a', 'B'], toState: 'qCopy', writeSymbols: ['a', 'B'], directions: ['R', 'S'] },
        { fromState: 'qCopy', readSymbols: ['b', 'B'], toState: 'qCopy', writeSymbols: ['b', 'B'], directions: ['R', 'S'] },
        { fromState: 'qCopy', readSymbols: ['B', 'B'], toState: 'qRewind1', writeSymbols: ['B', 'B'], directions: ['L', 'S'] },
        { fromState: 'qRewind1', readSymbols: ['a', 'B'], toState: 'qRewind1', writeSymbols: ['a', 'a'], directions: ['L', 'R'] },
        { fromState: 'qRewind1', readSymbols: ['b', 'B'], toState: 'qRewind1', writeSymbols: ['b', 'b'], directions: ['L', 'R'] },
        { fromState: 'qRewind1', readSymbols: ['B', 'B'], toState: 'qRewind2', writeSymbols: ['B', 'B'], directions: ['R', 'L'] },
        { fromState: 'qRewind2', readSymbols: ['*', 'a'], toState: 'qRewind2', writeSymbols: ['*', 'a'], directions: ['S', 'L'] },
        { fromState: 'qRewind2', readSymbols: ['*', 'b'], toState: 'qRewind2', writeSymbols: ['*', 'b'], directions: ['S', 'L'] },
        { fromState: 'qRewind2', readSymbols: ['*', 'B'], toState: 'qCompare', writeSymbols: ['*', 'B'], directions: ['S', 'R'] },
        { fromState: 'qCompare', readSymbols: ['a', 'a'], toState: 'qCompare', writeSymbols: ['a', 'a'], directions: ['R', 'R'] },
        { fromState: 'qCompare', readSymbols: ['b', 'b'], toState: 'qCompare', writeSymbols: ['b', 'b'], directions: ['R', 'R'] },
        { fromState: 'qCompare', readSymbols: ['a', 'b'], toState: 'qReject', writeSymbols: ['a', 'b'], directions: ['S', 'S'] },
        { fromState: 'qCompare', readSymbols: ['b', 'a'], toState: 'qReject', writeSymbols: ['b', 'a'], directions: ['S', 'S'] },
        { fromState: 'qCompare', readSymbols: ['B', 'B'], toState: 'qAccept', writeSymbols: ['B', 'B'], directions: ['S', 'S'] },
      ],
      initialTapes: [['a', 'b', 'b', 'a'], []],
    },
  },
  {
    label: 'Load String Reversal Template',
    emoji: '🔄',
    description: 'Reverses the input string onto a second tape',
    sampleInput: 'abc',
    config: {
      name: 'String Reversal (Template)',
      description: 'Scans Tape 1 to the right, writes to Tape 2 in reverse, and finally rewinds Tape 2 to the start.',
      numTapes: 2,
      states: ['qStart', 'qMoveRight', 'qWriteReverse', 'qRewind', 'qAccept', 'qReject'],
      alphabet: ['a', 'b', 'c', 'B'],
      blankSymbol: 'B',
      initialState: 'qStart',
      acceptStates: ['qAccept'],
      rejectStates: ['qReject'],
      transitions: [
        { fromState: 'qStart', readSymbols: ['a', 'B'], toState: 'qMoveRight', writeSymbols: ['a', 'B'], directions: ['S', 'S'] },
        { fromState: 'qStart', readSymbols: ['b', 'B'], toState: 'qMoveRight', writeSymbols: ['b', 'B'], directions: ['S', 'S'] },
        { fromState: 'qStart', readSymbols: ['c', 'B'], toState: 'qMoveRight', writeSymbols: ['c', 'B'], directions: ['S', 'S'] },
        { fromState: 'qStart', readSymbols: ['B', 'B'], toState: 'qAccept', writeSymbols: ['B', 'B'], directions: ['S', 'S'] },
        
        { fromState: 'qMoveRight', readSymbols: ['a', 'B'], toState: 'qMoveRight', writeSymbols: ['a', 'B'], directions: ['R', 'S'] },
        { fromState: 'qMoveRight', readSymbols: ['b', 'B'], toState: 'qMoveRight', writeSymbols: ['b', 'B'], directions: ['R', 'S'] },
        { fromState: 'qMoveRight', readSymbols: ['c', 'B'], toState: 'qMoveRight', writeSymbols: ['c', 'B'], directions: ['R', 'S'] },
        { fromState: 'qMoveRight', readSymbols: ['B', 'B'], toState: 'qWriteReverse', writeSymbols: ['B', 'B'], directions: ['L', 'S'] },
        
        { fromState: 'qWriteReverse', readSymbols: ['a', 'B'], toState: 'qWriteReverse', writeSymbols: ['a', 'a'], directions: ['L', 'R'] },
        { fromState: 'qWriteReverse', readSymbols: ['b', 'B'], toState: 'qWriteReverse', writeSymbols: ['b', 'b'], directions: ['L', 'R'] },
        { fromState: 'qWriteReverse', readSymbols: ['c', 'B'], toState: 'qWriteReverse', writeSymbols: ['c', 'c'], directions: ['L', 'R'] },
        { fromState: 'qWriteReverse', readSymbols: ['B', 'B'], toState: 'qRewind', writeSymbols: ['B', 'B'], directions: ['S', 'L'] },
        
        { fromState: 'qRewind', readSymbols: ['B', 'a'], toState: 'qRewind', writeSymbols: ['B', 'a'], directions: ['S', 'L'] },
        { fromState: 'qRewind', readSymbols: ['B', 'b'], toState: 'qRewind', writeSymbols: ['B', 'b'], directions: ['S', 'L'] },
        { fromState: 'qRewind', readSymbols: ['B', 'c'], toState: 'qRewind', writeSymbols: ['B', 'c'], directions: ['S', 'L'] },
        { fromState: 'qRewind', readSymbols: ['B', 'B'], toState: 'qAccept', writeSymbols: ['B', 'B'], directions: ['S', 'R'] },
      ],
      initialTapes: [['a', 'b', 'c'], []],
    },
  },
];
