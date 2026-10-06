/**
 * Background Service Worker for MJ Chrome Extension MV3
 * Handles tab management, navigation, and routes page-level DOM commands to active tab content scripts.
 */

import { BridgeRequestMessage } from '../bridge/message-types';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[MJ Extension] Background Service Worker installed');
});

chrome.runtime.onMessage.addListener((message: BridgeRequestMessage, sender, sendResponse) => {
  handleExtensionMessage(message, sender)
    .then((data) => sendResponse({ success: true, data }))
    .catch((err) => sendResponse({ success: false, error: err.message || String(err) }));
  return true; // Keep response channel open for async execution
});

async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) {
    const allTabs = await chrome.tabs.query({ currentWindow: true });
    if (allTabs.length > 0) return allTabs[0];
    throw new Error('No active browser tab found.');
  }
  return tabs[0];
}

async function handleExtensionMessage(msg: BridgeRequestMessage, sender: chrome.runtime.MessageSender): Promise<any> {
  const { command, payload } = msg;

  switch (command) {
    case 'PING': {
      const activeTab = await getActiveTab().catch(() => null);
      return {
        status: 'ok',
        extensionVersion: '1.0.0',
        activeTab: activeTab
          ? {
              id: activeTab.id,
              url: activeTab.url,
              title: activeTab.title,
            }
          : null,
      };
    }

    case 'GET_ACTIVE_TAB': {
      const tab = await getActiveTab();
      return {
        id: tab.id,
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
      };
    }

    case 'GET_TABS': {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      return tabs.map((t) => ({
        id: t.id,
        url: t.url,
        title: t.title,
        active: t.active,
      }));
    }

    case 'SWITCH_TAB': {
      if (!payload?.tabId) throw new Error('tabId is required to switch tab');
      await chrome.tabs.update(payload.tabId, { active: true });
      return { switched: true, tabId: payload.tabId };
    }

    case 'OPEN_URL': {
      const url = payload?.url;
      if (!url) throw new Error('url is required to open tab');
      const newTab = await chrome.tabs.create({ url, active: true });
      return {
        id: newTab.id,
        url: newTab.url,
        title: newTab.title,
      };
    }

    case 'NAVIGATE': {
      const targetTab = payload?.tabId ? await chrome.tabs.get(payload.tabId) : await getActiveTab();
      if (!targetTab.id) throw new Error('Tab not found');
      await chrome.tabs.update(targetTab.id, { url: payload.url });
      return { navigated: true, url: payload.url };
    }

    case 'GO_BACK': {
      const targetTab = payload?.tabId ? await chrome.tabs.get(payload.tabId) : await getActiveTab();
      if (!targetTab.id) throw new Error('Tab not found');
      await chrome.tabs.goBack(targetTab.id);
      return { success: true, action: 'goBack' };
    }

    case 'GO_FORWARD': {
      const targetTab = payload?.tabId ? await chrome.tabs.get(payload.tabId) : await getActiveTab();
      if (!targetTab.id) throw new Error('Tab not found');
      await chrome.tabs.goForward(targetTab.id);
      return { success: true, action: 'goForward' };
    }

    case 'RELOAD': {
      const targetTab = payload?.tabId ? await chrome.tabs.get(payload.tabId) : await getActiveTab();
      if (!targetTab.id) throw new Error('Tab not found');
      await chrome.tabs.reload(targetTab.id);
      return { success: true, action: 'reload' };
    }

    case 'CLOSE_TAB': {
      const targetTab = payload?.tabId ? await chrome.tabs.get(payload.tabId) : await getActiveTab();
      if (!targetTab.id) throw new Error('Tab not found');
      await chrome.tabs.remove(targetTab.id);
      return { success: true, action: 'closeTab' };
    }

    // Page-level DOM actions routed to content script on active or target tab
    case 'INSPECT_PAGE':
    case 'CLICK_ELEMENT':
    case 'SCROLL':
    case 'TYPE_TEXT':
    case 'MEDIA_CONTROL':
    case 'WAIT_FOR_ELEMENT': {
      let targetTabId = payload?.tabId;
      if (!targetTabId) {
        // If sender is an app tab, determine the last active controlled tab or current active tab
        const activeTab = await getActiveTab();
        targetTabId = activeTab.id;
      }

      if (!targetTabId) throw new Error('No target tab available to execute page command.');

      // Send to content script on target tab
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(targetTabId, { command, payload }, (response: any) => {
          const err = chrome.runtime.lastError;
          if (err) {
            reject(new Error(`Failed to communicate with tab ${targetTabId}: ${err.message}`));
          } else if (response && response.success === false) {
            reject(new Error(response.error || 'Content action failed'));
          } else {
            resolve(response?.data);
          }
        });
      });
    }

    default:
      throw new Error(`Unhandled service worker command: ${command}`);
  }
}
