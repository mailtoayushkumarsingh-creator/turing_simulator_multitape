import { MachineConfig } from './turingEngine';

// ===== Pre-loaded Example Configurations =====

export const EXAMPLES: MachineConfig[] = [
  // ========== 1. STRING COPY (2 tapes) ==========
  {
    name: 'String Copy',
    description:
      'Copies the input string from Tape 1 to Tape 2. Demonstrates the basic power of multi-tape machines: reading from one tape while writing to another simultaneously.',
    numTapes: 2,
    states: ['q0', 'q1', 'qAccept'],
    alphabet: ['0', '1', 'B'],
    blankSymbol: 'B',
    initialState: 'q0',
    acceptStates: ['qAccept'],
    rejectStates: [],
    transitions: [
      // q0: read from tape 1, write to tape 2
      {
        fromState: 'q0',
        readSymbols: ['0', 'B'],
        toState: 'q0',
        writeSymbols: ['0', '0'],
        directions: ['R', 'R'],
      },
      {
        fromState: 'q0',
        readSymbols: ['1', 'B'],
        toState: 'q0',
        writeSymbols: ['1', '1'],
        directions: ['R', 'R'],
      },
      // When tape 1 is blank, we're done — rewind
      {
        fromState: 'q0',
        readSymbols: ['B', 'B'],
        toState: 'q1',
        writeSymbols: ['B', 'B'],
        directions: ['L', 'L'],
      },
      // q1: rewind both tapes
      {
        fromState: 'q1',
        readSymbols: ['0', '0'],
        toState: 'q1',
        writeSymbols: ['0', '0'],
        directions: ['L', 'L'],
      },
      {
        fromState: 'q1',
        readSymbols: ['1', '1'],
        toState: 'q1',
        writeSymbols: ['1', '1'],
        directions: ['L', 'L'],
      },
      {
        fromState: 'q1',
        readSymbols: ['B', 'B'],
        toState: 'qAccept',
        writeSymbols: ['B', 'B'],
        directions: ['R', 'R'],
      },
    ],
    initialTapes: [
      ['1', '0', '1', '1', '0'],
      [],
    ],
  },

  // ========== 2. BINARY ADDITION (3 tapes) ==========
  {
    name: 'Binary Addition',
    description:
      'Adds two binary numbers from Tape 1 and Tape 2, writing the result to Tape 3. Shows how multiple tapes allow parallel data access without shuffling.',
    numTapes: 3,
    states: ['qStart', 'qAdd0', 'qAdd1', 'qCarry', 'qDone', 'qAccept'],
    alphabet: ['0', '1', 'B'],
    blankSymbol: 'B',
    initialState: 'qStart',
    acceptStates: ['qAccept'],
    rejectStates: [],
    transitions: [
      // qStart: move all heads to rightmost digit first
      {
        fromState: 'qStart',
        readSymbols: ['0', '*', 'B'],
        toState: 'qStart',
        writeSymbols: ['0', '*', 'B'],
        directions: ['R', 'S', 'S'],
      },
      {
        fromState: 'qStart',
        readSymbols: ['1', '*', 'B'],
        toState: 'qStart',
        writeSymbols: ['1', '*', 'B'],
        directions: ['R', 'S', 'S'],
      },
      {
        fromState: 'qStart',
        readSymbols: ['B', '*', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['B', '*', 'B'],
        directions: ['L', 'S', 'S'],
      },
      // qAdd0: no carry — add digits
      // 0+0=0
      {
        fromState: 'qAdd0',
        readSymbols: ['0', '0', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['0', '0', '0'],
        directions: ['L', 'L', 'L'],
      },
      // 0+1=1
      {
        fromState: 'qAdd0',
        readSymbols: ['0', '1', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['0', '1', '1'],
        directions: ['L', 'L', 'L'],
      },
      // 1+0=1
      {
        fromState: 'qAdd0',
        readSymbols: ['1', '0', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['1', '0', '1'],
        directions: ['L', 'L', 'L'],
      },
      // 1+1=0, carry
      {
        fromState: 'qAdd0',
        readSymbols: ['1', '1', 'B'],
        toState: 'qAdd1',
        writeSymbols: ['1', '1', '0'],
        directions: ['L', 'L', 'L'],
      },
      // one operand exhausted
      {
        fromState: 'qAdd0',
        readSymbols: ['B', '0', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['B', '0', '0'],
        directions: ['S', 'L', 'L'],
      },
      {
        fromState: 'qAdd0',
        readSymbols: ['B', '1', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['B', '1', '1'],
        directions: ['S', 'L', 'L'],
      },
      {
        fromState: 'qAdd0',
        readSymbols: ['0', 'B', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['0', 'B', '0'],
        directions: ['L', 'S', 'L'],
      },
      {
        fromState: 'qAdd0',
        readSymbols: ['1', 'B', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['1', 'B', '1'],
        directions: ['L', 'S', 'L'],
      },
      // both done, no carry
      {
        fromState: 'qAdd0',
        readSymbols: ['B', 'B', 'B'],
        toState: 'qDone',
        writeSymbols: ['B', 'B', 'B'],
        directions: ['S', 'S', 'R'],
      },

      // qAdd1: carry = 1
      // 0+0+1=1
      {
        fromState: 'qAdd1',
        readSymbols: ['0', '0', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['0', '0', '1'],
        directions: ['L', 'L', 'L'],
      },
      // 0+1+1=0, carry
      {
        fromState: 'qAdd1',
        readSymbols: ['0', '1', 'B'],
        toState: 'qAdd1',
        writeSymbols: ['0', '1', '0'],
        directions: ['L', 'L', 'L'],
      },
      // 1+0+1=0, carry
      {
        fromState: 'qAdd1',
        readSymbols: ['1', '0', 'B'],
        toState: 'qAdd1',
        writeSymbols: ['1', '0', '0'],
        directions: ['L', 'L', 'L'],
      },
      // 1+1+1=1, carry
      {
        fromState: 'qAdd1',
        readSymbols: ['1', '1', 'B'],
        toState: 'qAdd1',
        writeSymbols: ['1', '1', '1'],
        directions: ['L', 'L', 'L'],
      },
      // one operand exhausted with carry
      {
        fromState: 'qAdd1',
        readSymbols: ['B', '0', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['B', '0', '1'],
        directions: ['S', 'L', 'L'],
      },
      {
        fromState: 'qAdd1',
        readSymbols: ['B', '1', 'B'],
        toState: 'qAdd1',
        writeSymbols: ['B', '1', '0'],
        directions: ['S', 'L', 'L'],
      },
      {
        fromState: 'qAdd1',
        readSymbols: ['0', 'B', 'B'],
        toState: 'qAdd0',
        writeSymbols: ['0', 'B', '1'],
        directions: ['L', 'S', 'L'],
      },
      {
        fromState: 'qAdd1',
        readSymbols: ['1', 'B', 'B'],
        toState: 'qAdd1',
        writeSymbols: ['1', 'B', '0'],
        directions: ['L', 'S', 'L'],
      },
      // both done, carry remains
      {
        fromState: 'qAdd1',
        readSymbols: ['B', 'B', 'B'],
        toState: 'qDone',
        writeSymbols: ['B', 'B', '1'],
        directions: ['S', 'S', 'R'],
      },

      // qDone: accept
      {
        fromState: 'qDone',
        readSymbols: ['*', '*', '*'],
        toState: 'qAccept',
        writeSymbols: ['*', '*', '*'],
        directions: ['S', 'S', 'S'],
      },
    ],
    initialTapes: [
      ['1', '0', '1', '1'],  // 11 in decimal
      ['1', '1', '0'],        // 6 in decimal
      [],                      // result tape
    ],
  },

  // ========== 3. PALINDROME CHECKER (2 tapes) ==========
  {
    name: 'Palindrome Checker',
    description:
      'Checks if the input string on Tape 1 is a palindrome by copying it in reverse to Tape 2, then comparing. A single-tape machine would need many back-and-forth sweeps.',
    numTapes: 2,
    states: ['qCopy', 'qRewind1', 'qRewind2', 'qCompare', 'qAccept', 'qReject'],
    alphabet: ['a', 'b', 'B'],
    blankSymbol: 'B',
    initialState: 'qCopy',
    acceptStates: ['qAccept'],
    rejectStates: ['qReject'],
    transitions: [
      // qCopy: move tape 1 head to end while counting
      {
        fromState: 'qCopy',
        readSymbols: ['a', 'B'],
        toState: 'qCopy',
        writeSymbols: ['a', 'B'],
        directions: ['R', 'S'],
      },
      {
        fromState: 'qCopy',
        readSymbols: ['b', 'B'],
        toState: 'qCopy',
        writeSymbols: ['b', 'B'],
        directions: ['R', 'S'],
      },
      // end of input: start reverse copy
      {
        fromState: 'qCopy',
        readSymbols: ['B', 'B'],
        toState: 'qRewind1',
        writeSymbols: ['B', 'B'],
        directions: ['L', 'S'],
      },
      // qRewind1: copy tape 1 in reverse to tape 2
      {
        fromState: 'qRewind1',
        readSymbols: ['a', 'B'],
        toState: 'qRewind1',
        writeSymbols: ['a', 'a'],
        directions: ['L', 'R'],
      },
      {
        fromState: 'qRewind1',
        readSymbols: ['b', 'B'],
        toState: 'qRewind1',
        writeSymbols: ['b', 'b'],
        directions: ['L', 'R'],
      },
      // reached beginning of tape 1
      {
        fromState: 'qRewind1',
        readSymbols: ['B', 'B'],
        toState: 'qRewind2',
        writeSymbols: ['B', 'B'],
        directions: ['R', 'L'],
      },
      // qRewind2: rewind tape 2 head to start
      {
        fromState: 'qRewind2',
        readSymbols: ['*', 'a'],
        toState: 'qRewind2',
        writeSymbols: ['*', 'a'],
        directions: ['S', 'L'],
      },
      {
        fromState: 'qRewind2',
        readSymbols: ['*', 'b'],
        toState: 'qRewind2',
        writeSymbols: ['*', 'b'],
        directions: ['S', 'L'],
      },
      {
        fromState: 'qRewind2',
        readSymbols: ['*', 'B'],
        toState: 'qCompare',
        writeSymbols: ['*', 'B'],
        directions: ['S', 'R'],
      },
      // qCompare: compare tape 1 (forward) with tape 2 (forward = reverse of original)
      {
        fromState: 'qCompare',
        readSymbols: ['a', 'a'],
        toState: 'qCompare',
        writeSymbols: ['a', 'a'],
        directions: ['R', 'R'],
      },
      {
        fromState: 'qCompare',
        readSymbols: ['b', 'b'],
        toState: 'qCompare',
        writeSymbols: ['b', 'b'],
        directions: ['R', 'R'],
      },
      // mismatch
      {
        fromState: 'qCompare',
        readSymbols: ['a', 'b'],
        toState: 'qReject',
        writeSymbols: ['a', 'b'],
        directions: ['S', 'S'],
      },
      {
        fromState: 'qCompare',
        readSymbols: ['b', 'a'],
        toState: 'qReject',
        writeSymbols: ['b', 'a'],
        directions: ['S', 'S'],
      },
      // both done — palindrome!
      {
        fromState: 'qCompare',
        readSymbols: ['B', 'B'],
        toState: 'qAccept',
        writeSymbols: ['B', 'B'],
        directions: ['S', 'S'],
      },
    ],
    initialTapes: [
      ['a', 'b', 'b', 'a'],
      [],
    ],
  },

  // ========== 4. STRING REVERSAL (2 tapes) ==========
  {
    name: 'String Reversal',
    description:
      'Reverses the input string from Tape 1 onto Tape 2. First moves to the end of Tape 1, then copies characters backwards to Tape 2, demonstrating efficient data rearrangement with two tapes.',
    numTapes: 2,
    states: ['qRight', 'qCopyRev', 'qAccept'],
    alphabet: ['a', 'b', 'c', 'B'],
    blankSymbol: 'B',
    initialState: 'qRight',
    acceptStates: ['qAccept'],
    rejectStates: [],
    transitions: [
      // qRight: move tape 1 head to end of input
      {
        fromState: 'qRight',
        readSymbols: ['a', 'B'],
        toState: 'qRight',
        writeSymbols: ['a', 'B'],
        directions: ['R', 'S'],
      },
      {
        fromState: 'qRight',
        readSymbols: ['b', 'B'],
        toState: 'qRight',
        writeSymbols: ['b', 'B'],
        directions: ['R', 'S'],
      },
      {
        fromState: 'qRight',
        readSymbols: ['c', 'B'],
        toState: 'qRight',
        writeSymbols: ['c', 'B'],
        directions: ['R', 'S'],
      },
      // reached blank — start copying in reverse
      {
        fromState: 'qRight',
        readSymbols: ['B', 'B'],
        toState: 'qCopyRev',
        writeSymbols: ['B', 'B'],
        directions: ['L', 'S'],
      },
      // qCopyRev: read from tape 1 going left, write to tape 2 going right
      {
        fromState: 'qCopyRev',
        readSymbols: ['a', 'B'],
        toState: 'qCopyRev',
        writeSymbols: ['a', 'a'],
        directions: ['L', 'R'],
      },
      {
        fromState: 'qCopyRev',
        readSymbols: ['b', 'B'],
        toState: 'qCopyRev',
        writeSymbols: ['b', 'b'],
        directions: ['L', 'R'],
      },
      {
        fromState: 'qCopyRev',
        readSymbols: ['c', 'B'],
        toState: 'qCopyRev',
        writeSymbols: ['c', 'c'],
        directions: ['L', 'R'],
      },
      // done reversing
      {
        fromState: 'qCopyRev',
        readSymbols: ['B', 'B'],
        toState: 'qAccept',
        writeSymbols: ['B', 'B'],
        directions: ['S', 'S'],
      },
    ],
    initialTapes: [
      ['a', 'b', 'c', 'b', 'a'],
      [],
    ],
  },

  // ========== 5. UNARY MULTIPLICATION (3 tapes) ==========
  {
    name: 'Unary Multiplication',
    description:
      'Multiplies two unary numbers (Tape 1 × Tape 2) and writes the result on Tape 3. For each "1" on Tape 1, copies all of Tape 2 onto Tape 3. Shows how multiple tapes simplify nested loops.',
    numTapes: 3,
    states: ['qRead1', 'qCopy2', 'qRewind2', 'qNext1', 'qAccept'],
    alphabet: ['1', 'B'],
    blankSymbol: 'B',
    initialState: 'qRead1',
    acceptStates: ['qAccept'],
    rejectStates: [],
    transitions: [
      // qRead1: read a 1 from tape 1, start copying tape 2
      {
        fromState: 'qRead1',
        readSymbols: ['1', '*', 'B'],
        toState: 'qCopy2',
        writeSymbols: ['1', '*', 'B'],
        directions: ['S', 'S', 'S'],
      },
      // tape 1 exhausted — done
      {
        fromState: 'qRead1',
        readSymbols: ['B', '*', 'B'],
        toState: 'qAccept',
        writeSymbols: ['B', '*', 'B'],
        directions: ['S', 'S', 'S'],
      },
      // qCopy2: copy each 1 from tape 2 to tape 3
      {
        fromState: 'qCopy2',
        readSymbols: ['*', '1', 'B'],
        toState: 'qCopy2',
        writeSymbols: ['*', '1', '1'],
        directions: ['S', 'R', 'R'],
      },
      // tape 2 exhausted — rewind tape 2
      {
        fromState: 'qCopy2',
        readSymbols: ['*', 'B', 'B'],
        toState: 'qRewind2',
        writeSymbols: ['*', 'B', 'B'],
        directions: ['S', 'L', 'S'],
      },
      // qRewind2: rewind tape 2 head back to start
      {
        fromState: 'qRewind2',
        readSymbols: ['*', '1', '*'],
        toState: 'qRewind2',
        writeSymbols: ['*', '1', '*'],
        directions: ['S', 'L', 'S'],
      },
      {
        fromState: 'qRewind2',
        readSymbols: ['*', 'B', '*'],
        toState: 'qNext1',
        writeSymbols: ['*', 'B', '*'],
        directions: ['S', 'R', 'S'],
      },
      // qNext1: move to next symbol on tape 1
      {
        fromState: 'qNext1',
        readSymbols: ['1', '*', '*'],
        toState: 'qRead1',
        writeSymbols: ['1', '*', '*'],
        directions: ['R', 'S', 'S'],
      },
      {
        fromState: 'qNext1',
        readSymbols: ['B', '*', '*'],
        toState: 'qAccept',
        writeSymbols: ['B', '*', '*'],
        directions: ['S', 'S', 'S'],
      },
    ],
    initialTapes: [
      ['1', '1', '1'],     // 3
      ['1', '1'],           // × 2
      [],                    // result: 6 ones
    ],
  },

  // ========== 6. a^n b^n LANGUAGE CHECKER (1 tape — Classical) ==========
  {
    name: 'aⁿbⁿ (1 tape - Classical)',
    description:
      'Classic single-tape algorithm for { aⁿbⁿ | n ≥ 1 }. Marks each \'a\' as \'X\', scans right to find matching \'b\' and marks it as \'Y\', then rewinds. Requires O(n²) steps due to repeated back-and-forth scanning on one tape.',
    numTapes: 1,
    states: ['q0', 'q1', 'q2', 'q3', 'qAccept', 'qReject'],
    alphabet: ['a', 'b', 'X', 'Y', 'B'],
    blankSymbol: 'B',
    initialState: 'q0',
    acceptStates: ['qAccept'],
    rejectStates: ['qReject'],
    transitions: [
      // q0: Find the leftmost 'a' and mark it as 'X'
      {
        fromState: 'q0',
        readSymbols: ['a'],
        toState: 'q1',
        writeSymbols: ['X'],
        directions: ['R'],
      },
      // q0: Skip over already-marked 'Y's
      {
        fromState: 'q0',
        readSymbols: ['Y'],
        toState: 'q3',
        writeSymbols: ['Y'],
        directions: ['R'],
      },
      // q0: If we see blank or 'b' first, input is invalid
      {
        fromState: 'q0',
        readSymbols: ['B'],
        toState: 'qReject',
        writeSymbols: ['B'],
        directions: ['S'],
      },
      {
        fromState: 'q0',
        readSymbols: ['b'],
        toState: 'qReject',
        writeSymbols: ['b'],
        directions: ['S'],
      },

      // q1: Scan right past 'a's and 'Y's to find matching 'b'
      {
        fromState: 'q1',
        readSymbols: ['a'],
        toState: 'q1',
        writeSymbols: ['a'],
        directions: ['R'],
      },
      {
        fromState: 'q1',
        readSymbols: ['Y'],
        toState: 'q1',
        writeSymbols: ['Y'],
        directions: ['R'],
      },
      // q1: Found 'b' — mark it as 'Y'
      {
        fromState: 'q1',
        readSymbols: ['b'],
        toState: 'q2',
        writeSymbols: ['Y'],
        directions: ['L'],
      },
      // q1: Reached blank without finding 'b' — more a's than b's
      {
        fromState: 'q1',
        readSymbols: ['B'],
        toState: 'qReject',
        writeSymbols: ['B'],
        directions: ['S'],
      },

      // q2: Rewind left to find next unmarked 'a'
      {
        fromState: 'q2',
        readSymbols: ['a'],
        toState: 'q2',
        writeSymbols: ['a'],
        directions: ['L'],
      },
      {
        fromState: 'q2',
        readSymbols: ['Y'],
        toState: 'q2',
        writeSymbols: ['Y'],
        directions: ['L'],
      },
      // q2: Found 'X' — move right to next 'a'
      {
        fromState: 'q2',
        readSymbols: ['X'],
        toState: 'q0',
        writeSymbols: ['X'],
        directions: ['R'],
      },

      // q3: Verify all remaining symbols are 'Y' (all matched)
      {
        fromState: 'q3',
        readSymbols: ['Y'],
        toState: 'q3',
        writeSymbols: ['Y'],
        directions: ['R'],
      },
      // q3: All Y's consumed, blank reached — accept!
      {
        fromState: 'q3',
        readSymbols: ['B'],
        toState: 'qAccept',
        writeSymbols: ['B'],
        directions: ['S'],
      },
      // q3: Found unmarked 'b' — more b's than a's
      {
        fromState: 'q3',
        readSymbols: ['b'],
        toState: 'qReject',
        writeSymbols: ['b'],
        directions: ['S'],
      },
    ],
    initialTapes: [
      ['a', 'a', 'b', 'b'],
    ],
  },

  // ========== 7. a^n b^n LANGUAGE CHECKER (2 tapes — Optimized) ==========
  {
    name: 'aⁿbⁿ (2 tapes - Optimized)',
    description:
      'Optimized 2-tape version of { aⁿbⁿ | n ≥ 1 }. This version demonstrates efficiency improvement using multiple tapes: Tape 1 holds input, Tape 2 acts as a counter. Copies all \'a\'s to Tape 2, then matches each \'b\' by erasing one \'a\' from Tape 2. Runs in O(n) time — a significant improvement over the O(n²) single-tape approach.',
    numTapes: 2,
    states: ['qCopyA', 'qMatchB', 'qVerify', 'qAccept', 'qReject'],
    alphabet: ['a', 'b', 'B'],
    blankSymbol: 'B',
    initialState: 'qCopyA',
    acceptStates: ['qAccept'],
    rejectStates: ['qReject'],
    transitions: [
      // qCopyA: Copy each 'a' from Tape 1 to Tape 2 (as a counter)
      {
        fromState: 'qCopyA',
        readSymbols: ['a', 'B'],
        toState: 'qCopyA',
        writeSymbols: ['a', 'a'],
        directions: ['R', 'R'],
      },
      // qCopyA: Done with a's, start matching b's — move Tape 2 head left first
      {
        fromState: 'qCopyA',
        readSymbols: ['b', 'B'],
        toState: 'qMatchB',
        writeSymbols: ['b', 'B'],
        directions: ['S', 'L'],
      },
      // qCopyA: Empty input (blank) — reject (need at least 1 a and 1 b)
      {
        fromState: 'qCopyA',
        readSymbols: ['B', 'B'],
        toState: 'qReject',
        writeSymbols: ['B', 'B'],
        directions: ['S', 'S'],
      },

      // qMatchB: For each 'b' on Tape 1, erase one 'a' from Tape 2
      {
        fromState: 'qMatchB',
        readSymbols: ['b', 'a'],
        toState: 'qMatchB',
        writeSymbols: ['b', 'B'],
        directions: ['R', 'L'],
      },
      // qMatchB: Tape 1 hit blank — check if Tape 2 is also exhausted
      {
        fromState: 'qMatchB',
        readSymbols: ['B', 'a'],
        toState: 'qReject',
        writeSymbols: ['B', 'a'],
        directions: ['S', 'S'],
      },
      {
        fromState: 'qMatchB',
        readSymbols: ['B', 'B'],
        toState: 'qAccept',
        writeSymbols: ['B', 'B'],
        directions: ['S', 'S'],
      },
      // qMatchB: More b's than a's — Tape 2 exhausted but Tape 1 still has b's
      {
        fromState: 'qMatchB',
        readSymbols: ['b', 'B'],
        toState: 'qReject',
        writeSymbols: ['b', 'B'],
        directions: ['S', 'S'],
      },
    ],
    initialTapes: [
      ['a', 'a', 'b', 'b'],
      [],
    ],
  },

  // ========== 8. EVEN LENGTH CHECKER (1 tape — Beginner) ==========
  {
    name: 'Even Length Checker',
    description:
      'Checks if the input string has even length. Alternates between two states for each character: q0 (even count so far) and q1 (odd count). Accepts if input length is even, rejects if odd. A simple, beginner-friendly example with complete transition coverage.',
    numTapes: 1,
    states: ['q0', 'q1', 'qAccept', 'qReject'],
    alphabet: ['a', 'b', '0', '1', 'B'],
    blankSymbol: 'B',
    initialState: 'q0',
    acceptStates: ['qAccept'],
    rejectStates: ['qReject'],
    transitions: [
      // q0: even count — reading any symbol moves to q1 (odd)
      { fromState: 'q0', readSymbols: ['a'], toState: 'q1', writeSymbols: ['a'], directions: ['R'] },
      { fromState: 'q0', readSymbols: ['b'], toState: 'q1', writeSymbols: ['b'], directions: ['R'] },
      { fromState: 'q0', readSymbols: ['0'], toState: 'q1', writeSymbols: ['0'], directions: ['R'] },
      { fromState: 'q0', readSymbols: ['1'], toState: 'q1', writeSymbols: ['1'], directions: ['R'] },
      // q0: blank → even length, accept!
      { fromState: 'q0', readSymbols: ['B'], toState: 'qAccept', writeSymbols: ['B'], directions: ['S'] },

      // q1: odd count — reading any symbol moves to q0 (even)
      { fromState: 'q1', readSymbols: ['a'], toState: 'q0', writeSymbols: ['a'], directions: ['R'] },
      { fromState: 'q1', readSymbols: ['b'], toState: 'q0', writeSymbols: ['b'], directions: ['R'] },
      { fromState: 'q1', readSymbols: ['0'], toState: 'q0', writeSymbols: ['0'], directions: ['R'] },
      { fromState: 'q1', readSymbols: ['1'], toState: 'q0', writeSymbols: ['1'], directions: ['R'] },
      // q1: blank → odd length, reject!
      { fromState: 'q1', readSymbols: ['B'], toState: 'qReject', writeSymbols: ['B'], directions: ['S'] },
    ],
    initialTapes: [
      ['a', 'b', 'a', 'b'],
    ],
  },

  // ========== 9. REPLACE a → b (1 tape — Beginner) ==========
  {
    name: 'Replace a → b',
    description:
      'Replaces every occurrence of "a" in the input with "b". Scans left to right, writing "b" wherever it reads "a", leaving all other characters unchanged. Always accepts. Simple and beginner-friendly.',
    numTapes: 1,
    states: ['qScan', 'qAccept'],
    alphabet: ['a', 'b', 'B'],
    blankSymbol: 'B',
    initialState: 'qScan',
    acceptStates: ['qAccept'],
    rejectStates: [],
    transitions: [
      // qScan: replace 'a' with 'b'
      { fromState: 'qScan', readSymbols: ['a'], toState: 'qScan', writeSymbols: ['b'], directions: ['R'] },
      // qScan: 'b' stays as 'b'
      { fromState: 'qScan', readSymbols: ['b'], toState: 'qScan', writeSymbols: ['b'], directions: ['R'] },
      // qScan: blank → done, accept
      { fromState: 'qScan', readSymbols: ['B'], toState: 'qAccept', writeSymbols: ['B'], directions: ['S'] },
    ],
    initialTapes: [
      ['a', 'b', 'a', 'a', 'b'],
    ],
  },

  // ========== 10. 2-TAPE COPY — ROBUST (2 tapes — Beginner) ==========
  {
    name: '2-Tape Copy (Robust)',
    description:
      'Copies the input from Tape 1 to Tape 2, then accepts. This robust version handles all tape symbol combinations and includes a reject state. Designed for multi-tape beginners.',
    numTapes: 2,
    states: ['qCopy', 'qDone', 'qAccept', 'qReject'],
    alphabet: ['a', 'b', 'B'],
    blankSymbol: 'B',
    initialState: 'qCopy',
    acceptStates: ['qAccept'],
    rejectStates: ['qReject'],
    transitions: [
      // qCopy: copy 'a' from tape1 to tape2
      { fromState: 'qCopy', readSymbols: ['a', 'B'], toState: 'qCopy', writeSymbols: ['a', 'a'], directions: ['R', 'R'] },
      // qCopy: copy 'b' from tape1 to tape2
      { fromState: 'qCopy', readSymbols: ['b', 'B'], toState: 'qCopy', writeSymbols: ['b', 'b'], directions: ['R', 'R'] },
      // qCopy: blank on tape1 → done
      { fromState: 'qCopy', readSymbols: ['B', 'B'], toState: 'qAccept', writeSymbols: ['B', 'B'], directions: ['S', 'S'] },
      // qCopy: unexpected symbol on tape2 → reject (tape2 should be blank)
      { fromState: 'qCopy', readSymbols: ['a', 'a'], toState: 'qReject', writeSymbols: ['a', 'a'], directions: ['S', 'S'] },
      { fromState: 'qCopy', readSymbols: ['a', 'b'], toState: 'qReject', writeSymbols: ['a', 'b'], directions: ['S', 'S'] },
      { fromState: 'qCopy', readSymbols: ['b', 'a'], toState: 'qReject', writeSymbols: ['b', 'a'], directions: ['S', 'S'] },
      { fromState: 'qCopy', readSymbols: ['b', 'b'], toState: 'qReject', writeSymbols: ['b', 'b'], directions: ['S', 'S'] },
      { fromState: 'qCopy', readSymbols: ['B', 'a'], toState: 'qReject', writeSymbols: ['B', 'a'], directions: ['S', 'S'] },
      { fromState: 'qCopy', readSymbols: ['B', 'b'], toState: 'qReject', writeSymbols: ['B', 'b'], directions: ['S', 'S'] },
    ],
    initialTapes: [
      ['a', 'b', 'a'],
      [],
    ],
  },

  // ========== 11. STRING REVERSE — ROBUST (2 tapes — Beginner) ==========
  {
    name: 'String Reverse (Robust)',
    description:
      'Reverses the input from Tape 1 onto Tape 2. First moves to the end of Tape 1, then copies characters backwards to Tape 2. This robust version covers all symbol combinations and always terminates cleanly.',
    numTapes: 2,
    states: ['qRight', 'qCopyRev', 'qAccept', 'qReject'],
    alphabet: ['a', 'b', 'B'],
    blankSymbol: 'B',
    initialState: 'qRight',
    acceptStates: ['qAccept'],
    rejectStates: ['qReject'],
    transitions: [
      // qRight: scan to end of tape 1
      { fromState: 'qRight', readSymbols: ['a', 'B'], toState: 'qRight', writeSymbols: ['a', 'B'], directions: ['R', 'S'] },
      { fromState: 'qRight', readSymbols: ['b', 'B'], toState: 'qRight', writeSymbols: ['b', 'B'], directions: ['R', 'S'] },
      // qRight: reached blank → start reverse copy
      { fromState: 'qRight', readSymbols: ['B', 'B'], toState: 'qCopyRev', writeSymbols: ['B', 'B'], directions: ['L', 'S'] },
      // qRight: unexpected tape2 content → reject
      { fromState: 'qRight', readSymbols: ['a', 'a'], toState: 'qReject', writeSymbols: ['a', 'a'], directions: ['S', 'S'] },
      { fromState: 'qRight', readSymbols: ['a', 'b'], toState: 'qReject', writeSymbols: ['a', 'b'], directions: ['S', 'S'] },
      { fromState: 'qRight', readSymbols: ['b', 'a'], toState: 'qReject', writeSymbols: ['b', 'a'], directions: ['S', 'S'] },
      { fromState: 'qRight', readSymbols: ['b', 'b'], toState: 'qReject', writeSymbols: ['b', 'b'], directions: ['S', 'S'] },
      { fromState: 'qRight', readSymbols: ['B', 'a'], toState: 'qReject', writeSymbols: ['B', 'a'], directions: ['S', 'S'] },
      { fromState: 'qRight', readSymbols: ['B', 'b'], toState: 'qReject', writeSymbols: ['B', 'b'], directions: ['S', 'S'] },

      // qCopyRev: copy in reverse
      { fromState: 'qCopyRev', readSymbols: ['a', 'B'], toState: 'qCopyRev', writeSymbols: ['a', 'a'], directions: ['L', 'R'] },
      { fromState: 'qCopyRev', readSymbols: ['b', 'B'], toState: 'qCopyRev', writeSymbols: ['b', 'b'], directions: ['L', 'R'] },
      // qCopyRev: reached beginning → done
      { fromState: 'qCopyRev', readSymbols: ['B', 'B'], toState: 'qAccept', writeSymbols: ['B', 'B'], directions: ['S', 'S'] },
      // qCopyRev: unexpected tape2 content → reject
      { fromState: 'qCopyRev', readSymbols: ['a', 'a'], toState: 'qReject', writeSymbols: ['a', 'a'], directions: ['S', 'S'] },
      { fromState: 'qCopyRev', readSymbols: ['a', 'b'], toState: 'qReject', writeSymbols: ['a', 'b'], directions: ['S', 'S'] },
      { fromState: 'qCopyRev', readSymbols: ['b', 'a'], toState: 'qReject', writeSymbols: ['b', 'a'], directions: ['S', 'S'] },
      { fromState: 'qCopyRev', readSymbols: ['b', 'b'], toState: 'qReject', writeSymbols: ['b', 'b'], directions: ['S', 'S'] },
      { fromState: 'qCopyRev', readSymbols: ['B', 'a'], toState: 'qReject', writeSymbols: ['B', 'a'], directions: ['S', 'S'] },
      { fromState: 'qCopyRev', readSymbols: ['B', 'b'], toState: 'qReject', writeSymbols: ['B', 'b'], directions: ['S', 'S'] },
    ],
    initialTapes: [
      ['a', 'b', 'b', 'a'],
      [],
    ],
  },
];

export function getExampleByName(name: string): MachineConfig | undefined {
  return EXAMPLES.find(e => e.name === name);
}
