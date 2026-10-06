/**
 * DebugPanel - Real-time developer telemetry and diagnostic console
 * Monitors WebSocket status, audio stream metrics, tool calling payloads, and errors.
 */

import React, { useState } from 'react';
import { X, Terminal, Trash2, Filter, Activity, Wifi, Cpu, CheckCircle } from 'lucide-react';
import { AssistantState, DebugLogEntry } from '../types/assistant';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  state: AssistantState;
  latency: number;
  logs: DebugLogEntry[];
  onClearLogs: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isOpen,
  onClose,
  state,
  latency,
  logs,
  onClearLogs,
}) => {
  const [filter, setFilter] = useState<'all' | 'audio' | 'tool' | 'gemini' | 'error'>('all');

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => (filter === 'all' ? true : l.type === filter));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col text-slate-300 font-mono text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold tracking-wider text-slate-100">
              DEVELOPER DIAGNOSTICS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="p-4 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/40 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">STATE</div>
            <div className="text-cyan-400 font-bold uppercase">{state}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">LATENCY</div>
            <div className="text-emerald-400 font-bold">{latency} ms</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">MIC INPUT</div>
            <div className="text-slate-300">16kHz PCM</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div className="text-slate-500 text-[10px]">AI OUTPUT</div>
            <div className="text-fuchsia-400">24kHz PCM</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/60 text-[11px]">
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400 mr-1" />
            {(['all', 'audio', 'tool', 'gemini', 'error'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2 py-0.5 rounded capitalize ${
                  filter === cat
                    ? 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={onClearLogs}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Logs Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 select-text">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-600 text-xs">
              No diagnostic logs recorded yet.
            </div>
          ) : (
            filteredLogs.map((log) => {
              let color = 'text-slate-300';
              if (log.type === 'error') color = 'text-red-400';
              if (log.type === 'tool') color = 'text-cyan-400';
              if (log.type === 'gemini') color = 'text-fuchsia-400';
              if (log.type === 'audio') color = 'text-amber-400';

              return (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] leading-relaxed"
                >
                  <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                    <span className="uppercase tracking-wider">[{log.type}]</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <div className={`${color} font-medium`}>{log.message}</div>
                  {log.data && (
                    <pre className="mt-1.5 p-2 rounded bg-slate-950 text-slate-400 overflow-x-auto text-[10px]">
                      {typeof log.data === 'string'
                        ? log.data
                        : JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
