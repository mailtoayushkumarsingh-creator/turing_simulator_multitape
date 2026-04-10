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
      alphabet: ['a', 'b', 'X', 'Y', '_'],
      blankSymbol: '_',
      initialState: 'q0',
      acceptStates: ['qAccept'],
      rejectStates: ['qReject'],
      transitions: [
        { fromState: 'q0', readSymbols: ['a'], toState: 'q1', writeSymbols: ['X'], directions: ['R'] },
        { fromState: 'q0', readSymbols: ['Y'], toState: 'q3', writeSymbols: ['Y'], directions: ['R'] },
        { fromState: 'q0', readSymbols: ['_'], toState: 'qReject', writeSymbols: ['_'], directions: ['S'] },
        { fromState: 'q0', readSymbols: ['b'], toState: 'qReject', writeSymbols: ['b'], directions: ['S'] },
        { fromState: 'q1', readSymbols: ['a'], toState: 'q1', writeSymbols: ['a'], directions: ['R'] },
        { fromState: 'q1', readSymbols: ['Y'], toState: 'q1', writeSymbols: ['Y'], directions: ['R'] },
        { fromState: 'q1', readSymbols: ['b'], toState: 'q2', writeSymbols: ['Y'], directions: ['L'] },
        { fromState: 'q1', readSymbols: ['_'], toState: 'qReject', writeSymbols: ['_'], directions: ['S'] },
        { fromState: 'q2', readSymbols: ['a'], toState: 'q2', writeSymbols: ['a'], directions: ['L'] },
        { fromState: 'q2', readSymbols: ['Y'], toState: 'q2', writeSymbols: ['Y'], directions: ['L'] },
        { fromState: 'q2', readSymbols: ['X'], toState: 'q0', writeSymbols: ['X'], directions: ['R'] },
        { fromState: 'q3', readSymbols: ['Y'], toState: 'q3', writeSymbols: ['Y'], directions: ['R'] },
        { fromState: 'q3', readSymbols: ['_'], toState: 'qAccept', writeSymbols: ['_'], directions: ['S'] },
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
      alphabet: ['a', 'b', '_'],
      blankSymbol: '_',
      initialState: 'qCopy',
      acceptStates: ['qAccept'],
      rejectStates: ['qReject'],
      transitions: [
        { fromState: 'qCopy', readSymbols: ['a', '_'], toState: 'qCopy', writeSymbols: ['a', '_'], directions: ['R', 'S'] },
        { fromState: 'qCopy', readSymbols: ['b', '_'], toState: 'qCopy', writeSymbols: ['b', '_'], directions: ['R', 'S'] },
        { fromState: 'qCopy', readSymbols: ['_', '_'], toState: 'qRewind1', writeSymbols: ['_', '_'], directions: ['L', 'S'] },
        { fromState: 'qRewind1', readSymbols: ['a', '_'], toState: 'qRewind1', writeSymbols: ['a', 'a'], directions: ['L', 'R'] },
        { fromState: 'qRewind1', readSymbols: ['b', '_'], toState: 'qRewind1', writeSymbols: ['b', 'b'], directions: ['L', 'R'] },
        { fromState: 'qRewind1', readSymbols: ['_', '_'], toState: 'qRewind2', writeSymbols: ['_', '_'], directions: ['R', 'L'] },
        { fromState: 'qRewind2', readSymbols: ['*', 'a'], toState: 'qRewind2', writeSymbols: ['*', 'a'], directions: ['S', 'L'] },
        { fromState: 'qRewind2', readSymbols: ['*', 'b'], toState: 'qRewind2', writeSymbols: ['*', 'b'], directions: ['S', 'L'] },
        { fromState: 'qRewind2', readSymbols: ['*', '_'], toState: 'qCompare', writeSymbols: ['*', '_'], directions: ['S', 'R'] },
        { fromState: 'qCompare', readSymbols: ['a', 'a'], toState: 'qCompare', writeSymbols: ['a', 'a'], directions: ['R', 'R'] },
        { fromState: 'qCompare', readSymbols: ['b', 'b'], toState: 'qCompare', writeSymbols: ['b', 'b'], directions: ['R', 'R'] },
        { fromState: 'qCompare', readSymbols: ['a', 'b'], toState: 'qReject', writeSymbols: ['a', 'b'], directions: ['S', 'S'] },
        { fromState: 'qCompare', readSymbols: ['b', 'a'], toState: 'qReject', writeSymbols: ['b', 'a'], directions: ['S', 'S'] },
        { fromState: 'qCompare', readSymbols: ['_', '_'], toState: 'qAccept', writeSymbols: ['_', '_'], directions: ['S', 'S'] },
      ],
      initialTapes: [['a', 'b', 'b', 'a'], []],
    },
  },
];
