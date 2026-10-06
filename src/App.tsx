/**
 * MJ - Voice-to-Voice AI Personal Assistant
 * Main Application Component
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveSession } from './ai/LiveSession';
import { AIOrb } from './components/AIOrb';
import { Waveform } from './components/Waveform';
import { VoiceButton } from './components/VoiceButton';
import { StatusIndicator } from './components/StatusIndicator';
import { ActionToast, ActionToastData } from './components/ActionToast';
import { PermissionModal } from './components/PermissionModal';
import { SettingsModal } from './components/SettingsModal';
import { ProductivityDrawer } from './components/ProductivityDrawer';
import { DebugPanel } from './components/DebugPanel';
import { OnboardingModal } from './components/OnboardingModal';
import {
  AssistantSettings,
  AssistantState,
  DebugLogEntry,
  ToolCallRequest,
} from './types/assistant';
import { Sparkles, AlertCircle } from 'lucide-react';

const DEFAULT_SETTINGS: AssistantSettings = {
  personalityMode: 'witty',
  preferredLanguage: 'auto',
  voiceName: 'Aoede',
  wakeWordEnabled: false,
  reducedMotion: false,
  autoConnectOnLaunch: false,
  soundFeedback: true,
};

export default function App() {
  const [state, setState] = useState<AssistantState>('disconnected');
  const [micVolume, setMicVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  const [latency, setLatency] = useState(0);
  const [detectedLang, setDetectedLang] = useState<string>('Bilingual');
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [activeToast, setActiveToast] = useState<ActionToastData | null>(null);
  const [permissionRequest, setPermissionRequest] = useState<ToolCallRequest | null>(null);
  const [permissionResolver, setPermissionResolver] = useState<((val: boolean) => void) | null>(null);
  const [userFriendlyError, setUserFriendlyError] = useState<string | null>(null);
  const [liveCaption, setLiveCaption] = useState<{ text: string; sender: 'user' | 'ai' } | null>(null);
  const captionTimerRef = useRef<number | null>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isProductivityOpen, setIsProductivityOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Load saved settings
  const [settings, setSettings] = useState<AssistantSettings>(() => {
    try {
      const saved = localStorage.getItem('mj_settings_v1');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const sessionRef = useRef<LiveSession | null>(null);

  // Check first-time visit for onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('mj_has_seen_onboarding_v1');
    if (!hasSeenOnboarding) {
      setIsOnboardingOpen(true);
      localStorage.setItem('mj_has_seen_onboarding_v1', 'true');
    }
  }, []);

  // Update stored settings
  const handleUpdateSettings = useCallback((newSettings: AssistantSettings) => {
    setSettings(newSettings);
    localStorage.setItem('mj_settings_v1', JSON.stringify(newSettings));
    sessionRef.current?.updateSettings(newSettings);
  }, []);

  // Initialize LiveSession
  useEffect(() => {
    const session = new LiveSession(settings, {
      onStateChange: (newState) => {
        setState(newState);
        if (newState === 'listening' || newState === 'speaking') {
          setUserFriendlyError(null);
        }
      },
      onMicVolume: (vol) => setMicVolume(vol),
      onAIVolume: (vol) => setAiVolume(vol),
      onLog: (entry) => {
        setLogs((prev) => [entry, ...prev.slice(0, 99)]);
      },
      onError: (errMsg) => {
        setUserFriendlyError(errMsg);
      },
      onToolActivity: (name, args, result) => {
        setActiveToast({
          id: 'toast_' + Date.now(),
          name,
          args,
          result,
        });
      },
      onRequestPermission: (req) => {
        return new Promise<boolean>((resolve) => {
          setPermissionRequest(req);
          setPermissionResolver(() => resolve);
        });
      },
      onLanguageDetected: (lang) => {
        setDetectedLang(lang);
      },
      onTranscription: (text, sender) => {
        setLiveCaption({ text, sender });
        if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
        captionTimerRef.current = window.setTimeout(() => {
          setLiveCaption(null);
        }, 6000);
      },
    });

    sessionRef.current = session;

    // Latency polling
    const interval = setInterval(() => {
      if (sessionRef.current) {
        setLatency(sessionRef.current.getLatency());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      session.destroy();
      sessionRef.current = null;
    };
  }, []);

  // Connect Handler
  const handleConnect = useCallback(async () => {
    setUserFriendlyError(null);
    if (sessionRef.current) {
      try {
        await sessionRef.current.connect();
      } catch (err: any) {
        setUserFriendlyError(
          'Could not establish connection to MJ. Please ensure microphone access is permitted.'
        );
      }
    }
  }, []);

  // Disconnect Handler
  const handleDisconnect = useCallback(() => {
    sessionRef.current?.disconnect();
  }, []);

  // Interrupt Handler
  const handleInterrupt = useCallback(() => {
    sessionRef.current?.interrupt();
  }, []);

  // Permission actions
  const handleConfirmPermission = () => {
    if (permissionResolver) {
      permissionResolver(true);
      setPermissionResolver(null);
      setPermissionRequest(null);
    }
  };

  const handleDenyPermission = () => {
    if (permissionResolver) {
      permissionResolver(false);
      setPermissionResolver(null);
      setPermissionRequest(null);
    }
  };

  // Voice suggestion chips
  const suggestions = [
    { text: 'MJ, YouTube kholo', lang: 'Urdu' },
    { text: 'Open GitHub', lang: 'English' },
    { text: 'Remind me at 8 PM to finish the report', lang: 'English' },
    { text: 'Mera note likho: AI ideas', lang: 'Roman Urdu' },
    { text: "What's the weather in Lahore?", lang: 'English' },
    { text: 'Explain this bug in Urdu', lang: 'Mixed' },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Background radial ambiance */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(15,23,42,0.8)_0%,rgba(2,6,23,1)_80%)]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[500px] sm:h-[500px] bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <StatusIndicator
        state={state}
        latency={latency}
        personality={settings.personalityMode}
        detectedLang={detectedLang}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDebug={() => setIsDebugOpen(true)}
        onOpenProductivity={() => setIsProductivityOpen(true)}
      />

      {/* Error Banner */}
      {userFriendlyError && (
        <div className="mx-4 sm:mx-auto max-w-md mt-2 z-20 p-3 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center justify-between gap-3 shadow-lg shadow-red-950/40 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{userFriendlyError}</span>
          </div>
          <button
            onClick={() => setUserFriendlyError(null)}
            className="text-red-400 hover:text-red-200 font-mono text-[10px] uppercase font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Main Voice Center (Strictly Voice-First) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        {/* Animated AI Orb */}
        <div className="my-auto flex flex-col items-center justify-center">
          <AIOrb
            state={state}
            micVolume={micVolume}
            aiVolume={aiVolume}
            reducedMotion={settings.reducedMotion}
          />

          {/* Real-time Oscilloscope Waveform */}
          <div className="mt-4 sm:mt-6 w-72 sm:w-80">
            <Waveform
              state={state}
              micVolume={micVolume}
              aiVolume={aiVolume}
              reducedMotion={settings.reducedMotion}
            />
          </div>

          {/* Real-time Voice Caption */}
          {liveCaption && (
            <div className="mt-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono max-w-xs sm:max-w-md text-center shadow-lg backdrop-blur-md transition-all animate-in fade-in">
              <span className={liveCaption.sender === 'user' ? 'text-cyan-400 font-bold' : 'text-fuchsia-400 font-bold'}>
                {liveCaption.sender === 'user' ? 'You: ' : 'MJ: '}
              </span>
              <span className="text-slate-200">"{liveCaption.text}"</span>
            </div>
          )}

          {/* Central Tactical Voice / Power Button */}
          <div className="mt-3 sm:mt-5">
            <VoiceButton
              state={state}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onInterrupt={handleInterrupt}
            />
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="w-full max-w-2xl pb-6 sm:pb-8 flex flex-wrap items-center justify-center gap-2 px-2">
          {suggestions.map((s, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/70 hover:border-cyan-500/40 backdrop-blur-md text-[11px] text-slate-400 hover:text-cyan-300 transition-all font-mono flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-2.5 h-2.5 text-cyan-400/70" />
              <span>"{s.text}"</span>
            </div>
          ))}
        </div>
      </main>

      {/* Action Toast Feedback */}
      <ActionToast action={activeToast} onDismiss={() => setActiveToast(null)} />

      {/* Sensitive Action Permission Modal */}
      <PermissionModal
        request={permissionRequest}
        onConfirm={handleConfirmPermission}
        onDeny={handleDenyPermission}
      />

      {/* Productivity & Memory Drawer */}
      <ProductivityDrawer
        isOpen={isProductivityOpen}
        onClose={() => setIsProductivityOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Developer Diagnostics Panel */}
      <DebugPanel
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        state={state}
        latency={latency}
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {/* First-time Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onStartTalking={handleConnect}
      />
    </div>
  );
}
