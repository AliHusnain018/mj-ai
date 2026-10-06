/**
 * BrowserBridge - Handles real-time messaging and heartbeat with Chrome Extension MV3
 */

import {
  BRIDGE_CHANNELS,
  BridgeCommandType,
  BridgeRequestMessage,
  BridgeResponseMessage,
} from '../../extension/bridge/message-types';
import { ExtensionConnectionStatus } from './BrowserTypes';

export class BrowserBridge {
  private static instance: BrowserBridge;
  private status: ExtensionConnectionStatus = 'disconnected';
  private pendingRequests = new Map<
    string,
    { resolve: (data: any) => void; reject: (err: any) => void; timer: number }
  >();
  private statusListeners = new Set<(status: ExtensionConnectionStatus) => void>();
  private heartbeatInterval: number | null = null;
  private lastPingTime = 0;
  private activeTabId: number | null = null;
  private activeTabUrl: string | null = null;
  private activeTabTitle: string | null = null;

  private constructor() {
    this.setupWindowListener();
    this.startHeartbeat();
  }

  public static getInstance(): BrowserBridge {
    if (!BrowserBridge.instance) {
      BrowserBridge.instance = new BrowserBridge();
    }
    return BrowserBridge.instance;
  }

  public getStatus(): ExtensionConnectionStatus {
    return this.status;
  }

  public getActiveTabInfo() {
    return {
      tabId: this.activeTabId,
      url: this.activeTabUrl,
      title: this.activeTabTitle,
    };
  }

  public onStatusChange(listener: (status: ExtensionConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(newStatus: ExtensionConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((fn) => fn(newStatus));
    }
  }

  private setupWindowListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('message', (event) => {
      const data = event.data as BridgeResponseMessage;
      if (!data || data.channel !== BRIDGE_CHANNELS.EXT_TO_APP) return;

      // Handle heartbeat pong
      if (data.command === 'PING') {
        if (data.success && data.data?.status === 'ok') {
          this.setStatus('connected');
          if (data.data.activeTab) {
            this.activeTabId = data.data.activeTab.id;
            this.activeTabUrl = data.data.activeTab.url;
            this.activeTabTitle = data.data.activeTab.title;
          }
        }
      }

      // Handle pending correlated request
      const pending = this.pendingRequests.get(data.requestId);
      if (pending) {
        window.clearTimeout(pending.timer);
        this.pendingRequests.delete(data.requestId);

        if (data.success) {
          pending.resolve(data.data);
        } else {
          pending.reject(new Error(data.error || 'Extension action failed'));
        }
      }
    });
  }

  private startHeartbeat(): void {
    if (typeof window === 'undefined') return;

    const ping = () => {
      this.lastPingTime = Date.now();
      window.postMessage(
        {
          channel: BRIDGE_CHANNELS.APP_TO_EXT,
          requestId: 'ping_' + Date.now(),
          command: 'PING',
          timestamp: Date.now(),
        } as BridgeRequestMessage,
        '*'
      );

      // If no reply after 3s, flag disconnected
      setTimeout(() => {
        if (Date.now() - this.lastPingTime >= 3500 && this.status === 'connected') {
          this.setStatus('disconnected');
        }
      }, 3500);
    };

    // Initial ping
    ping();
    this.heartbeatInterval = window.setInterval(ping, 4000);
  }

  /**
   * Sends a structured command to the Chrome Extension
   */
  public async sendCommand<T = any>(
    command: BridgeCommandType,
    payload?: any,
    tabId?: number,
    timeoutMs: number = 10000
  ): Promise<T> {
    if (typeof window === 'undefined') {
      throw new Error('BrowserBridge can only be executed in a browser environment.');
    }

    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(
          new Error(
            this.status === 'disconnected'
              ? 'MJ Chrome Extension is not connected. Please ensure the extension is installed and enabled in Chrome.'
              : `Browser command '${command}' timed out after ${Math.round(timeoutMs / 1000)}s.`
          )
        );
      }, timeoutMs);

      this.pendingRequests.set(requestId, { resolve, reject, timer });

      window.postMessage(
        {
          channel: BRIDGE_CHANNELS.APP_TO_EXT,
          requestId,
          command,
          tabId: tabId || this.activeTabId || undefined,
          payload,
          timestamp: Date.now(),
        } as BridgeRequestMessage,
        '*'
      );
    });
  }

  public destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.statusListeners.clear();
    this.pendingRequests.clear();
  }
}
