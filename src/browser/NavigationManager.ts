/**
 * NavigationManager - Tab-level operations, browser history, and URL navigation
 */

import { BrowserBridge } from './BrowserBridge';

export class NavigationManager {
  private static instance: NavigationManager;
  private bridge: BrowserBridge;

  private constructor() {
    this.bridge = BrowserBridge.getInstance();
  }

  public static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  public async openUrl(url: string): Promise<any> {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    return this.bridge.sendCommand('OPEN_URL', { url: targetUrl });
  }

  public async navigate(url: string, tabId?: number): Promise<any> {
    return this.bridge.sendCommand('NAVIGATE', { url }, tabId);
  }

  public async goBack(tabId?: number): Promise<any> {
    return this.bridge.sendCommand('GO_BACK', {}, tabId);
  }

  public async goForward(tabId?: number): Promise<any> {
    return this.bridge.sendCommand('GO_FORWARD', {}, tabId);
  }

  public async reload(tabId?: number): Promise<any> {
    return this.bridge.sendCommand('RELOAD', {}, tabId);
  }

  public async getActiveTab(): Promise<any> {
    return this.bridge.sendCommand('GET_ACTIVE_TAB');
  }

  public async getTabs(): Promise<any> {
    return this.bridge.sendCommand('GET_TABS');
  }

  public async switchTab(tabId: number): Promise<any> {
    return this.bridge.sendCommand('SWITCH_TAB', { tabId });
  }

  public async closeTab(tabId?: number): Promise<any> {
    return this.bridge.sendCommand('CLOSE_TAB', {}, tabId);
  }
}
