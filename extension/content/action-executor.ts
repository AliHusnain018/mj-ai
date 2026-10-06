/**
 * Action Executor for MJ Chrome Extension - Executes real DOM actions
 */

import { DOMInspector } from './dom-inspector';
import { YouTubeAdapter } from '../adapters/youtube/youtube-adapter';
import { GenericAdapter } from '../adapters/generic/generic-adapter';

export class ActionExecutor {
  public static async clickElement(elementId: string): Promise<{ success: boolean; error?: string; urlAfter?: string }> {
    const el = DOMInspector.getElementById(elementId);
    if (!el) {
      return { success: false, error: `Element with id ${elementId} was not found on current page.` };
    }

    try {
      // 1. Scroll into view smoothly
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      await new Promise((r) => setTimeout(r, 150));

      // 2. Dispatch pointer & mouse events for maximum framework compatibility (React, Vue, Angular)
      const rect = el.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;

      const eventOpts: MouseEventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX,
        clientY,
      };

      el.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
      el.dispatchEvent(new MouseEvent('mousedown', eventOpts));
      el.dispatchEvent(new PointerEvent('pointerup', eventOpts));
      el.dispatchEvent(new MouseEvent('mouseup', eventOpts));
      el.click();

      await new Promise((r) => setTimeout(r, 200));

      return {
        success: true,
        urlAfter: window.location.href,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Click failed: ${err.message || err}`,
      };
    }
  }

  public static async scroll(
    direction: 'up' | 'down' | 'top' | 'bottom',
    amount: 'small' | 'medium' | 'large' | number = 'medium'
  ): Promise<{ success: boolean; newScrollY: number }> {
    const viewportHeight = window.innerHeight;
    let pixels = 0;

    if (typeof amount === 'number') {
      pixels = amount;
    } else {
      switch (amount) {
        case 'small':
          pixels = Math.round(viewportHeight * 0.35); // ~300px
          break;
        case 'medium':
          pixels = Math.round(viewportHeight * 0.75); // ~650px
          break;
        case 'large':
          pixels = Math.round(viewportHeight * 1.5); // ~1300px
          break;
      }
    }

    if (direction === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (direction === 'bottom') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else if (direction === 'up') {
      window.scrollBy({ top: -pixels, behavior: 'smooth' });
    } else {
      window.scrollBy({ top: pixels, behavior: 'smooth' });
    }

    await new Promise((r) => setTimeout(r, 250));

    return {
      success: true,
      newScrollY: window.scrollY || window.pageYOffset,
    };
  }

  public static async typeText(
    elementId?: string,
    text: string = '',
    pressEnter: boolean = false,
    clearFirst: boolean = false
  ): Promise<{ success: boolean; valueAfter?: string; error?: string }> {
    let inputEl: HTMLElement | null = null;

    if (elementId) {
      inputEl = DOMInspector.getElementById(elementId) || null;
    }

    // Fallbacks if no elementId was provided or if search was requested
    if (!inputEl) {
      if (YouTubeAdapter.isYouTube(window.location.hostname)) {
        inputEl = YouTubeAdapter.getSearchInput();
      } else {
        inputEl = GenericAdapter.findSearchInput();
      }
    }

    if (!inputEl) {
      return { success: false, error: 'Could not find a valid input element to type into.' };
    }

    try {
      inputEl.focus();

      if (inputEl instanceof HTMLInputElement || inputEl instanceof HTMLTextAreaElement) {
        if (clearFirst) {
          inputEl.value = '';
        }
        inputEl.value = inputEl.value + text;

        // Dispatch synthetic events so React/Vue state detects change
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));

        if (pressEnter) {
          if (YouTubeAdapter.isYouTube(window.location.hostname)) {
            YouTubeAdapter.submitSearch(inputEl.value);
          } else {
            inputEl.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })
            );
            inputEl.dispatchEvent(
              new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })
            );
            inputEl.dispatchEvent(
              new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })
            );
          }
        }

        return {
          success: true,
          valueAfter: inputEl.value,
        };
      } else {
        inputEl.innerText = text;
        return { success: true, valueAfter: inputEl.innerText };
      }
    } catch (err: any) {
      return { success: false, error: `Type failed: ${err.message || err}` };
    }
  }

  public static mediaControl(
    action: 'play' | 'pause' | 'toggle' | 'seek_forward' | 'seek_backward' | 'mute' | 'unmute',
    seconds?: number
  ): { success: boolean; message: string } {
    if (YouTubeAdapter.isYouTube(window.location.hostname)) {
      return YouTubeAdapter.controlMedia(action, seconds);
    }
    return GenericAdapter.controlMedia(action, seconds);
  }
}
