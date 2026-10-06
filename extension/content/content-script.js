(() => {
  // extension/adapters/youtube/youtube-adapter.ts
  var YouTubeAdapter = class {
    static isYouTube(hostname) {
      return hostname.includes("youtube.com") || hostname.includes("youtu.be");
    }
    /**
     * Identifies search box on YouTube
     */
    static getSearchInput() {
      return document.querySelector("input#search") || document.querySelector('input[name="search_query"]') || document.querySelector("yt-searchbox input");
    }
    /**
     * Submits YouTube search
     */
    static submitSearch(query) {
      const input = this.getSearchInput();
      if (!input) return false;
      input.focus();
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      const searchBtn = document.querySelector("button#search-icon-legacy") || document.querySelector('yt-searchbox button[aria-label="Search"]');
      if (searchBtn) {
        searchBtn.click();
        return true;
      }
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
      return true;
    }
    /**
     * Finds YouTube main HTML5 video element
     */
    static getVideoElement() {
      return document.querySelector("video.html5-main-video");
    }
    /**
     * YouTube media controls
     */
    static controlMedia(action, seconds) {
      const video = this.getVideoElement();
      if (!video) {
        return { success: false, message: "No active YouTube video player found on current page." };
      }
      switch (action) {
        case "play":
          video.play();
          return { success: true, message: "Playing video" };
        case "pause":
          video.pause();
          return { success: true, message: "Paused video" };
        case "toggle":
          if (video.paused) {
            video.play();
            return { success: true, message: "Playing video" };
          } else {
            video.pause();
            return { success: true, message: "Paused video" };
          }
        case "seek_forward":
          video.currentTime += seconds || 10;
          return { success: true, message: `Fast forwarded ${seconds || 10} seconds` };
        case "seek_backward":
          video.currentTime = Math.max(0, video.currentTime - (seconds || 10));
          return { success: true, message: `Rewound ${seconds || 10} seconds` };
        case "mute":
          video.muted = true;
          return { success: true, message: "Muted video" };
        case "unmute":
          video.muted = false;
          return { success: true, message: "Unmuted video" };
        default:
          return { success: false, message: `Unknown media action: ${action}` };
      }
    }
    /**
     * Identifies video cards on YouTube search or feed
     */
    static extractVideoItems() {
      const results = [];
      const videoCards = document.querySelectorAll(
        "ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer"
      );
      videoCards.forEach((card) => {
        const titleEl = card.querySelector("#video-title") || card.querySelector("a#video-title-link") || card.querySelector("h3 a");
        const channelEl = card.querySelector("#channel-name, ytd-channel-name");
        if (titleEl && titleEl.innerText.trim()) {
          results.push({
            element: titleEl,
            title: titleEl.innerText.trim(),
            channelName: channelEl?.innerText?.trim(),
            isChannel: false
          });
        }
      });
      const channelCards = document.querySelectorAll("ytd-channel-renderer");
      channelCards.forEach((card) => {
        const nameEl = card.querySelector("#channel-title, #text, a.channel-link") || card;
        if (nameEl && nameEl.innerText.trim()) {
          results.push({
            element: nameEl,
            title: nameEl.innerText.trim(),
            isChannel: true
          });
        }
      });
      return results;
    }
  };

  // extension/content/dom-inspector.ts
  var DOMInspector = class {
    static {
      this.elementIdCounter = 1;
    }
    static {
      this.elementMap = /* @__PURE__ */ new Map();
    }
    static getElementById(id) {
      return this.elementMap.get(id);
    }
    static inspectPage() {
      this.elementMap.clear();
      this.elementIdCounter = 1;
      const hostname = window.location.hostname;
      const isYT = YouTubeAdapter.isYouTube(hostname);
      const viewport = {
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
        )
      };
      const elements = [];
      if (isYT) {
        const ytItems = YouTubeAdapter.extractVideoItems();
        ytItems.slice(0, 40).forEach((item) => {
          const id = this.registerElement(item.element);
          const rect = item.element.getBoundingClientRect();
          elements.push({
            id,
            tagName: item.element.tagName.toLowerCase(),
            text: item.title,
            elementType: item.isChannel ? "channel" : "video",
            visible: this.isElementVisible(item.element, rect),
            isChannel: item.isChannel,
            isVideo: !item.isChannel,
            badge: item.channelName ? `by ${item.channelName}` : void 0,
            rect: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            },
            href: item.element.href
          });
        });
      }
      const interactiveSelectors = [
        "button",
        "a[href]",
        'input:not([type="hidden"])',
        "textarea",
        "select",
        '[role="button"]',
        '[role="link"]',
        '[role="tab"]',
        '[role="menuitem"]',
        '[role="searchbox"]',
        "video",
        "audio",
        '[contenteditable="true"]'
      ];
      const candidates = Array.from(document.querySelectorAll(interactiveSelectors.join(", ")));
      for (const el of candidates) {
        if (elements.length >= 100) break;
        if (el.dataset.mjId && this.elementMap.has(el.dataset.mjId)) {
          continue;
        }
        const rect = el.getBoundingClientRect();
        const isVis = this.isElementVisible(el, rect);
        if (!isVis) continue;
        const tagName = el.tagName.toLowerCase();
        let text = el.innerText?.trim() || "";
        if (!text && el instanceof HTMLInputElement) {
          text = el.value || el.placeholder || "";
        }
        const ariaLabel = el.getAttribute("aria-label") || void 0;
        const title = el.getAttribute("title") || void 0;
        const role = el.getAttribute("role") || void 0;
        const href = el.href || void 0;
        if (!text && !ariaLabel && !title && tagName !== "input" && tagName !== "video" && tagName !== "audio") {
          continue;
        }
        const id = this.registerElement(el);
        let elementType = "button";
        if (tagName === "a" || role === "link") elementType = "link";
        else if (tagName === "input" || tagName === "textarea") elementType = "input";
        else if (tagName === "video") elementType = "video";
        else if (role === "tab") elementType = "tab";
        else if (role === "menuitem") elementType = "menu";
        elements.push({
          id,
          tagName,
          role,
          text: text ? text.substring(0, 100) : void 0,
          ariaLabel: ariaLabel ? ariaLabel.substring(0, 80) : void 0,
          title: title ? title.substring(0, 80) : void 0,
          href,
          placeholder: el.placeholder || void 0,
          visible: true,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          elementType
        });
      }
      const mediaEl = document.querySelector("video") || document.querySelector("audio");
      return {
        url: window.location.href,
        title: document.title,
        hostname: window.location.hostname,
        loading: document.readyState !== "complete",
        viewport,
        elements,
        mediaState: mediaEl ? {
          hasMedia: true,
          isPlaying: !mediaEl.paused && !mediaEl.ended,
          currentTime: Math.round(mediaEl.currentTime),
          duration: Math.round(mediaEl.duration || 0),
          muted: mediaEl.muted
        } : void 0
      };
    }
    static registerElement(el) {
      const id = `mj_el_${this.elementIdCounter++}`;
      el.dataset.mjId = id;
      this.elementMap.set(id, el);
      return id;
    }
    static isElementVisible(el, rect) {
      if (rect.width <= 0 || rect.height <= 0) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) === 0) {
        return false;
      }
      return true;
    }
  };

  // extension/adapters/generic/generic-adapter.ts
  var GenericAdapter = class {
    static findSearchInput() {
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
        "#search input"
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) {
          return el;
        }
      }
      return null;
    }
    static controlMedia(action, seconds) {
      const media = document.querySelector("video") || document.querySelector("audio");
      if (!media) {
        return { success: false, message: "No media player found on page" };
      }
      switch (action) {
        case "play":
          media.play();
          return { success: true, message: "Media playing" };
        case "pause":
          media.pause();
          return { success: true, message: "Media paused" };
        case "toggle":
          if (media.paused) {
            media.play();
            return { success: true, message: "Media playing" };
          } else {
            media.pause();
            return { success: true, message: "Media paused" };
          }
        case "seek_forward":
          media.currentTime += seconds || 10;
          return { success: true, message: `Fast forwarded ${seconds || 10}s` };
        case "seek_backward":
          media.currentTime = Math.max(0, media.currentTime - (seconds || 10));
          return { success: true, message: `Rewound ${seconds || 10}s` };
        default:
          return { success: false, message: `Unknown media command: ${action}` };
      }
    }
  };

  // extension/content/action-executor.ts
  var ActionExecutor = class {
    static async clickElement(elementId) {
      const el = DOMInspector.getElementById(elementId);
      if (!el) {
        return { success: false, error: `Element with id ${elementId} was not found on current page.` };
      }
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        await new Promise((r) => setTimeout(r, 150));
        const rect = el.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        const eventOpts = {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX,
          clientY
        };
        el.dispatchEvent(new PointerEvent("pointerdown", eventOpts));
        el.dispatchEvent(new MouseEvent("mousedown", eventOpts));
        el.dispatchEvent(new PointerEvent("pointerup", eventOpts));
        el.dispatchEvent(new MouseEvent("mouseup", eventOpts));
        el.click();
        await new Promise((r) => setTimeout(r, 200));
        return {
          success: true,
          urlAfter: window.location.href
        };
      } catch (err) {
        return {
          success: false,
          error: `Click failed: ${err.message || err}`
        };
      }
    }
    static async scroll(direction, amount = "medium") {
      const viewportHeight = window.innerHeight;
      let pixels = 0;
      if (typeof amount === "number") {
        pixels = amount;
      } else {
        switch (amount) {
          case "small":
            pixels = Math.round(viewportHeight * 0.35);
            break;
          case "medium":
            pixels = Math.round(viewportHeight * 0.75);
            break;
          case "large":
            pixels = Math.round(viewportHeight * 1.5);
            break;
        }
      }
      if (direction === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (direction === "bottom") {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      } else if (direction === "up") {
        window.scrollBy({ top: -pixels, behavior: "smooth" });
      } else {
        window.scrollBy({ top: pixels, behavior: "smooth" });
      }
      await new Promise((r) => setTimeout(r, 250));
      return {
        success: true,
        newScrollY: window.scrollY || window.pageYOffset
      };
    }
    static async typeText(elementId, text = "", pressEnter = false, clearFirst = false) {
      let inputEl = null;
      if (elementId) {
        inputEl = DOMInspector.getElementById(elementId) || null;
      }
      if (!inputEl) {
        if (YouTubeAdapter.isYouTube(window.location.hostname)) {
          inputEl = YouTubeAdapter.getSearchInput();
        } else {
          inputEl = GenericAdapter.findSearchInput();
        }
      }
      if (!inputEl) {
        return { success: false, error: "Could not find a valid input element to type into." };
      }
      try {
        inputEl.focus();
        if (inputEl instanceof HTMLInputElement || inputEl instanceof HTMLTextAreaElement) {
          if (clearFirst) {
            inputEl.value = "";
          }
          inputEl.value = inputEl.value + text;
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
          inputEl.dispatchEvent(new Event("change", { bubbles: true }));
          if (pressEnter) {
            if (YouTubeAdapter.isYouTube(window.location.hostname)) {
              YouTubeAdapter.submitSearch(inputEl.value);
            } else {
              inputEl.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true })
              );
              inputEl.dispatchEvent(
                new KeyboardEvent("keypress", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true })
              );
              inputEl.dispatchEvent(
                new KeyboardEvent("keyup", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true })
              );
            }
          }
          return {
            success: true,
            valueAfter: inputEl.value
          };
        } else {
          inputEl.innerText = text;
          return { success: true, valueAfter: inputEl.innerText };
        }
      } catch (err) {
        return { success: false, error: `Type failed: ${err.message || err}` };
      }
    }
    static mediaControl(action, seconds) {
      if (YouTubeAdapter.isYouTube(window.location.hostname)) {
        return YouTubeAdapter.controlMedia(action, seconds);
      }
      return GenericAdapter.controlMedia(action, seconds);
    }
  };

  // extension/content/page-observer.ts
  var PageObserver = class {
    static {
      this.observer = null;
    }
    static {
      this.mutationCount = 0;
    }
    static {
      this.lastUrl = window.location.href;
    }
    static start() {
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
        attributes: false
      });
    }
    static stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
    static async waitForElement(selector, timeoutMs = 5e3) {
      const existing = document.querySelector(selector);
      if (existing) return existing;
      const start = Date.now();
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const el = document.querySelector(selector);
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
    static getMutationCount() {
      return this.mutationCount;
    }
  };

  // extension/bridge/message-types.ts
  var BRIDGE_CHANNELS = {
    APP_TO_EXT: "MJ_BROWSER_BRIDGE_APP_REQUEST",
    EXT_TO_APP: "MJ_BROWSER_BRIDGE_EXT_RESPONSE",
    HEARTBEAT_PING: "MJ_BRIDGE_PING",
    HEARTBEAT_PONG: "MJ_BRIDGE_PONG"
  };

  // extension/content/content-script.ts
  PageObserver.start();
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      handleContentCommand(request).then((data) => sendResponse({ success: true, data })).catch((err) => sendResponse({ success: false, error: err.message || String(err) }));
      return true;
    });
  }
  async function handleContentCommand(request) {
    const { command, payload } = request;
    switch (command) {
      case "INSPECT_PAGE":
        return DOMInspector.inspectPage();
      case "CLICK_ELEMENT":
        return ActionExecutor.clickElement(payload.elementId);
      case "SCROLL":
        return ActionExecutor.scroll(payload.direction, payload.amount);
      case "TYPE_TEXT":
        return ActionExecutor.typeText(
          payload.elementId,
          payload.text,
          payload.pressEnter,
          payload.clearFirst
        );
      case "MEDIA_CONTROL":
        return ActionExecutor.mediaControl(payload.action, payload.seconds);
      case "WAIT_FOR_ELEMENT":
        return PageObserver.waitForElement(payload.selector, payload.timeoutMs);
      default:
        throw new Error(`Unknown content command: ${command}`);
    }
  }
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.channel !== BRIDGE_CHANNELS.APP_TO_EXT) return;
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
      window.postMessage(
        {
          channel: BRIDGE_CHANNELS.EXT_TO_APP,
          requestId: data.requestId,
          command: data.command,
          success: false,
          error: "Chrome extension runtime is not available.",
          timestamp: Date.now()
        },
        "*"
      );
      return;
    }
    chrome.runtime.sendMessage(data, (response) => {
      const error = chrome.runtime.lastError ? chrome.runtime.lastError.message : void 0;
      window.postMessage(
        {
          channel: BRIDGE_CHANNELS.EXT_TO_APP,
          requestId: data.requestId,
          command: data.command,
          success: !error && (response?.success ?? true),
          data: response?.data,
          error: error || response?.error,
          timestamp: Date.now()
        },
        "*"
      );
    });
  });
})();
