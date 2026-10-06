/**
 * Generic DOM adapter for standard websites (Google, GitHub, Wikipedia, etc.)
 */

export class GenericAdapter {
  public static findSearchInput(): HTMLInputElement | null {
    // Look for common search input selectors
    const selectors = [
      'input[type="search"]',
      'input[name="q"]',
      'input[name="query"]',
      'input[name="search"]',
      'input[placeholder*="search" i]',
      'input[placeholder*="find" i]',
      'input[aria-label*="search" i]',
      'input[role="searchbox"]',
      'textarea[name="q"]',
      '#search input',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel) as HTMLInputElement;
      if (el && el.offsetParent !== null) {
        return el;
      }
    }
    return null;
  }

  public static controlMedia(action: string, seconds?: number): { success: boolean; message: string } {
    const media = (document.querySelector('video') || document.querySelector('audio')) as HTMLMediaElement;
    if (!media) {
      return { success: false, message: 'No media player found on page' };
    }

    switch (action) {
      case 'play':
        media.play();
        return { success: true, message: 'Media playing' };
      case 'pause':
        media.pause();
        return { success: true, message: 'Media paused' };
      case 'toggle':
        if (media.paused) {
          media.play();
          return { success: true, message: 'Media playing' };
        } else {
          media.pause();
          return { success: true, message: 'Media paused' };
        }
      case 'seek_forward':
        media.currentTime += seconds || 10;
        return { success: true, message: `Fast forwarded ${seconds || 10}s` };
      case 'seek_backward':
        media.currentTime = Math.max(0, media.currentTime - (seconds || 10));
        return { success: true, message: `Rewound ${seconds || 10}s` };
      default:
        return { success: false, message: `Unknown media command: ${action}` };
    }
  }
}
