/**
 * PageInspector - Synthesizes compact, high-signal page representations for Gemini Live
 */

import { PageState } from './BrowserTypes';
import { BrowserBridge } from './BrowserBridge';

export class PageInspector {
  private static instance: PageInspector;
  private bridge = BrowserBridge.getInstance();

  private constructor() {}

  public static getInstance(): PageInspector {
    if (!PageInspector.instance) {
      PageInspector.instance = new PageInspector();
    }
    return PageInspector.instance;
  }

  public async inspectCurrentPage(tabId?: number): Promise<PageState> {
    const rawState = await this.bridge.sendCommand<PageState>('INSPECT_PAGE', {}, tabId);
    return rawState;
  }

  /**
   * Generates a token-compact, voice-optimized summary of what is visible right now
   */
  public generateCompactSummary(pageState: PageState): string {
    const lines: string[] = [];
    lines.push(`URL: ${pageState.url}`);
    lines.push(`Title: "${pageState.title}"`);

    // Top visible videos
    const videos = pageState.elements.filter((e) => e.isVideo || e.elementType === 'video');
    if (videos.length > 0) {
      lines.push(`\nVisible Videos (${Math.min(videos.length, 5)}):`);
      videos.slice(0, 5).forEach((v, idx) => {
        lines.push(`  ${idx + 1}. "${v.text}"${v.badge ? ` (${v.badge})` : ''} [id: ${v.id}]`);
      });
    }

    // Top visible channels
    const channels = pageState.elements.filter((e) => e.isChannel || e.elementType === 'channel');
    if (channels.length > 0) {
      lines.push(`\nVisible Channels (${Math.min(channels.length, 3)}):`);
      channels.slice(0, 3).forEach((c) => {
        lines.push(`  - "${c.text}" [id: ${c.id}]`);
      });
    }

    // Media playback status
    if (pageState.mediaState?.hasMedia) {
      lines.push(
        `\nMedia: ${pageState.mediaState.isPlaying ? 'Playing ▶' : 'Paused ⏸'} (${pageState.mediaState.currentTime}s / ${pageState.mediaState.duration}s)`
      );
    }

    // Key interactive buttons/links (if not on video site)
    if (videos.length === 0) {
      const buttons = pageState.elements.filter((e) => e.elementType === 'button' || e.elementType === 'link');
      if (buttons.length > 0) {
        lines.push(`\nActionable Items:`);
        buttons.slice(0, 6).forEach((b) => {
          lines.push(`  - "${b.text || b.ariaLabel}" (${b.elementType}) [id: ${b.id}]`);
        });
      }
    }

    return lines.join('\n');
  }
}
