/**
 * AudioStreamer - Captures microphone input at 16kHz 16-bit PCM for Gemini Live API
 */

import { floatToPCM16, pcm16ToBase64, resampleAudioBuffer } from './audioUtils';

export interface AudioStreamerOptions {
  onAudioChunk: (base64Chunk: string) => void;
  onVolumeChange?: (volume: number) => void;
  onSpeechDetected?: () => void;
  onError?: (error: Error) => void;
  targetSampleRate?: number;
}

export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isStreaming = false;
  private options: AudioStreamerOptions;
  private targetSampleRate = 16000;
  private volumeCheckInterval: number | null = null;
  private speechDetectionThreshold = 0.08;
  private consecutiveSpeechFrames = 0;

  constructor(options: AudioStreamerOptions) {
    this.options = options;
    if (options.targetSampleRate) {
      this.targetSampleRate = options.targetSampleRate;
    }
  }

  public async start(): Promise<void> {
    if (this.isStreaming) return;

    try {
      // 1. Request microphone access with echo cancellation & noise suppression
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. Initialize AudioContext at 16kHz if supported, or system default
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      try {
        this.audioContext = new AudioCtx({ sampleRate: this.targetSampleRate });
      } catch {
        // Fallback to default sample rate
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const actualSampleRate = this.audioContext.sampleRate;

      // 3. Connect nodes
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.4;

      // ScriptProcessor for PCM chunking (buffer size 4096 = ~256ms at 16kHz)
      this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!this.isStreaming) return;

        const inputChannel = e.inputBuffer.getChannelData(0);

        // Calculate RMS volume level (0.0 to 1.0)
        let sumSquares = 0;
        for (let i = 0; i < inputChannel.length; i++) {
          sumSquares += inputChannel[i] * inputChannel[i];
        }
        const rms = Math.sqrt(sumSquares / inputChannel.length);
        const normalizedVolume = Math.min(1, rms * 4); // Scaled for UI

        this.options.onVolumeChange?.(normalizedVolume);

        // Detect deliberate user speech (high energy) to trigger interruption of MJ if speaking
        if (rms > 0.28) {
          this.consecutiveSpeechFrames++;
          if (this.consecutiveSpeechFrames >= 3) {
            this.options.onSpeechDetected?.();
          }
        } else {
          this.consecutiveSpeechFrames = 0;
        }

        // Resample to 16kHz if necessary
        let processedData: Float32Array<any> = inputChannel;
        if (actualSampleRate !== this.targetSampleRate) {
          processedData = resampleAudioBuffer(inputChannel, actualSampleRate, this.targetSampleRate);
        }

        // Convert to 16-bit PCM and encode base64
        const pcm16 = floatToPCM16(processedData);
        const base64Chunk = pcm16ToBase64(pcm16);

        this.options.onAudioChunk(base64Chunk);
      };

      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.processorNode);

      // Connect through a silent gain node to prevent mic loopback into user speakers
      const muteNode = this.audioContext.createGain();
      muteNode.gain.value = 0;
      this.processorNode.connect(muteNode);
      muteNode.connect(this.audioContext.destination);

      this.isStreaming = true;
    } catch (err: any) {
      this.stop();
      const error = err instanceof Error ? err : new Error(String(err));
      this.options.onError?.(error);
      throw error;
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  public stop(): void {
    this.isStreaming = false;

    if (this.volumeCheckInterval) {
      window.clearInterval(this.volumeCheckInterval);
      this.volumeCheckInterval = null;
    }

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // Ignore close error
      }
      this.audioContext = null;
    }

    this.options.onVolumeChange?.(0);
  }

  public isActive(): boolean {
    return this.isStreaming;
  }
}
