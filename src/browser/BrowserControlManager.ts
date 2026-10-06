/**
 * BrowserControlManager - Central coordinator for MJ's Live Browser & Website Control Engine
 */

import { BrowserBridge } from './BrowserBridge';
import { BrowserTaskManager, TaskStatus } from './BrowserTaskManager';
import { NavigationManager } from './NavigationManager';
import { PageInspector } from './PageInspector';
import { TargetMemory } from './TargetMemory';
import {
  BrowserActionRequest,
  BrowserActionResult,
  BrowserActionType,
  BrowserTaskContext,
  ExtensionConnectionStatus,
} from './BrowserTypes';

export class BrowserControlManager {
  private static instance: BrowserControlManager;
  private bridge = BrowserBridge.getInstance();
  private taskManager = BrowserTaskManager.getInstance();
  private navManager = NavigationManager.getInstance();
  private inspector = PageInspector.getInstance();
  private targetMemory = TargetMemory.getInstance();

  private taskContext: BrowserTaskContext = {
    recentTargets: [],
    recentPages: [],
  };

  private constructor() {
    this.bridge.onStatusChange((status) => {
      console.log(`[MJ Browser Control] Extension status: ${status}`);
    });
  }

  public static getInstance(): BrowserControlManager {
    if (!BrowserControlManager.instance) {
      BrowserControlManager.instance = new BrowserControlManager();
    }
    return BrowserControlManager.instance;
  }

  public getExtensionStatus(): ExtensionConnectionStatus {
    return this.bridge.getStatus();
  }

  public getTaskStatus(): TaskStatus {
    return this.taskManager.getStatus();
  }

  public getContext(): BrowserTaskContext {
    return {
      ...this.taskContext,
      recentTargets: this.targetMemory.getRecentTargets(),
      lastTarget: this.targetMemory.getLastClickedTarget() || undefined,
    };
  }

  public onStatusChange(listener: (status: ExtensionConnectionStatus) => void): () => void {
    return this.bridge.onStatusChange(listener);
  }

  public onTaskStatusChange(listener: (status: TaskStatus, details?: string) => void): () => void {
    return this.taskManager.onStatusChange(listener);
  }

  public cancelCurrentTask(): void {
    this.taskManager.cancelCurrentTask();
  }

  /**
   * Main entry point called by ToolManager when Gemini Live triggers a browser action
   */
  public async handleBrowserAction(
    action: BrowserActionType,
    params: {
      url?: string;
      targetDescription?: string;
      direction?: 'up' | 'down' | 'top' | 'bottom';
      scrollAmount?: 'small' | 'medium' | 'large' | number;
      text?: string;
      pressEnter?: boolean;
      clearFirst?: boolean;
      mediaAction?: 'play' | 'pause' | 'toggle' | 'seek_forward' | 'seek_backward' | 'mute' | 'unmute';
      seconds?: number;
      tabId?: number;
    }
  ): Promise<BrowserActionResult> {
    const actionId = 'act_' + Date.now();

    // Check if extension is connected
    const extStatus = this.bridge.getStatus();

    // Fallback: If extension is not yet connected and action is OPEN_URL, safely open a browser tab directly
    if (extStatus !== 'connected' && action === 'OPEN_URL' && params.url) {
      let finalUrl = params.url.trim();
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
      return {
        success: true,
        actionId,
        action: 'OPEN_URL',
        url: finalUrl,
        spokenFeedback: `Opened ${finalUrl}. (Tip: Install the MJ Chrome Extension for continuous voice-controlled clicking and scrolling on this page).`,
      };
    }

    if (extStatus !== 'connected' && action !== 'OPEN_URL') {
      return {
        success: false,
        actionId,
        action,
        error: {
          code: 'EXTENSION_NOT_CONNECTED',
          message:
            'MJ Chrome Extension is not currently connected. Please load the extension from the /extension folder in chrome://extensions to enable in-page browser control.',
          recoverable: false,
        },
        spokenFeedback:
          'Browser control extension abhi connected nahi hai. Please MJ extension ko chrome://extensions se load karein taake main page ko click aur scroll kar sakun.',
      };
    }

    const request: BrowserActionRequest = {
      actionId,
      action,
      url: params.url,
      tabId: params.tabId,
      target: params.targetDescription ? { description: params.targetDescription } : undefined,
      scrollParams: params.direction
        ? {
            direction: params.direction,
            amount: params.scrollAmount || 'medium',
          }
        : undefined,
      typeParams: params.text
        ? {
            text: params.text,
            pressEnter: params.pressEnter ?? true,
            clearFirst: params.clearFirst ?? true,
          }
        : undefined,
      mediaParams: params.mediaAction
        ? {
            action: params.mediaAction,
            seconds: params.seconds,
          }
        : undefined,
    };

    const result = await this.taskManager.executeAction(request);

    // Update task context
    if (result.success) {
      this.taskContext.lastAction = action;
      if (result.url) this.taskContext.currentUrl = result.url;
      if (result.title) this.taskContext.currentPageTitle = result.title;
    }

    return result;
  }
}
