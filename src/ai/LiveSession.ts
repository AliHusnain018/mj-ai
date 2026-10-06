/**
 * LiveSession - Coordinates the real-time Gemini Live WebSocket connection,
 * microphone streaming (AudioStreamer), audio playback (AudioPlayer),
 * and tool execution (ToolManager).
 */

import { AudioPlayer } from '../audio/AudioPlayer';
import { AudioStreamer } from '../audio/AudioStreamer';
import { ToolManager } from '../tools/ToolManager';
import {
  AssistantSettings,
  AssistantState,
  DebugLogEntry,
  ToolCallRequest,
  ToolCallResult,
} from '../types/assistant';

export interface LiveSessionCallbacks {
  onStateChange: (state: AssistantState) => void;
  onMicVolume: (volume: number) => void;
  onAIVolume: (volume: number) => void;
  onLog: (entry: DebugLogEntry) => void;
  onError: (error: string) => void;
  onToolActivity: (name: string, args: any, result?: any) => void;
  onRequestPermission: (request: ToolCallRequest) => Promise<boolean>;
  onLanguageDetected?: (lang: 'English' | 'Urdu' | 'Bilingual') => void;
  onTranscription?: (text: string, sender: 'user' | 'ai') => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private audioStreamer: AudioStreamer | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private toolManager = ToolManager.getInstance();
  private state: AssistantState = 'disconnected';
  private callbacks: LiveSessionCallbacks;
  private settings: AssistantSettings;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private isIntentionallyClosed = false;
  private pingInterval: number | null = null;
  private lastLatency = 0;

  constructor(settings: AssistantSettings, callbacks: LiveSessionCallbacks) {
    this.settings = settings;
    this.callbacks = callbacks;

    // Connect tool manager permission handler
    this.toolManager.setPermissionRequester(callbacks.onRequestPermission);
    this.toolManager.setOnToolActivity((name, args, result) => {
      this.callbacks.onToolActivity(name, args, result);
    });

    // Initialize AudioPlayer
    this.audioPlayer = new AudioPlayer({
      onPlaybackStateChange: (isPlaying) => {
        if (isPlaying && this.state !== 'speaking') {
          this.setState('speaking');
        } else if (!isPlaying && this.state === 'speaking') {
          this.setState('listening');
        }
      },
      onVolumeChange: (vol) => {
        this.callbacks.onAIVolume(vol);
      },
      onError: (err) => {
        this.log('error', `Audio playback error: ${err.message}`);
      },
    });

    // Initialize AudioStreamer
    this.audioStreamer = new AudioStreamer({
      onAudioChunk: (chunk) => {
        this.sendAudioChunk(chunk);
      },
      onVolumeChange: (vol) => {
        this.callbacks.onMicVolume(vol);
      },
      onSpeechDetected: () => {
        // Immediate client-side interruption:
        // If MJ is speaking and user starts talking, stop playback instantly!
        if (this.audioPlayer?.getIsPlaying()) {
          this.log('audio', 'User interruption detected: halting MJ playback');
          this.audioPlayer.stopAll();
          this.setState('listening');
          this.sendWsMessage({ type: 'client_interrupted' });
        }
      },
      onError: (err) => {
        this.log('error', `Microphone error: ${err.message}`);
        this.callbacks.onError(`Microphone access error: ${err.message}`);
        this.disconnect();
      },
    });
  }

  public getState(): AssistantState {
    return this.state;
  }

  public getLatency(): number {
    return this.lastLatency;
  }

  public updateSettings(newSettings: AssistantSettings) {
    this.settings = newSettings;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendWsMessage({
        type: 'update_config',
        personality: newSettings.personalityMode,
        voiceName: newSettings.voiceName,
      });
    }
  }

  /**
   * Connects to the Gemini Live server and opens the mic stream
   */
  public async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'listening' || this.state === 'speaking') {
      return;
    }

    this.isIntentionallyClosed = false;
    this.setState('connecting');
    this.log('info', 'Initiating connection to MJ Voice Engine...');

    try {
      // 1. Start microphone stream first to ensure user permission is granted
      await this.audioStreamer?.start();
      this.log('audio', 'Microphone stream initialized (16kHz PCM mono)');

      // Pre-warm and unlock the AudioPlayer context during the user click gesture
      await this.audioPlayer?.prepare();
      this.log('audio', 'Audio playback context unlocked (24kHz Web Audio)');

      // 2. Establish WebSocket connection to backend Live API proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/live`;

      this.log('info', `Connecting to WebSocket endpoint at ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.log('gemini', 'Connected to MJ Live Voice Server');
        this.reconnectAttempts = 0;
        this.setState('listening');

        // Send initialization handshake with system settings & tool declarations
        this.sendWsMessage({
          type: 'init',
          personality: this.settings.personalityMode,
          voiceName: this.settings.voiceName,
          tools: this.toolManager.getToolDefinitions(),
        });

        this.startHeartbeat();
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          // Audio output from Gemini Live (24kHz PCM)
          if (data.audio) {
            await this.audioPlayer?.playChunk(data.audio);
          }

          // Model turn interruption notification from Gemini Live
          if (data.interrupted) {
            this.log('gemini', 'Model turn interrupted by Gemini Live');
            this.audioPlayer?.stopAll();
            this.setState('listening');
          }

          // Tool call from Gemini Live
          if (data.toolCall) {
            const { id, name, args } = data.toolCall;
            this.log('tool', `Gemini requested tool call: ${name}`, args);

            const result: ToolCallResult = await this.toolManager.executeTool(id, name, args);
            this.log('tool', `Tool execution completed: ${name}`, result.result);

            // Send tool response back to Gemini Live
            this.sendWsMessage({
              type: 'tool_response',
              id,
              name,
              response: result.result,
            });
          }

          // Latency ping-pong
          if (data.type === 'pong' && data.ts) {
            this.lastLatency = Math.round(Date.now() - data.ts);
          }

          // Language / status metadata
          if (data.language) {
            this.callbacks.onLanguageDetected?.(data.language);
          }

          // Live speech transcription
          if (data.transcription) {
            this.callbacks.onTranscription?.(data.transcription, data.sender || 'ai');
            this.log('gemini', `[${data.sender || 'ai'}]: ${data.transcription}`);
          }

          if (data.error) {
            this.log('error', `Live session warning: ${data.error}`);
          }
        } catch (err: any) {
          this.log('error', `Failed to parse Live message: ${err.message}`);
        }
      };

      this.ws.onerror = (e) => {
        this.log('error', 'WebSocket connection error');
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.log('info', `WebSocket connection closed (code: ${event.code})`);

        if (!this.isIntentionallyClosed) {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts), 8000);
            this.log('info', `Reconnecting in ${Math.round(delay / 1000)}s (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
              if (!this.isIntentionallyClosed) {
                this.connect();
              }
            }, delay);
          } else {
            this.callbacks.onError('Connection to MJ was lost. Please tap the button to reconnect.');
            this.disconnect();
          }
        } else {
          this.setState('disconnected');
        }
      };
    } catch (err: any) {
      this.disconnect();
      const message = err instanceof Error ? err.message : String(err);
      this.callbacks.onError(message);
      this.log('error', `Connection failed: ${message}`);
    }
  }

  /**
   * Interrupt MJ immediately (user tapped button or started speaking)
   */
  public interrupt(): void {
    if (this.state === 'speaking') {
      this.log('info', 'User requested immediate interruption');
      this.audioPlayer?.stopAll();
      this.setState('listening');
      this.sendWsMessage({ type: 'client_interrupted' });
    }
  }

  /**
   * Gracefully disconnects session
   */
  public disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();

    if (this.ws) {
      try {
        this.sendWsMessage({ type: 'close' });
        this.ws.close();
      } catch {
        // Ignore close error
      }
      this.ws = null;
    }

    this.audioStreamer?.stop();
    this.audioPlayer?.stopAll();
    this.setState('disconnected');
    this.log('info', 'MJ Voice session ended');
  }

  private sendAudioChunk(base64Chunk: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'realtime_input',
          audio: base64Chunk,
        })
      );
    }
  }

  private sendWsMessage(msg: Record<string, any>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendWsMessage({ type: 'ping', ts: Date.now() });
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private setState(newState: AssistantState) {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  private log(type: DebugLogEntry['type'], message: string, data?: any) {
    const entry: DebugLogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data,
    };
    this.callbacks.onLog(entry);
  }

  public destroy() {
    this.disconnect();
    this.audioPlayer?.destroy();
  }
}
