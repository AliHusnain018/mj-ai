/**
 * Bridge Protocol helpers, validation, and serialization
 */

import { BridgeCommandType, BridgeRequestMessage, BridgeResponseMessage, BRIDGE_CHANNELS } from './message-types';

export function createBridgeRequest(
  command: BridgeCommandType,
  payload?: any,
  tabId?: number
): BridgeRequestMessage {
  return {
    channel: BRIDGE_CHANNELS.APP_TO_EXT,
    requestId: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    command,
    tabId,
    payload,
    timestamp: Date.now(),
  };
}

export function createBridgeResponse(
  requestId: string,
  command: BridgeCommandType,
  success: boolean,
  data?: any,
  error?: string
): BridgeResponseMessage {
  return {
    channel: BRIDGE_CHANNELS.EXT_TO_APP,
    requestId,
    command,
    success,
    data,
    error,
    timestamp: Date.now(),
  };
}

export function isBridgeRequest(msg: any): msg is BridgeRequestMessage {
  return (
    msg &&
    typeof msg === 'object' &&
    msg.channel === BRIDGE_CHANNELS.APP_TO_EXT &&
    typeof msg.requestId === 'string' &&
    typeof msg.command === 'string'
  );
}

export function isBridgeResponse(msg: any): msg is BridgeResponseMessage {
  return (
    msg &&
    typeof msg === 'object' &&
    msg.channel === BRIDGE_CHANNELS.EXT_TO_APP &&
    typeof msg.requestId === 'string' &&
    typeof msg.success === 'boolean'
  );
}
