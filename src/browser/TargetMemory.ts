/**
 * TargetMemory - Tracks referenced elements, videos, channels, and resolves relative pronouns
 */

import { PageElement } from './BrowserTypes';

export class TargetMemory {
  private static instance: TargetMemory;
  private recentTargets: PageElement[] = [];
  private lastClickedTarget: PageElement | null = null;
  private lastReferencedChannel: PageElement | null = null;
  private lastReferencedVideo: PageElement | null = null;
  private currentHostname: string = '';

  private constructor() {}

  public static getInstance(): TargetMemory {
    if (!TargetMemory.instance) {
      TargetMemory.instance = new TargetMemory();
    }
    return TargetMemory.instance;
  }

  public recordTarget(element: PageElement, action: 'click' | 'inspect' | 'type'): void {
    // Add to recent targets (deduped by ID)
    this.recentTargets = [element, ...this.recentTargets.filter((t) => t.id !== element.id)].slice(0, 15);

    if (action === 'click') {
      this.lastClickedTarget = element;
    }

    if (element.isChannel || element.elementType === 'channel') {
      this.lastReferencedChannel = element;
    } else if (element.isVideo || element.elementType === 'video') {
      this.lastReferencedVideo = element;
    }
  }

  public getLastClickedTarget(): PageElement | null {
    return this.lastClickedTarget;
  }

  public getLastReferencedChannel(): PageElement | null {
    return this.lastReferencedChannel;
  }

  public getLastReferencedVideo(): PageElement | null {
    return this.lastReferencedVideo;
  }

  public getRecentTargets(): PageElement[] {
    return [...this.recentTargets];
  }

  /**
   * Resolves contextual pronouns such as "its channel", "that one", "this video", "pehli", etc.
   */
  public resolveContextualTarget(queryStr: string, currentElements: PageElement[]): PageElement | null {
    const q = queryStr.toLowerCase().trim();

    // 1. "its channel" / "iska channel" / "that channel"
    if (q.includes('its channel') || q.includes('iska channel') || q.includes('is channel') || q.includes('channel')) {
      if (this.lastReferencedChannel) {
        // Try finding it on current page if still visible
        const match = currentElements.find(
          (el) =>
            el.isChannel &&
            this.lastReferencedChannel?.text &&
            el.text?.toLowerCase().includes(this.lastReferencedChannel.text.toLowerCase())
        );
        if (match) return match;
      }
      // Return first visible channel on current page
      const firstChannel = currentElements.find((el) => el.isChannel || el.elementType === 'channel');
      if (firstChannel) return firstChannel;
    }

    // 2. "this video" / "that video" / "is video ko" / "woh video"
    if (q.includes('this video') || q.includes('that video') || q.includes('is video') || q.includes('woh video')) {
      if (this.lastReferencedVideo) {
        const match = currentElements.find((el) => el.id === this.lastReferencedVideo?.id);
        if (match) return match;
      }
      const firstVideo = currentElements.find((el) => el.isVideo || el.elementType === 'video');
      if (firstVideo) return firstVideo;
    }

    // 3. "that one" / "wahi wala" / "the one I mentioned" / "previous"
    if (
      q.includes('that one') ||
      q.includes('wahi') ||
      q.includes('jo maine kaha') ||
      q.includes('mentioned') ||
      q.includes('previous')
    ) {
      if (this.lastClickedTarget) return this.lastClickedTarget;
      if (this.recentTargets.length > 0) return this.recentTargets[0];
    }

    return null;
  }

  public notifyNavigation(newUrl: string): void {
    try {
      const newHost = new URL(newUrl).hostname;
      if (this.currentHostname && this.currentHostname !== newHost) {
        // Clear stale elements on domain change
        this.clear();
      }
      this.currentHostname = newHost;
    } catch {
      // Ignore URL parsing errors
    }
  }

  public clear(): void {
    this.recentTargets = [];
    this.lastClickedTarget = null;
    this.lastReferencedChannel = null;
    this.lastReferencedVideo = null;
    this.currentHostname = '';
  }
}
