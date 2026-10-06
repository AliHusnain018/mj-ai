/**
 * Page Observer for MJ Chrome Extension - Watches for DOM mutations and SPA page changes
 */

export class PageObserver {
  private static observer: MutationObserver | null = null;
  private static mutationCount = 0;
  private static lastUrl = window.location.href;

  public static start(): void {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      this.mutationCount++;
      if (window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href;
      }
    });

    this.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false,
    });
  }

  public static stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  public static async waitForElement(selector: string, timeoutMs: number = 5000): Promise<HTMLElement | null> {
    const existing = document.querySelector(selector) as HTMLElement;
    if (existing) return existing;

    const start = Date.now();
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const el = document.querySelector(selector) as HTMLElement;
        if (el) {
          clearInterval(checkInterval);
          resolve(el);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
    });
  }

  public static getMutationCount(): number {
    return this.mutationCount;
  }
}
