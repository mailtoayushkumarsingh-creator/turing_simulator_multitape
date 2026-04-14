'use client';

import React, { useState, useCallback } from 'react';
import { MachineConfig, TuringMachine } from '../lib/turingEngine';

interface TestCase {
  id: number;
  input: string;
  expected: 'accept' | 'reject';
}

interface TestResult {
  id: number;
  input: string;
  expected: 'accept' | 'reject';
  actual: 'accepted' | 'rejected' | 'halted' | 'missing_transition' | 'timeout';
  passed: boolean;
  steps: number;
}

interface TestRunnerProps {
  config: MachineConfig;
  onToast?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function TestRunner({ config, onToast }: TestRunnerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: 1, input: '', expected: 'accept' },
  ]);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const nextIdRef = React.useRef(2);

  const addTestCase = () => {
    setTestCases(prev => [
      ...prev,
      { id: nextIdRef.current++, input: '', expected: 'accept' },
    ]);
  };

  const removeTestCase = (id: number) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
  };

  const updateTestCase = (id: number, updates: Partial<TestCase>) => {
    setTestCases(prev =>
      prev.map(tc => (tc.id === id ? { ...tc, ...updates } : tc))
    );
  };

  const runAllTests = useCallback(() => {
    setIsRunning(true);
    const newResults: TestResult[] = [];

    for (const tc of testCases) {
      // Build a config with this test's input on tape 1
      const testConfig: MachineConfig = {
        ...config,
        initialTapes: [
          tc.input.split('').filter(c => c.trim() !== ''),
          ...config.initialTapes.slice(1),
        ],
      };

      // Make sure we have enough tapes
      while (testConfig.initialTapes.length < config.numTapes) {
        testConfig.initialTapes.push([]);
      }

      try {
        const machine = new TuringMachine(testConfig);
        const finalSnap = machine.run(5000);

        const actual: TestResult['actual'] = finalSnap.status === 'running' ? 'timeout' : finalSnap.status;
        const passed =
          (tc.expected === 'accept' && actual === 'accepted') ||
          (tc.expected === 'reject' && (actual === 'rejected' || actual === 'halted' || actual === 'missing_transition'));

        newResults.push({
          id: tc.id,
          input: tc.input,
          expected: tc.expected,
          actual,
          passed,
          steps: finalSnap.step,
        });
      } catch {
        newResults.push({
          id: tc.id,
          input: tc.input,
          expected: tc.expected,
          actual: 'halted',
          passed: false,
          steps: 0,
        });
      }
    }

    setResults(newResults);
    setIsRunning(false);

    const passedCount = newResults.filter(r => r.passed).length;
    const totalCount = newResults.length;

    if (passedCount === totalCount) {
      onToast?.('success', `All ${totalCount} tests passed! ✔`);
    } else {
      onToast?.('warning', `${passedCount}/${totalCount} tests passed`);
    }
  }, [testCases, config, onToast]);

  const passedCount = results?.filter(r => r.passed).length ?? 0;
  const totalCount = results?.length ?? 0;

  const getResultForCase = (id: number) => results?.find(r => r.id === id);

  const getActualLabel = (actual: TestResult['actual']) => {
    switch (actual) {
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'halted': return 'Halted';
      case 'missing_transition': return 'Missing Trans.';
      case 'timeout': return 'Timeout';
    }
  };

  return (
    <div className="glass-card test-runner-container" id="test-runner-panel">
      {/* Header */}
      <button
        className="test-runner-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="section-title" style={{ margin: 0, cursor: 'pointer' }}>
            <span className="icon">🧪</span>
            Test Runner
          </span>
          <span className="test-runner-count-badge">
            {testCases.length} {testCases.length === 1 ? 'test' : 'tests'}
          </span>
          {results && (
            <span className={`test-runner-result-badge ${passedCount === totalCount ? 'all-pass' : 'has-fail'}`}>
              {passedCount}/{totalCount} passed
            </span>
          )}
        </div>
        <span
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
            fontSize: '10px',
            color: 'var(--text-muted)',
          }}
        >
          ▼
        </span>
      </button>

      {/* Expandable Content */}
      <div className={`test-runner-body ${isExpanded ? 'open' : ''}`}>
        {/* Test Cases List */}
        <div className="test-runner-list">
          {testCases.map((tc, idx) => {
            const result = getResultForCase(tc.id);
            return (
              <div
                key={tc.id}
                className={`test-runner-case ${result ? (result.passed ? 'passed' : 'failed') : ''}`}
              >
                <div className="test-runner-case-num">#{idx + 1}</div>

                <div className="test-runner-case-fields">
                  <div className="test-runner-field">
                    <label className="test-runner-field-label">Input</label>
                    <input
                      className="input-field test-runner-input"
                      value={tc.input}
                      onChange={(e) => updateTestCase(tc.id, { input: e.target.value })}
                      placeholder="e.g., aabb"
                    />
                  </div>
                  <div className="test-runner-field">
                    <label className="test-runner-field-label">Expected</label>
                    <select
                      className="input-field test-runner-select"
                      value={tc.expected}
                      onChange={(e) =>
                        updateTestCase(tc.id, {
                          expected: e.target.value as 'accept' | 'reject',
                        })
                      }
                    >
                      <option value="accept">Accept ✔</option>
                      <option value="reject">Reject ✗</option>
                    </select>
                  </div>
                </div>

                {/* Result indicator */}
                {result && (
                  <div className={`test-runner-result-indicator ${result.passed ? 'pass' : 'fail'}`}>
                    <span className="test-runner-result-icon">
                      {result.passed ? '✔' : '❌'}
                    </span>
                    <div className="test-runner-result-detail">
                      <span>{result.passed ? 'Passed' : 'Failed'}</span>
                      <span className="test-runner-result-actual">
                        Got: {getActualLabel(result.actual)} ({result.steps} steps)
                      </span>
                    </div>
                  </div>
                )}

                <button
                  className="test-runner-remove-btn"
                  onClick={() => removeTestCase(tc.id)}
                  title="Remove test case"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="test-runner-actions">
          <button
            className="btn btn-secondary"
            onClick={addTestCase}
          >
            + Add Test Case
          </button>
          <button
            className="btn btn-primary"
            onClick={runAllTests}
            disabled={isRunning || testCases.length === 0}
            id="run-all-tests-btn"
          >
            {isRunning ? '⏳ Running...' : '▶ Run All Tests'}
          </button>
        </div>

        {/* Summary Banner */}
        {results && results.length > 0 && (
          <div className={`test-runner-summary ${passedCount === totalCount ? 'all-pass' : 'has-fail'}`}>
            <span className="test-runner-summary-icon">
              {passedCount === totalCount ? '🎉' : '⚠️'}
            </span>
            <span>
              {passedCount === totalCount
                ? `All ${totalCount} tests passed!`
                : `${passedCount} of ${totalCount} tests passed, ${totalCount - passedCount} failed`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
