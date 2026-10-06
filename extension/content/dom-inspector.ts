/**
 * DOM Inspector for MJ Chrome Extension - Extracts compact, high-signal page representation
 */

import { PageElement, PageState, ViewportState } from '../../src/browser/BrowserTypes';
import { YouTubeAdapter } from '../adapters/youtube/youtube-adapter';

export class DOMInspector {
  private static elementIdCounter = 1;
  private static elementMap = new Map<string, HTMLElement>();

  public static getElementById(id: string): HTMLElement | undefined {
    return this.elementMap.get(id);
  }

  public static inspectPage(): PageState {
    this.elementMap.clear();
    this.elementIdCounter = 1;

    const hostname = window.location.hostname;
    const isYT = YouTubeAdapter.isYouTube(hostname);

    const viewport: ViewportState = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX || window.pageXOffset,
      scrollY: window.scrollY || window.pageYOffset,
      documentHeight: Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      ),
      documentWidth: Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth
      ),
    };

    const elements: PageElement[] = [];

    // If on YouTube, run dedicated high-signal extraction first
    if (isYT) {
      const ytItems = YouTubeAdapter.extractVideoItems();
      ytItems.slice(0, 40).forEach((item) => {
        const id = this.registerElement(item.element);
        const rect = item.element.getBoundingClientRect();
        elements.push({
          id,
          tagName: item.element.tagName.toLowerCase(),
          text: item.title,
          elementType: item.isChannel ? 'channel' : 'video',
          visible: this.isElementVisible(item.element, rect),
          isChannel: item.isChannel,
          isVideo: !item.isChannel,
          badge: item.channelName ? `by ${item.channelName}` : undefined,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          href: (item.element as HTMLAnchorElement).href,
        });
      });
    }

    // Generic visible interactive element gathering
    const interactiveSelectors = [
      'button',
      'a[href]',
      'input:not([type="hidden"])',
      'textarea',
      'select',
      '[role="button"]',
      '[role="link"]',
      '[role="tab"]',
      '[role="menuitem"]',
      '[role="searchbox"]',
      'video',
      'audio',
      '[contenteditable="true"]',
    ];

    const candidates = Array.from(document.querySelectorAll(interactiveSelectors.join(', '))) as HTMLElement[];

    for (const el of candidates) {
      if (elements.length >= 100) break; // Limit elements for token efficiency

      // Check if already registered
      if (el.dataset.mjId && this.elementMap.has(el.dataset.mjId)) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      const isVis = this.isElementVisible(el, rect);
      if (!isVis) continue;

      const tagName = el.tagName.toLowerCase();
      let text = el.innerText?.trim() || '';
      if (!text && el instanceof HTMLInputElement) {
        text = el.value || el.placeholder || '';
      }

      const ariaLabel = el.getAttribute('aria-label') || undefined;
      const title = el.getAttribute('title') || undefined;
      const role = el.getAttribute('role') || undefined;
      const href = (el as HTMLAnchorElement).href || undefined;

      // Filter out low-value empty links/buttons
      if (!text && !ariaLabel && !title && tagName !== 'input' && tagName !== 'video' && tagName !== 'audio') {
        continue;
      }

      const id = this.registerElement(el);

      let elementType: PageElement['elementType'] = 'button';
      if (tagName === 'a' || role === 'link') elementType = 'link';
      else if (tagName === 'input' || tagName === 'textarea') elementType = 'input';
      else if (tagName === 'video') elementType = 'video';
      else if (role === 'tab') elementType = 'tab';
      else if (role === 'menuitem') elementType = 'menu';

      elements.push({
        id,
        tagName,
        role,
        text: text ? text.substring(0, 100) : undefined,
        ariaLabel: ariaLabel ? ariaLabel.substring(0, 80) : undefined,
        title: title ? title.substring(0, 80) : undefined,
        href,
        placeholder: (el as HTMLInputElement).placeholder || undefined,
        visible: true,
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        elementType,
      });
    }

    // Media state detection
    const mediaEl = (document.querySelector('video') || document.querySelector('audio')) as HTMLMediaElement;

    return {
      url: window.location.href,
      title: document.title,
      hostname: window.location.hostname,
      loading: document.readyState !== 'complete',
      viewport,
      elements,
      mediaState: mediaEl
        ? {
            hasMedia: true,
            isPlaying: !mediaEl.paused && !mediaEl.ended,
            currentTime: Math.round(mediaEl.currentTime),
            duration: Math.round(mediaEl.duration || 0),
            muted: mediaEl.muted,
          }
        : undefined,
    };
  }

  private static registerElement(el: HTMLElement): string {
    const id = `mj_el_${this.elementIdCounter++}`;
    el.dataset.mjId = id;
    this.elementMap.set(id, el);
    return id;
  }

  private static isElementVisible(el: HTMLElement, rect: DOMRect): boolean {
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
      return false;
    }
    return true;
  }
}
