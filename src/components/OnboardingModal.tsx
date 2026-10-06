/**
 * OnboardingModal - Welcome walkthrough introducing MJ, voice-first controls,
 * bilingual capabilities, and privacy rules.
 */

import React from 'react';
import { Mic, Globe, Shield, Sparkles, Zap, ArrowRight } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTalking: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartTalking,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-200 relative overflow-hidden">
        {/* Futuristic glowing backdrop accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 text-cyan-400 shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono tracking-wider text-slate-100">
                MEET MJ
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Your Jarvis-Style Voice-First AI Companion
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Feature 1 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/40 text-cyan-400 shrink-0">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-200 text-sm">Voice-to-Voice Interaction</div>
                <div className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                  No text chat or keyboard needed. Tap the central button and speak naturally. MJ is completely interruptible at any moment.
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-200 text-sm">Bilingual: English + Urdu</div>
                <div className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                  MJ understands English, Urdu (اردو), Roman Urdu, and mixed speech. Say "MJ YouTube kholo" or "Remind me at 8 PM" naturally without manual switching.
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/40 text-purple-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-200 text-sm">Real Actions & Productivity</div>
                <div className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                  Open websites, search the web, manage reminders, take notes, check the weather, and ask for code explanations.
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-800/40 text-indigo-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-200 text-sm">Privacy & Security Controls</div>
                <div className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                  Sensitive actions require your confirmation. Long-term memory is explicit, controllable, and can be cleared at any time.
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              onClose();
              onStartTalking();
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-slate-950 font-bold font-mono text-sm tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/50 transition-all hover:scale-[1.02]"
          >
            <span>START TALKING TO MJ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
