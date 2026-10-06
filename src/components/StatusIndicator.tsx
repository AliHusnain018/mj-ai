/**
 * StatusIndicator - Header bar featuring MJ identity, live status pill,
 * bilingual indicator, latency telemetry, and modal triggers.
 */

import React, { useState, useEffect } from 'react';
import { Settings, Terminal, Brain, Sparkles, Wifi, ShieldCheck, Globe } from 'lucide-react';
import { AssistantState, PersonalityMode } from '../types/assistant';
import { BrowserBridge } from '../browser/BrowserBridge';
import { ExtensionConnectionStatus } from '../browser/BrowserTypes';

interface StatusIndicatorProps {
  state: AssistantState;
  latency: number;
  personality: PersonalityMode;
  detectedLang?: string;
  onOpenSettings: () => void;
  onOpenDebug: () => void;
  onOpenProductivity: () => void;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  state,
  latency,
  personality,
  detectedLang = 'Bilingual',
  onOpenSettings,
  onOpenDebug,
  onOpenProductivity,
}) => {
  const [extensionStatus, setExtensionStatus] = useState<ExtensionConnectionStatus>('disconnected');

  useEffect(() => {
    const bridge = BrowserBridge.getInstance();
    setExtensionStatus(bridge.getStatus());
    return bridge.onStatusChange((status) => {
      setExtensionStatus(status);
    });
  }, []);
  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-6 py-4 z-20">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-fuchsia-500/20 border border-cyan-500/30 shadow-lg shadow-cyan-950/30">
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-wider text-slate-100 font-mono">
              MJ
            </h1>
            <span className="text-[10px] tracking-widest font-mono text-cyan-400/80 px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40 hidden xs:inline-block">
              LIVE
            </span>
          </div>
          <p className="text-[10px] tracking-tight text-slate-400 font-mono flex items-center gap-1.5">
            <span>JARVIS-STYLE COMPANION</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400/90 font-sans">اردو + EN</span>
          </p>
        </div>
      </div>

      {/* Center Status Pill */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md font-mono text-xs shadow-inner">
        <span
          className={`w-2 h-2 rounded-full ${
            state === 'disconnected'
              ? 'bg-slate-500'
              : state === 'connecting'
              ? 'bg-amber-400 animate-pulse'
              : state === 'listening'
              ? 'bg-cyan-400 animate-ping'
              : 'bg-fuchsia-400 animate-ping'
          }`}
        />
        <span className="uppercase text-slate-300 font-semibold tracking-wider">
          {state}
        </span>
        {latency > 0 && state !== 'disconnected' && (
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5 border-l border-slate-800 pl-2">
            <Wifi className="w-2.5 h-2.5 text-cyan-500/80" />
            {latency}ms
          </span>
        )}
        <span className="text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded capitalize">
          {personality}
        </span>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Browser Extension Control Indicator */}
        <button
          onClick={onOpenSettings}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all shadow-sm ${
            extensionStatus === 'connected'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-slate-700'
          }`}
          title={
            extensionStatus === 'connected'
              ? 'MJ Browser Extension Connected'
              : 'MJ Browser Extension: Click for setup instructions'
          }
        >
          <Globe
            className={`w-3.5 h-3.5 ${
              extensionStatus === 'connected' ? 'text-emerald-400' : 'text-slate-500'
            }`}
          />
          <span className="hidden lg:inline">
            {extensionStatus === 'connected' ? 'Browser: Active' : 'Browser: Setup'}
          </span>
        </button>

        {/* Productivity & Memory button */}
        <button
          onClick={onOpenProductivity}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-cyan-400 transition-all flex items-center gap-1.5 text-xs font-mono shadow-sm"
          title="Memory, Reminders & Tasks"
          aria-label="Open Memory and Tasks"
        >
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Memory</span>
        </button>

        {/* Developer Debug Toggle */}
        <button
          onClick={onOpenDebug}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-indigo-400 transition-all flex items-center gap-1.5 text-xs font-mono shadow-sm"
          title="Developer Diagnostics"
          aria-label="Developer Debug Console"
        >
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="hidden sm:inline">Diagnostics</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-all flex items-center gap-1 text-xs font-mono shadow-sm"
          title="Settings"
          aria-label="Assistant Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
