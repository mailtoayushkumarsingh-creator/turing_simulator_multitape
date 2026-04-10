// ===== Transition Validation Utility =====
// Detects missing transitions for multi-tape Turing machines

import { MachineConfig, TransitionRule } from './turingEngine';

export interface MissingTransition {
  state: string;
  symbols: string[];      // the symbol combination that has no rule
  symbolsLabel: string;   // human-readable label e.g. "(a, b)"
}

export interface StateValidation {
  state: string;
  totalCombinations: number;
  coveredCombinations: number;
  missingCombinations: number;
  missing: MissingTransition[];
}

export interface ValidationSummary {
  isComplete: boolean;
  totalMissing: number;
  totalRequired: number;
  totalCovered: number;
  stateValidations: StateValidation[];
  affectedStates: string[];
}

/**
 * Generate cartesian product of symbol arrays for N tapes.
 * Example: alphabet=['a','b','_'], numTapes=2 → [['a','a'], ['a','b'], ['a','_'], ...]
 */
export function generateAllSymbolCombinations(
  alphabet: string[],
  numTapes: number
): string[][] {
  if (numTapes === 0) return [[]];
  if (numTapes === 1) return alphabet.map(s => [s]);

  const subCombos = generateAllSymbolCombinations(alphabet, numTapes - 1);
  const result: string[][] = [];

  for (const symbol of alphabet) {
    for (const sub of subCombos) {
      result.push([symbol, ...sub]);
    }
  }

  return result;
}

/**
 * Check if a transition rule covers a given symbol combination.
 * Wildcards ('*') in a rule match any symbol.
 */
function ruleCoversCombo(rule: TransitionRule, combo: string[], numTapes: number): boolean {
  for (let i = 0; i < numTapes; i++) {
    const ruleSym = rule.readSymbols[i];
    if (ruleSym !== '*' && ruleSym !== combo[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Find all missing transitions for a given machine configuration.
 * Only checks non-terminal states (not accept/reject states).
 */
export function findMissingTransitions(config: MachineConfig): MissingTransition[] {
  // Build the full alphabet including blank symbol
  const fullAlphabet = [...new Set([...config.alphabet, config.blankSymbol])];
  const allCombos = generateAllSymbolCombinations(fullAlphabet, config.numTapes);

  // States that need outgoing transitions (exclude accept & reject states)
  const terminalStates = new Set([...config.acceptStates, ...config.rejectStates]);
  const activeStates = config.states.filter(s => !terminalStates.has(s));

  const missing: MissingTransition[] = [];

  for (const state of activeStates) {
    // Get all rules for this state
    const stateRules = config.transitions.filter(t => t.fromState === state);

    for (const combo of allCombos) {
      const isCovered = stateRules.some(rule => ruleCoversCombo(rule, combo, config.numTapes));

      if (!isCovered) {
        missing.push({
          state,
          symbols: combo,
          symbolsLabel: `(${combo.join(', ')})`,
        });
      }
    }
  }

  return missing;
}

/**
 * Get a full validation summary with per-state breakdown.
 */
export function getValidationSummary(config: MachineConfig): ValidationSummary {
  const fullAlphabet = [...new Set([...config.alphabet, config.blankSymbol])];
  const allCombos = generateAllSymbolCombinations(fullAlphabet, config.numTapes);
  const combosPerState = allCombos.length;

  const terminalStates = new Set([...config.acceptStates, ...config.rejectStates]);
  const activeStates = config.states.filter(s => !terminalStates.has(s));

  const stateValidations: StateValidation[] = [];
  let totalMissing = 0;

  for (const state of activeStates) {
    const stateRules = config.transitions.filter(t => t.fromState === state);
    const missingForState: MissingTransition[] = [];

    for (const combo of allCombos) {
      const isCovered = stateRules.some(rule => ruleCoversCombo(rule, combo, config.numTapes));

      if (!isCovered) {
        missingForState.push({
          state,
          symbols: combo,
          symbolsLabel: `(${combo.join(', ')})`,
        });
      }
    }

    const covered = combosPerState - missingForState.length;

    stateValidations.push({
      state,
      totalCombinations: combosPerState,
      coveredCombinations: covered,
      missingCombinations: missingForState.length,
      missing: missingForState,
    });

    totalMissing += missingForState.length;
  }

  const totalRequired = activeStates.length * combosPerState;
  const affectedStates = stateValidations
    .filter(v => v.missingCombinations > 0)
    .map(v => v.state);

  return {
    isComplete: totalMissing === 0,
    totalMissing,
    totalRequired,
    totalCovered: totalRequired - totalMissing,
    stateValidations,
    affectedStates,
  };
}

/**
 * Generate transition rules to fill all missing transitions,
 * routing them to the reject state.
 */
export function generateMissingTransitionRules(
  config: MachineConfig,
  targetState?: string
): TransitionRule[] {
  const rejectState = targetState || config.rejectStates[0] || 'qReject';
  const missingTransitions = findMissingTransitions(config);

  return missingTransitions.map(mt => ({
    fromState: mt.state,
    readSymbols: mt.symbols,
    toState: rejectState,
    writeSymbols: mt.symbols.map(() => '*'),  // don't change symbols
    directions: mt.symbols.map(() => 'S' as const),  // stay put
  }));
}
