/**
 * Message types for Chrome Extension MV3 <-> Web App Bridge
 */

export const BRIDGE_CHANNELS = {
  APP_TO_EXT: 'MJ_BROWSER_BRIDGE_APP_REQUEST',
  EXT_TO_APP: 'MJ_BROWSER_BRIDGE_EXT_RESPONSE',
  HEARTBEAT_PING: 'MJ_BRIDGE_PING',
  HEARTBEAT_PONG: 'MJ_BRIDGE_PONG',
} as const;

export type BridgeCommandType =
  | 'PING'
  | 'GET_ACTIVE_TAB'
  | 'GET_TABS'
  | 'SWITCH_TAB'
  | 'OPEN_URL'
  | 'NAVIGATE'
  | 'GO_BACK'
  | 'GO_FORWARD'
  | 'RELOAD'
  | 'INSPECT_PAGE'
  | 'CLICK_ELEMENT'
  | 'SCROLL'
  | 'TYPE_TEXT'
  | 'MEDIA_CONTROL'
  | 'WAIT_FOR_ELEMENT'
  | 'CLOSE_TAB';

export interface BridgeRequestMessage {
  channel: typeof BRIDGE_CHANNELS.APP_TO_EXT;
  requestId: string;
  command: BridgeCommandType;
  tabId?: number;
  payload?: any;
  timestamp: number;
}

export interface BridgeResponseMessage {
  channel: typeof BRIDGE_CHANNELS.EXT_TO_APP;
  requestId: string;
  command: BridgeCommandType;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}
