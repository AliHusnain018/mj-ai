/**
 * SettingsModal - Configure MJ's personality mode, prebuilt voice,
 * language adaptation, reduced motion, and memory controls.
 */

import React from 'react';
import { X, Sparkles, Volume2, Globe, Cpu, RotateCcw } from 'lucide-react';
import { AssistantSettings, PersonalityMode } from '../types/assistant';
import { MemoryManager } from '../memory/MemoryManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: AssistantSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const personalities: { id: PersonalityMode; label: string; desc: string }[] = [
    { id: 'witty', label: 'Witty & Charming', desc: 'Clever, playful, quick humorous banter' },
    { id: 'friendly', label: 'Friendly Companion', desc: 'Warm, supportive, empathetic best friend' },
    { id: 'professional', label: 'Professional Assistant', desc: 'Crisp, articulate, polished, high efficiency' },
    { id: 'teacher', label: 'Pedagogical Teacher', desc: 'Patient, explanatory, step-by-step guidance' },
    { id: 'coding', label: 'Coding Expert', desc: 'Senior software engineer, architecture & debugging' },
    { id: 'motivational', label: 'Motivational Coach', desc: 'High energy, inspiring, disciplined mindset' },
    { id: 'business', label: 'Business Executive', desc: 'Strategic, metrics-aware, concise executive style' },
  ];

  const voices: Array<'Aoede' | 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr'> = [
    'Aoede',
    'Kore',
    'Puck',
    'Fenrir',
    'Zephyr',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono tracking-wider text-slate-100">
                MJ SETTINGS
              </h2>
              <p className="text-xs text-slate-400">Voice engine, persona, and system controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-xs">
          {/* Personality Mode */}
          <div>
            <label className="block text-slate-300 font-mono font-semibold mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              PERSONALITY MODE
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {personalities.map((p) => {
                const isSelected = settings.personalityMode === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      onUpdateSettings({ ...settings, personalityMode: p.id })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">{p.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Name */}
          <div>
            <label className="block text-slate-300 font-mono font-semibold mb-2 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-fuchsia-400" />
              AI VOICE PERSONA
            </label>
            <div className="grid grid-cols-5 gap-2 font-mono text-center">
              {voices.map((v) => (
                <button
                  key={v}
                  onClick={() => onUpdateSettings({ ...settings, voiceName: v })}
                  className={`py-2 px-1 rounded-xl border text-xs transition-all ${
                    settings.voiceName === v
                      ? 'bg-fuchsia-950/50 border-fuchsia-400 text-fuchsia-300 font-bold'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Language Preference */}
          <div>
            <label className="block text-slate-300 font-mono font-semibold mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              LANGUAGE BEHAVIOR
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              {[
                { id: 'auto', label: 'Bilingual (Auto)' },
                { id: 'english', label: 'English Only' },
                { id: 'urdu', label: 'Urdu / اردو' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() =>
                    onUpdateSettings({ ...settings, preferredLanguage: l.id as any })
                  }
                  className={`py-2 px-1 rounded-xl border text-xs transition-all ${
                    settings.preferredLanguage === l.id
                      ? 'bg-emerald-950/50 border-emerald-400 text-emerald-300 font-bold'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Browser Control (Chrome Extension MV3) */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                LIVE BROWSER & TAB CONTROL (MV3 EXTENSION)
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
                CHROME MV3
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-mono text-[11px]">Extension Status:</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-950/50 border border-emerald-800/60 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready / Extension Bridge Loaded
                </span>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">How to load unpacked in Google Chrome:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-400 pl-1">
                  <li>Open <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">chrome://extensions</code></li>
                  <li>Enable <span className="text-slate-200 font-semibold">Developer mode</span> (toggle at top right)</li>
                  <li>Click <span className="text-slate-200 font-semibold">Load unpacked</span> and choose the <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">/extension</code> directory</li>
                </ol>
              </div>

              <div className="pt-2 border-t border-slate-800/60">
                <p className="text-[10px] font-mono text-cyan-400/90 font-bold mb-1">VOICE COMMANDS CHEAT SHEET:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                  <div>• <span className="text-slate-200">"MJ, YouTube kholo"</span></div>
                  <div>• <span className="text-slate-200">"Python lectures search karo"</span></div>
                  <div>• <span className="text-slate-200">"Pehli video play karo"</span></div>
                  <div>• <span className="text-slate-200">"Is channel ko kholo"</span></div>
                  <div>• <span className="text-slate-200">"Neeche scroll karo"</span></div>
                  <div>• <span className="text-slate-200">"Back jao" / "Forward jao"</span></div>
                  <div>• <span className="text-slate-200">"Pause" / "Play" / "Next"</span></div>
                  <div>• <span className="text-slate-200">"Page reload karo"</span></div>
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <a
                  href="/test-browser.html"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-300 border border-slate-700 flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  Launch Test Sandbox (/test-browser.html)
                </a>
              </div>
            </div>
          </div>

          {/* System & Accessibility Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800 font-mono">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-200">Reduced Motion</span>
                <p className="text-[10px] text-slate-500 font-sans">Minimizes pulsing and waveform animation workloads</p>
              </div>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, reducedMotion: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-800"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-200">Simulate "Hey MJ" Wake Word</span>
                <p className="text-[10px] text-slate-500 font-sans">Enables continuous wake-word detector ready architecture</p>
              </div>
              <input
                type="checkbox"
                checked={settings.wakeWordEnabled}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, wakeWordEnabled: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-800"
              />
            </div>
          </div>

          {/* Reset Memory / Storage */}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <span className="text-slate-400 font-mono text-[11px]">Storage Management</span>
            <button
              onClick={() => {
                if (window.confirm('Clear all stored reminders, notes, tasks, and memory?')) {
                  MemoryManager.getInstance().clearAllMemories();
                  localStorage.clear();
                  alert('Stored user memory and productivity data cleared.');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 hover:bg-red-900/40 flex items-center gap-1.5 text-[11px] font-mono transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Stored Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
