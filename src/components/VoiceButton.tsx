/**
 * VoiceButton - The primary central tactile interaction button for MJ
 * Toggles connection, stops speech upon interruption, and provides clear visual feedback.
 */

import React from 'react';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { AssistantState } from '../types/assistant';

interface VoiceButtonProps {
  state: AssistantState;
  onConnect: () => void;
  onDisconnect: () => void;
  onInterrupt: () => void;
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  state,
  onConnect,
  onDisconnect,
  onInterrupt,
  disabled = false,
}) => {
  const handleClick = () => {
    if (disabled) return;
    if (state === 'disconnected') {
      onConnect();
    } else if (state === 'speaking') {
      onInterrupt();
    } else if (state === 'listening' || state === 'connecting') {
      onDisconnect();
    }
  };

  const getAriaLabel = () => {
    switch (state) {
      case 'disconnected':
        return 'Connect and talk to MJ';
      case 'connecting':
        return 'Connecting to MJ, tap to cancel';
      case 'listening':
        return 'Listening to your voice, tap to disconnect';
      case 'speaking':
        return 'MJ is speaking, tap to interrupt';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative group">
        {/* Outer ambient glow ring */}
        <div
          className={`absolute -inset-2 rounded-full blur-md transition-all duration-300 pointer-events-none ${
            state === 'listening'
              ? 'bg-cyan-500/40 opacity-100 animate-pulse'
              : state === 'speaking'
              ? 'bg-fuchsia-500/50 opacity-100 animate-pulse'
              : state === 'connecting'
              ? 'bg-amber-400/30 opacity-70'
              : 'bg-indigo-500/10 opacity-40 group-hover:opacity-60'
          }`}
        />

        {/* Central button */}
        <button
          onClick={handleClick}
          disabled={disabled}
          aria-label={getAriaLabel()}
          aria-pressed={state !== 'disconnected'}
          className={`relative z-10 w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-xl border backdrop-blur-xl transition-all duration-300 focus:outline-none focus:ring-4 ${
            state === 'disconnected'
              ? 'bg-slate-900/90 hover:bg-slate-800/90 text-cyan-400 border-cyan-500/30 hover:border-cyan-400/60 focus:ring-cyan-500/30 shadow-indigo-950/50'
              : state === 'connecting'
              ? 'bg-amber-950/70 text-amber-300 border-amber-400/50 focus:ring-amber-500/30 shadow-amber-900/30'
              : state === 'listening'
              ? 'bg-cyan-950/80 hover:bg-red-950/80 text-cyan-300 hover:text-red-300 border-cyan-400/80 hover:border-red-400/80 focus:ring-cyan-500/40 shadow-cyan-950/60'
              : 'bg-fuchsia-950/80 hover:bg-red-950/80 text-fuchsia-300 hover:text-red-300 border-fuchsia-400/80 hover:border-red-400/80 focus:ring-fuchsia-500/40 shadow-purple-950/60'
          }`}
        >
          {state === 'disconnected' && (
            <Mic className="w-8 h-8 transition-transform group-hover:scale-110" />
          )}

          {state === 'connecting' && (
            <Loader2 className="w-8 h-8 animate-spin" />
          )}

          {state === 'listening' && (
            <div className="relative">
              <Mic className="w-8 h-8 group-hover:hidden" />
              <MicOff className="w-8 h-8 hidden group-hover:block text-red-400" />
            </div>
          )}

          {state === 'speaking' && (
            <div className="relative">
              <Square className="w-7 h-7 fill-current transition-transform group-hover:scale-110" />
            </div>
          )}
        </button>
      </div>

      {/* Spoken / Status Helper Label */}
      <div className="text-center font-mono text-xs tracking-wider transition-colors duration-200">
        {state === 'disconnected' && (
          <span className="text-slate-400 group-hover:text-slate-200">TAP TO SPEAK</span>
        )}
        {state === 'connecting' && (
          <span className="text-amber-400 animate-pulse">CONNECTING TO MJ...</span>
        )}
        {state === 'listening' && (
          <span className="text-cyan-400 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            LISTENING... TAP TO STOP
          </span>
        )}
        {state === 'speaking' && (
          <span className="text-fuchsia-400 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping" />
            SPEAKING... TAP TO INTERRUPT
          </span>
        )}
      </div>
    </div>
  );
};
