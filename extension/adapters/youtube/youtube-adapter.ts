/**
 * YouTube-specific DOM heuristics and interaction adapter
 */

export class YouTubeAdapter {
  public static isYouTube(hostname: string): boolean {
    return hostname.includes('youtube.com') || hostname.includes('youtu.be');
  }

  /**
   * Identifies search box on YouTube
   */
  public static getSearchInput(): HTMLInputElement | null {
    return (
      (document.querySelector('input#search') as HTMLInputElement) ||
      (document.querySelector('input[name="search_query"]') as HTMLInputElement) ||
      (document.querySelector('yt-searchbox input') as HTMLInputElement)
    );
  }

  /**
   * Submits YouTube search
   */
  public static submitSearch(query: string): boolean {
    const input = this.getSearchInput();
    if (!input) return false;

    input.focus();
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Try clicking search button or pressing enter
    const searchBtn =
      (document.querySelector('button#search-icon-legacy') as HTMLElement) ||
      (document.querySelector('yt-searchbox button[aria-label="Search"]') as HTMLElement);

    if (searchBtn) {
      searchBtn.click();
      return true;
    }

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    return true;
  }

  /**
   * Finds YouTube main HTML5 video element
   */
  public static getVideoElement(): HTMLVideoElement | null {
    return document.querySelector('video.html5-main-video') as HTMLVideoElement;
  }

  /**
   * YouTube media controls
   */
  public static controlMedia(action: string, seconds?: number): { success: boolean; message: string } {
    const video = this.getVideoElement();
    if (!video) {
      return { success: false, message: 'No active YouTube video player found on current page.' };
    }

    switch (action) {
      case 'play':
        video.play();
        return { success: true, message: 'Playing video' };
      case 'pause':
        video.pause();
        return { success: true, message: 'Paused video' };
      case 'toggle':
        if (video.paused) {
          video.play();
          return { success: true, message: 'Playing video' };
        } else {
          video.pause();
          return { success: true, message: 'Paused video' };
        }
      case 'seek_forward':
        video.currentTime += seconds || 10;
        return { success: true, message: `Fast forwarded ${seconds || 10} seconds` };
      case 'seek_backward':
        video.currentTime = Math.max(0, video.currentTime - (seconds || 10));
        return { success: true, message: `Rewound ${seconds || 10} seconds` };
      case 'mute':
        video.muted = true;
        return { success: true, message: 'Muted video' };
      case 'unmute':
        video.muted = false;
        return { success: true, message: 'Unmuted video' };
      default:
        return { success: false, message: `Unknown media action: ${action}` };
    }
  }

  /**
   * Identifies video cards on YouTube search or feed
   */
  public static extractVideoItems(): Array<{
    element: HTMLElement;
    title: string;
    channelName?: string;
    isChannel: boolean;
  }> {
    const results: Array<{ element: HTMLElement; title: string; channelName?: string; isChannel: boolean }> = [];

    // Search results video cards
    const videoCards = document.querySelectorAll(
      'ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer'
    );

    videoCards.forEach((card) => {
      const titleEl = (card.querySelector('#video-title') ||
        card.querySelector('a#video-title-link') ||
        card.querySelector('h3 a')) as HTMLElement;

      const channelEl = card.querySelector('#channel-name, ytd-channel-name') as HTMLElement;

      if (titleEl && titleEl.innerText.trim()) {
        results.push({
          element: titleEl,
          title: titleEl.innerText.trim(),
          channelName: channelEl?.innerText?.trim(),
          isChannel: false,
        });
      }
    });

    // Channel renderer items
    const channelCards = document.querySelectorAll('ytd-channel-renderer');
    channelCards.forEach((card) => {
      const nameEl = (card.querySelector('#channel-title, #text, a.channel-link') || card) as HTMLElement;
      if (nameEl && nameEl.innerText.trim()) {
        results.push({
          element: nameEl,
          title: nameEl.innerText.trim(),
          isChannel: true,
        });
      }
    });

    return results;
  }
}
