/**
 * Waveform - Canvas-based fluid audio visualization
 * Renders smooth reactive sine waves corresponding to mic input or AI speech output.
 */

import React, { useEffect, useRef } from 'react';
import { AssistantState } from '../types/assistant';

interface WaveformProps {
  state: AssistantState;
  micVolume: number;
  aiVolume: number;
  reducedMotion?: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({
  state,
  micVolume,
  aiVolume,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 64;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isListening = state === 'listening';
      const isSpeaking = state === 'speaking';
      const isConnected = isListening || isSpeaking;

      const activeVolume = isSpeaking ? aiVolume : isListening ? micVolume : 0.05;
      const amplitude = Math.max(3, activeVolume * (height / 2.3));

      // Wave styling based on state
      let strokeStyle = 'rgba(100, 116, 139, 0.3)';
      if (isListening) {
        strokeStyle = 'rgba(34, 211, 238, 0.85)';
      } else if (isSpeaking) {
        strokeStyle = 'rgba(232, 121, 249, 0.9)';
      } else if (state === 'connecting') {
        strokeStyle = 'rgba(250, 204, 21, 0.6)';
      }

      if (!reducedMotion) {
        phaseRef.current += isConnected ? 0.08 + activeVolume * 0.15 : 0.02;
      }

      const centerY = height / 2;

      // Draw primary wave
      ctx.beginPath();
      ctx.lineWidth = isConnected ? 2.5 : 1.5;
      ctx.strokeStyle = strokeStyle;
      ctx.lineCap = 'round';

      for (let x = 0; x < width; x++) {
        // Window function (fade to zero at left and right edges)
        const windowFactor = Math.sin((x / width) * Math.PI);
        const frequency = isSpeaking ? 0.04 : 0.03;
        const y = centerY + Math.sin(x * frequency + phaseRef.current) * amplitude * windowFactor;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw subtle secondary harmonic wave when active
      if (isConnected) {
        ctx.beginPath();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = isSpeaking ? 'rgba(168, 85, 247, 0.4)' : 'rgba(6, 182, 212, 0.35)';

        for (let x = 0; x < width; x++) {
          const windowFactor = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * 0.06 - phaseRef.current * 1.3) * (amplitude * 0.6) * windowFactor;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, micVolume, aiVolume, reducedMotion]);

  return (
    <div className="w-full max-w-sm h-14 relative flex items-center justify-center pointer-events-none select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
