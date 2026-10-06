/**
 * Content Script for MJ Chrome Extension MV3
 * Coordinates page inspection, action execution, and acts as communication bridge on the MJ App.
 */

import { DOMInspector } from './dom-inspector';
import { ActionExecutor } from './action-executor';
import { PageObserver } from './page-observer';
import { BRIDGE_CHANNELS, BridgeRequestMessage } from '../bridge/message-types';

PageObserver.start();

// 1. Listen for background service worker commands
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    handleContentCommand(request)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message || String(err) }));
    return true; // Keep message channel open for async response
  });
}

async function handleContentCommand(request: any): Promise<any> {
  const { command, payload } = request;

  switch (command) {
    case 'INSPECT_PAGE':
      return DOMInspector.inspectPage();

    case 'CLICK_ELEMENT':
      return ActionExecutor.clickElement(payload.elementId);

    case 'SCROLL':
      return ActionExecutor.scroll(payload.direction, payload.amount);

    case 'TYPE_TEXT':
      return ActionExecutor.typeText(
        payload.elementId,
        payload.text,
        payload.pressEnter,
        payload.clearFirst
      );

    case 'MEDIA_CONTROL':
      return ActionExecutor.mediaControl(payload.action, payload.seconds);

    case 'WAIT_FOR_ELEMENT':
      return PageObserver.waitForElement(payload.selector, payload.timeoutMs);

    default:
      throw new Error(`Unknown content command: ${command}`);
  }
}

// 2. Web App Bridge: If this content script is running on the MJ App page, bridge window messages
window.addEventListener('message', (event) => {
  // Security check: only accept messages from current origin
  if (event.source !== window) return;

  const data = event.data as BridgeRequestMessage;
  if (!data || data.channel !== BRIDGE_CHANNELS.APP_TO_EXT) return;

  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    window.postMessage(
      {
        channel: BRIDGE_CHANNELS.EXT_TO_APP,
        requestId: data.requestId,
        command: data.command,
        success: false,
        error: 'Chrome extension runtime is not available.',
        timestamp: Date.now(),
      },
      '*'
    );
    return;
  }

  // Forward command to service worker
  chrome.runtime.sendMessage(data, (response) => {
    const error = chrome.runtime.lastError ? chrome.runtime.lastError.message : undefined;
    window.postMessage(
      {
        channel: BRIDGE_CHANNELS.EXT_TO_APP,
        requestId: data.requestId,
        command: data.command,
        success: !error && (response?.success ?? true),
        data: response?.data,
        error: error || response?.error,
        timestamp: Date.now(),
      },
      '*'
    );
  });
});
