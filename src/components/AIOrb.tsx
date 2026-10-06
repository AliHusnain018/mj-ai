/**
 * AIOrb - Animated Futuristic Orb for MJ
 * GPU-friendly, reacts dynamically to assistant states and real-time audio volume.
 */

import React, { useMemo } from 'react';
import { AssistantState } from '../types/assistant';

interface AIOrbProps {
  state: AssistantState;
  micVolume: number;
  aiVolume: number;
  reducedMotion?: boolean;
}

export const AIOrb: React.FC<AIOrbProps> = ({
  state,
  micVolume,
  aiVolume,
  reducedMotion = false,
}) => {
  // Compute dynamic scale and glow based on state and live audio levels
  const dynamicScale = useMemo(() => {
    if (reducedMotion) return 1;
    if (state === 'listening') {
      return 1 + Math.min(0.25, micVolume * 0.4);
    }
    if (state === 'speaking') {
      return 1 + Math.min(0.35, aiVolume * 0.5);
    }
    return 1;
  }, [state, micVolume, aiVolume, reducedMotion]);

  const glowIntensity = useMemo(() => {
    if (state === 'disconnected') return 'rgba(99, 102, 241, 0.15)';
    if (state === 'connecting') return 'rgba(234, 179, 8, 0.35)';
    if (state === 'listening') {
      const v = Math.min(1, 0.4 + micVolume * 0.6);
      return `rgba(6, 182, 212, ${v})`;
    }
    if (state === 'speaking') {
      const v = Math.min(1, 0.5 + aiVolume * 0.6);
      return `rgba(168, 85, 247, ${v})`;
    }
    return 'rgba(99, 102, 241, 0.2)';
  }, [state, micVolume, aiVolume]);

  return (
    <div className="relative flex items-center justify-center w-72 h-72 sm:w-80 sm:h-80 select-none">
      {/* Outer ambient glow */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-300 pointer-events-none blur-3xl"
        style={{
          backgroundColor: glowIntensity,
          transform: `scale(${dynamicScale * 1.3})`,
        }}
      />

      {/* Outer rotating holographic ring (Connecting / Speaking) */}
      <div
        className={`absolute inset-4 rounded-full border border-dashed transition-all duration-700 pointer-events-none ${
          state === 'connecting'
            ? 'border-amber-400/40 animate-spin'
            : state === 'listening'
            ? 'border-cyan-400/30'
            : state === 'speaking'
            ? 'border-purple-400/40 animate-spin'
            : 'border-slate-700/20'
        }`}
        style={{
          animationDuration: state === 'connecting' ? '8s' : '16s',
          transform: `scale(${state === 'speaking' ? 1.05 + aiVolume * 0.15 : 1})`,
        }}
      />

      {/* Soundwave pulse ripple 1 (Listening & Speaking) */}
      {(state === 'listening' || state === 'speaking') && (
        <div
          className={`absolute inset-8 rounded-full border transition-transform duration-150 pointer-events-none ${
            state === 'listening'
              ? 'border-cyan-500/30 animate-ping'
              : 'border-fuchsia-500/30 animate-pulse'
          }`}
          style={{
            animationDuration: state === 'listening' ? '2.4s' : '1.8s',
            transform: `scale(${1 + (state === 'listening' ? micVolume * 0.3 : aiVolume * 0.3)})`,
          }}
        />
      )}

      {/* Soundwave pulse ripple 2 */}
      {(state === 'listening' || state === 'speaking') && (
        <div
          className="absolute inset-12 rounded-full border border-indigo-400/20 pointer-events-none"
          style={{
            transform: `scale(${1 + (state === 'listening' ? micVolume * 0.2 : aiVolume * 0.2)})`,
            transition: 'transform 100ms ease-out',
          }}
        />
      )}

      {/* Central Glass Spherical Core */}
      <div
        className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden flex items-center justify-center shadow-2xl transition-transform duration-100 ease-out border backdrop-blur-md ${
          state === 'disconnected'
            ? 'border-slate-800/80 shadow-indigo-950/40'
            : state === 'connecting'
            ? 'border-amber-500/40 shadow-amber-500/20'
            : state === 'listening'
            ? 'border-cyan-400/60 shadow-cyan-500/30'
            : 'border-fuchsia-400/60 shadow-purple-500/40'
        }`}
        style={{
          transform: `scale(${dynamicScale})`,
          background:
            state === 'disconnected'
              ? 'radial-gradient(circle at 35% 35%, #1e1b4b 0%, #0f172a 65%, #020617 100%)'
              : state === 'connecting'
              ? 'radial-gradient(circle at 35% 35%, #451a03 0%, #1e1b4b 60%, #030712 100%)'
              : state === 'listening'
              ? 'radial-gradient(circle at 35% 35%, #083344 0%, #0369a1 40%, #0f172a 80%, #020617 100%)'
              : 'radial-gradient(circle at 35% 35%, #4c1d95 0%, #701a75 40%, #0f172a 80%, #020617 100%)',
        }}
      >
        {/* Core plasma swirls */}
        <div
          className={`absolute w-36 h-36 rounded-full blur-xl opacity-80 mix-blend-screen transition-all duration-300 ${
            state === 'disconnected'
              ? 'bg-indigo-600/30 animate-pulse'
              : state === 'connecting'
              ? 'bg-amber-400/50 animate-pulse'
              : state === 'listening'
              ? 'bg-cyan-400/60'
              : 'bg-fuchsia-500/70'
          }`}
          style={{
            transform: `scale(${1 + (state === 'speaking' ? aiVolume * 0.6 : micVolume * 0.5)}) rotate(${Date.now() / 200}deg)`,
            transition: 'transform 80ms ease-out',
          }}
        />

        {/* Secondary inner orb shimmer */}
        <div
          className={`absolute w-24 h-24 rounded-full blur-lg opacity-90 mix-blend-color-dodge transition-all ${
            state === 'disconnected'
              ? 'bg-slate-400/20'
              : state === 'connecting'
              ? 'bg-amber-200/50'
              : state === 'listening'
              ? 'bg-cyan-200/70'
              : 'bg-pink-300/80'
          }`}
          style={{
            transform: `scale(${0.9 + (state === 'speaking' ? aiVolume * 0.4 : micVolume * 0.3)})`,
          }}
        />

        {/* Core Specular Lens Highlight */}
        <div className="absolute top-4 left-6 w-16 h-8 rounded-full bg-white/20 blur-sm transform -rotate-25 pointer-events-none" />

        {/* Dynamic center status dot */}
        <div
          className={`w-3 h-3 rounded-full transition-all duration-200 ${
            state === 'disconnected'
              ? 'bg-slate-500/60'
              : state === 'connecting'
              ? 'bg-amber-400 animate-ping'
              : state === 'listening'
              ? 'bg-cyan-300 shadow-[0_0_12px_#22d3ee]'
              : 'bg-white shadow-[0_0_16px_#f472b6]'
          }`}
        />
      </div>
    </div>
  );
};
