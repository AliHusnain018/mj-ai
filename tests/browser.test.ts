/**
 * Unit and integration tests for MJ Live Browser & Website Control Engine
 */

import test from 'node:test';
import assert from 'node:assert';
import { ElementResolver } from '../src/browser/ElementResolver';
import { TargetMemory } from '../src/browser/TargetMemory';
import { ActionVerifier } from '../src/browser/ActionVerifier';
import { PageElement, PageState } from '../src/browser/BrowserTypes';
import {
  createBridgeRequest,
  createBridgeResponse,
  isBridgeRequest,
  isBridgeResponse,
} from '../extension/bridge/protocol';

test('ElementResolver: Resolves English and Urdu ordinals accurately', () => {
  const elements: PageElement[] = [
    {
      id: 'mj_el_1',
      tagName: 'a',
      text: 'Python Tutorial 1 - Beginner Basics',
      elementType: 'video',
      isVideo: true,
      visible: true,
    },
    {
      id: 'mj_el_2',
      tagName: 'a',
      text: 'Python Tutorial 2 - Data Structures',
      elementType: 'video',
      isVideo: true,
      visible: true,
    },
    {
      id: 'mj_el_3',
      tagName: 'a',
      text: 'Python Tutorial 3 - Web Scraping',
      elementType: 'video',
      isVideo: true,
      visible: true,
    },
  ];

  // English "first video"
  const res1 = ElementResolver.resolve({ description: 'first video' }, elements);
  assert.strictEqual(res1.bestMatch?.id, 'mj_el_1');
  assert(res1.confidence >= 0.9);

  // Urdu "pehli video"
  const resUrdu1 = ElementResolver.resolve({ description: 'pehli video kholo' }, elements);
  assert.strictEqual(resUrdu1.bestMatch?.id, 'mj_el_1');

  // English "second video"
  const res2 = ElementResolver.resolve({ description: 'second video' }, elements);
  assert.strictEqual(res2.bestMatch?.id, 'mj_el_2');

  // Urdu "doosri video"
  const resUrdu2 = ElementResolver.resolve({ description: 'doosri video open karo' }, elements);
  assert.strictEqual(resUrdu2.bestMatch?.id, 'mj_el_2');

  // Urdu "teesri video"
  const resUrdu3 = ElementResolver.resolve({ description: 'teesri video chalao' }, elements);
  assert.strictEqual(resUrdu3.bestMatch?.id, 'mj_el_3');

  // English "last video" / Urdu "aakhri video"
  const resLast = ElementResolver.resolve({ description: 'aakhri video' }, elements);
  assert.strictEqual(resLast.bestMatch?.id, 'mj_el_3');
});

test('ElementResolver: Distinguishes channels vs videos correctly', () => {
  const elements: PageElement[] = [
    {
      id: 'video_1',
      tagName: 'a',
      text: 'Harvard CS50 Full Course',
      elementType: 'video',
      isVideo: true,
      visible: true,
    },
    {
      id: 'channel_1',
      tagName: 'a',
      text: 'Harvard CS50 Official Channel',
      elementType: 'channel',
      isChannel: true,
      visible: true,
    },
  ];

  const channelQuery = ElementResolver.resolve({ description: 'Harvard CS50 channel' }, elements);
  assert.strictEqual(channelQuery.bestMatch?.id, 'channel_1');

  const videoQuery = ElementResolver.resolve({ description: 'Harvard CS50 video' }, elements);
  assert.strictEqual(videoQuery.bestMatch?.id, 'video_1');
});

test('TargetMemory: Resolves conversational relative pronouns', () => {
  const tm = TargetMemory.getInstance();
  tm.clear();
  tm.notifyNavigation('https://youtube.com/results');

  const channel: PageElement = {
    id: 'chan_freecodecamp',
    tagName: 'a',
    text: 'freeCodeCamp.org',
    elementType: 'channel',
    isChannel: true,
    visible: true,
  };

  const video: PageElement = {
    id: 'vid_python',
    tagName: 'a',
    text: 'Python for Beginners Full Course',
    elementType: 'video',
    isVideo: true,
    visible: true,
  };

  tm.recordTarget(channel, 'click');
  tm.recordTarget(video, 'click');

  assert.strictEqual(tm.getLastReferencedChannel()?.id, 'chan_freecodecamp');
  assert.strictEqual(tm.getLastReferencedVideo()?.id, 'vid_python');

  // Resolve "its channel" / "iska channel"
  const elementsOnPage = [channel, video];
  const resolved = tm.resolveContextualTarget('iska channel kholo', elementsOnPage);
  assert.strictEqual(resolved?.id, 'chan_freecodecamp');

  // Invalidate on domain transition
  tm.notifyNavigation('https://github.com/trending');
  assert.strictEqual(tm.getLastReferencedChannel(), null);
});

test('ActionVerifier: Correctly assesses click, scroll, and type outcomes', () => {
  const mockBeforeState: PageState = {
    url: 'https://youtube.com/results?search_query=python',
    title: 'Python - YouTube',
    hostname: 'youtube.com',
    loading: false,
    viewport: { width: 1920, height: 1080, scrollX: 0, scrollY: 0, documentHeight: 3000, documentWidth: 1920 },
    elements: [],
  };

  const mockAfterState: PageState = {
    url: 'https://youtube.com/watch?v=xyz123',
    title: 'Python Full Course - YouTube',
    hostname: 'youtube.com',
    loading: false,
    viewport: { width: 1920, height: 1080, scrollX: 0, scrollY: 0, documentHeight: 2500, documentWidth: 1920 },
    elements: [],
  };

  const targetEl: PageElement = {
    id: 'vid_1',
    tagName: 'a',
    text: 'Python Full Course',
    elementType: 'video',
    visible: true,
  };

  // Click verification
  const clickOutcome = ActionVerifier.verifyClick(mockBeforeState, mockAfterState, targetEl);
  assert.strictEqual(clickOutcome.passed, true);
  assert(clickOutcome.reason.includes('navigated'));

  // Scroll verification
  const scrollOutcome = ActionVerifier.verifyScroll(0, 650, 'down');
  assert.strictEqual(scrollOutcome.passed, true);
  assert(scrollOutcome.reason.includes('Scrolled down by 650 pixels'));

  // Type verification
  const typeOutcome = ActionVerifier.verifyType('machine learning', 'Search machine learning lectures');
  assert.strictEqual(typeOutcome.passed, true);
});

test('Bridge Protocol: Message factory and validator schemas', () => {
  const req = createBridgeRequest('CLICK_ELEMENT', { elementId: 'mj_el_1' });
  assert.strictEqual(isBridgeRequest(req), true);
  assert.strictEqual(req.command, 'CLICK_ELEMENT');
  assert.strictEqual(req.payload.elementId, 'mj_el_1');

  const res = createBridgeResponse(req.requestId, req.command, true, { clicked: true });
  assert.strictEqual(isBridgeResponse(res), true);
  assert.strictEqual(res.requestId, req.requestId);
  assert.strictEqual(res.success, true);
});
