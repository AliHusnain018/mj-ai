/**
 * AudioPlayer - Receives 24kHz PCM audio chunks from Gemini Live and plays them
 * with ultra-low latency, gapless scheduling, real-time waveform analysis,
 * and instantaneous interruption support.
 */

import { base64ToPCM16, pcm16ToFloat } from './audioUtils';

export interface AudioPlayerOptions {
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onVolumeChange?: (volume: number) => void;
  onError?: (error: Error) => void;
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private activeSources: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;
  private isPlaying = false;
  private options: AudioPlayerOptions;
  private checkInterval: number | null = null;

  constructor(options: AudioPlayerOptions = {}) {
    this.options = options;
  }

  /**
   * Pre-warms and resumes the AudioContext upon user gesture
   * to comply with browser autoplay security policies.
   */
  public async prepare(): Promise<void> {
    try {
      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch (err: any) {
      console.warn('Could not pre-resume AudioPlayer context:', err);
    }
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      // Try initializing at 24kHz for Gemini Live, fallback to system default sample rate
      try {
        this.audioContext = new AudioCtx({ sampleRate: 24000 });
      } catch {
        this.audioContext = new AudioCtx();
      }
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.3;

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Setup volume polling for the output waveform
      this.startVolumePolling();
    }
    return this.audioContext;
  }

  private startVolumePolling() {
    if (this.checkInterval) return;
    this.checkInterval = window.setInterval(() => {
      if (!this.analyserNode || !this.isPlaying) {
        this.options.onVolumeChange?.(0);
        return;
      }
      const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.analyserNode.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(1, avg / 128);
      this.options.onVolumeChange?.(normalized);
    }, 40);
  }

  /**
   * Enqueues a base64-encoded 24kHz 16-bit PCM chunk from Gemini Live
   */
  public async playChunk(base64Chunk: string): Promise<void> {
    try {
      const ctx = this.initAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const pcm16 = base64ToPCM16(base64Chunk);
      if (pcm16.length === 0) return;

      const floatData = pcm16ToFloat(pcm16);

      // Create an AudioBuffer (1 channel, 24kHz)
      const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
      audioBuffer.getChannelData(0).set(floatData);

      // Create AudioBufferSourceNode
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Connect to analyser -> gain -> destination
      source.connect(this.analyserNode!);

      // Schedule gapless playback
      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      source.start(startTime);
      this.activeSources.push(source);

      if (!this.isPlaying) {
        this.isPlaying = true;
        this.options.onPlaybackStateChange?.(true);
      }

      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }

        // If no more sources are scheduled/playing
        if (this.activeSources.length === 0 && ctx.currentTime >= this.nextStartTime - 0.05) {
          this.isPlaying = false;
          this.options.onPlaybackStateChange?.(false);
          this.options.onVolumeChange?.(0);
        }
      };
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.options.onError?.(error);
    }
  }

  /**
   * Stop all playback immediately when user interrupts or disconnects
   */
  public stopAll(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might have already stopped
      }
    }
    this.activeSources = [];
    this.nextStartTime = 0;

    if (this.isPlaying) {
      this.isPlaying = false;
      this.options.onPlaybackStateChange?.(false);
      this.options.onVolumeChange?.(0);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public destroy(): void {
    this.stopAll();
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // Ignore close error
      }
      this.audioContext = null;
    }
  }
}
