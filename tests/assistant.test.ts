/**
 * Unit & Integration Tests for MJ Audio, Memory, Tools, and System Prompt
 */

import assert from 'node:assert';
import test from 'node:test';
import {
  base64ToPCM16,
  floatToPCM16,
  pcm16ToBase64,
  pcm16ToFloat,
  resampleAudioBuffer,
} from '../src/audio/audioUtils';
import { TOOL_DEFINITIONS } from '../src/tools/ToolRegistry';
import { getMJSystemPrompt } from '../src/ai/systemPrompt';
import { MemoryManager } from '../src/memory/MemoryManager';

test('Audio Utils: Float32 <-> PCM16 conversions', () => {
  const inputFloat = new Float32Array([0.0, 0.5, -0.5, 1.0, -1.0]);
  const pcm16 = floatToPCM16(inputFloat);

  assert.strictEqual(pcm16.length, inputFloat.length);
  assert.strictEqual(pcm16[0], 0);
  assert(pcm16[1] > 16000 && pcm16[1] < 17000);
  assert(pcm16[2] < -16000 && pcm16[2] > -17000);

  const convertedBack = pcm16ToFloat(pcm16);
  assert.strictEqual(convertedBack.length, inputFloat.length);
  assert(Math.abs(convertedBack[1] - 0.5) < 0.01);
});

test('Audio Utils: Base64 encoding and decoding of PCM16 buffer', () => {
  const pcm16 = new Int16Array([100, 200, -300, 400, -500]);
  const base64 = pcm16ToBase64(pcm16);
  assert.strictEqual(typeof base64, 'string');
  assert(base64.length > 0);

  const decoded = base64ToPCM16(base64);
  assert.strictEqual(decoded.length, pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    assert.strictEqual(decoded[i], pcm16[i]);
  }
});

test('Audio Utils: Resample Audio Buffer from 48kHz to 16kHz', () => {
  const input = new Float32Array(480);
  for (let i = 0; i < input.length; i++) {
    input[i] = Math.sin((i / 480) * Math.PI * 2);
  }
  const resampled = resampleAudioBuffer(input, 48000, 16000);
  assert.strictEqual(resampled.length, 160);
});

test('Tool Registry: All registered tools have valid schemas and permission levels', () => {
  assert(TOOL_DEFINITIONS.length >= 8);

  const openWebsite = TOOL_DEFINITIONS.find((t) => t.name === 'openWebsite');
  assert(openWebsite, 'openWebsite tool exists');
  assert.strictEqual(openWebsite.permissionLevel, 'safe');
  assert(openWebsite.parameters.required?.includes('url'));

  const draftEmail = TOOL_DEFINITIONS.find((t) => t.name === 'draftEmail');
  assert(draftEmail, 'draftEmail tool exists');
  assert.strictEqual(draftEmail.permissionLevel, 'sensitive');

  const manageReminders = TOOL_DEFINITIONS.find((t) => t.name === 'manageReminders');
  assert(manageReminders, 'manageReminders tool exists');
});

test('System Prompt: Incorporates MJ identity, bilingual directives, and personality', () => {
  const promptWitty = getMJSystemPrompt('witty');
  assert(promptWitty.includes('You are MJ'));
  assert(promptWitty.includes('English, Urdu'));
  assert(promptWitty.includes('WITTY'));

  const promptTeacher = getMJSystemPrompt('teacher');
  assert(promptTeacher.includes('TEACHER'));
});

test('MemoryManager: Store, retrieve, forget, and productivity data', () => {
  const mm = MemoryManager.getInstance();

  // Test remembering
  mm.remember('test_pref', 'Test Value 123', 'preference');
  const retrieved = mm.retrieve('test_pref');
  assert(retrieved.length > 0);
  assert.strictEqual(retrieved[0].value, 'Test Value 123');

  // Test forget
  const forgotten = mm.forget('test_pref');
  assert.strictEqual(forgotten, true);

  // Test reminders
  const rem = mm.addReminder('Work on AI', '8:00 PM');
  assert.strictEqual(rem.text, 'Work on AI');
  assert.strictEqual(rem.timeStr, '8:00 PM');
  assert(mm.listReminders().some((r: any) => r.text === 'Work on AI'));

  // Test todos
  const todo = mm.addTodo('Test suite coverage');
  assert.strictEqual(todo.completed, false);
  mm.toggleTodo(todo.id);
  assert.strictEqual(mm.listTodos().find((t: any) => t.id === todo.id)?.completed, true);
});

test('Tool Response Validation: functionResponses must contain id, name, and response', () => {
  const formatToolResponse = (id: string, name: string, response: any) => {
    const toolResult =
      typeof response === 'object' && response !== null
        ? { ...response, output: response }
        : { output: response };
    return {
      id,
      name,
      response: toolResult,
    };
  };

  const sampleResponse = formatToolResponse('call_xyz', 'openWebsite', { success: true, url: 'https://youtube.com' });
  assert.strictEqual(sampleResponse.id, 'call_xyz');
  assert.strictEqual(sampleResponse.name, 'openWebsite');
  assert(sampleResponse.response !== null && typeof sampleResponse.response === 'object');
  assert.strictEqual(sampleResponse.response.url, 'https://youtube.com');
  assert.strictEqual(sampleResponse.response.success, true);
  assert('name' in sampleResponse);
  assert('response' in sampleResponse);
  assert('id' in sampleResponse);
});
