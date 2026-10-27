/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { TestCaseResult } from '../../types/kdeconnect';
import { INITIAL_TEST_CASES, runTest } from '../../services/testSuite';

export const TestRunnerModal: React.FC = () => {
  const [tests, setTests] = useState<TestCaseResult[]>(INITIAL_TEST_CASES);
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRunSingle = async (testId: string) => {
    setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'running' } : t));
    const res = await runTest(testId);
    setTests(prev => prev.map(t => {
      if (t.id === testId) {
        return {
          ...t,
          status: res.passed ? 'passed' : 'failed',
          durationMs: res.durationMs,
          details: res.details
        };
      }
      return t;
    }));
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    // Reset all to running
    setTests(prev => prev.map(t => ({ ...t, status: 'running', details: undefined, durationMs: undefined })));

    for (const t of INITIAL_TEST_CASES) {
      const res = await runTest(t.id);
      setTests(prev => prev.map(cur => {
        if (cur.id === t.id) {
          return {
            ...cur,
            status: res.passed ? 'passed' : 'failed',
            durationMs: res.durationMs,
            details: res.details
          };
        }
        return cur;
      }));
      // tiny yield for smooth UI animation
      await new Promise(r => setTimeout(r, 60));
    }
    setIsRunningAll(false);
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const pendingCount = tests.filter(t => t.status === 'pending').length;
  const totalDuration = tests.reduce((acc, t) => acc + (t.durationMs || 0), 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              KDE Connect Integration Test Suite
            </h3>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">
              10 Automated Tests
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Unit &amp; integration tests covering CWE-22 traversal prevention, Room SQLite deduplication, Smart Delta Sync, and payload streaming.
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={isRunningAll}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          {isRunningAll ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isRunningAll ? 'Executing Suite…' : 'Run All Tests'}</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-slate-400 font-medium">Total Tests</div>
          <div className="text-lg font-bold font-mono text-slate-100">{tests.length}</div>
        </div>

        <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-3">
          <div className="text-[11px] text-emerald-400 font-medium">Passed</div>
          <div className="text-lg font-bold font-mono text-emerald-300">{passedCount}</div>
        </div>

        <div className="bg-slate-950/80 border border-rose-500/20 rounded-xl p-3">
          <div className="text-[11px] text-rose-400 font-medium">Failed</div>
          <div className="text-lg font-bold font-mono text-rose-300">{failedCount}</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] text-slate-400 font-medium">Total Runtime</div>
          <div className="text-lg font-bold font-mono text-cyan-300">
            {totalDuration > 0 ? `${totalDuration} ms` : '—'}
          </div>
        </div>
      </div>

      {/* Test Items List */}
      <div className="space-y-2">
        {tests.map(test => {
          const isPassed = test.status === 'passed';
          const isFailed = test.status === 'failed';
          const isRunning = test.status === 'running';
          const isPending = test.status === 'pending';
          const isExpanded = !!expandedIds[test.id];

          return (
            <div
              key={test.id}
              className="bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
            >
              <div
                onClick={() => toggleExpand(test.id)}
                className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">
                    {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isFailed && <XCircle className="w-4 h-4 text-rose-400" />}
                    {isRunning && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
                    {isPending && <Clock className="w-4 h-4 text-slate-500" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-slate-200">
                        {test.name}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        test.category === 'Security'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : test.category === 'Persistence'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : test.category === 'Sync'
                          ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {test.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-xl mt-0.5">
                      {test.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {test.durationMs !== undefined && (
                    <span className="font-mono text-[10px] text-slate-400">
                      {test.durationMs}ms
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunSingle(test.id);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md"
                    title="Re-run test"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>

                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Assertion Details */}
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-900/60 p-3 text-xs space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300">
                    Test Assertion &amp; Execution Output:
                  </div>
                  {test.details ? (
                    <div className="bg-black/50 p-2.5 rounded-lg font-mono text-[11px] text-emerald-300 border border-slate-800 leading-relaxed">
                      {test.details}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-[11px]">
                      Test has not been executed yet. Click "Run" to test.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
