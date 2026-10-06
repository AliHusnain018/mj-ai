/**
 * BrowserTypes - Core types for MJ's Live Browser & Website Control Engine
 */

export type ElementType =
  | 'button'
  | 'link'
  | 'input'
  | 'video'
  | 'channel'
  | 'menu'
  | 'tab'
  | 'media'
  | 'card'
  | 'other';

export interface PageElement {
  id: string; // Stable internal reference ID (e.g. "mj_el_1")
  tagName: string;
  role?: string;
  text?: string;
  ariaLabel?: string;
  title?: string;
  href?: string;
  value?: string;
  placeholder?: string;
  visible: boolean;
  enabled?: boolean;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  selector?: string;
  framePath?: string[];
  elementType: ElementType;
  isChannel?: boolean;
  isVideo?: boolean;
  badge?: string; // e.g. "Live", "Verified", duration "10:45"
}

export interface ViewportState {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  documentHeight: number;
  documentWidth: number;
}

export interface PageState {
  url: string;
  title: string;
  hostname: string;
  loading: boolean;
  viewport: ViewportState;
  elements: PageElement[];
  selectedElementId?: string;
  mediaState?: {
    hasMedia: boolean;
    isPlaying: boolean;
    currentTime?: number;
    duration?: number;
    muted?: boolean;
  };
}

export interface TargetQuery {
  description: string; // e.g. "first Python lecture", "FreeCodeCamp channel", "subscribe button"
  elementId?: string;
  elementType?: ElementType;
  ordinal?: number; // 1 for "first", 2 for "second", -1 for "last"
  exactText?: string;
  role?: string;
}

export type BrowserActionType =
  | 'OPEN_URL'
  | 'GET_ACTIVE_TAB'
  | 'GET_TABS'
  | 'SWITCH_TAB'
  | 'INSPECT_PAGE'
  | 'FIND_ELEMENT'
  | 'CLICK_ELEMENT'
  | 'DOUBLE_CLICK_ELEMENT'
  | 'SCROLL'
  | 'SCROLL_TO_ELEMENT'
  | 'TYPE_TEXT'
  | 'CLEAR_INPUT'
  | 'FOCUS_ELEMENT'
  | 'PRESS_KEY'
  | 'SELECT_OPTION'
  | 'TOGGLE_CONTROL'
  | 'HOVER_ELEMENT'
  | 'PLAY_MEDIA'
  | 'PAUSE_MEDIA'
  | 'SEEK_MEDIA'
  | 'NAVIGATE'
  | 'GO_BACK'
  | 'GO_FORWARD'
  | 'RELOAD'
  | 'WAIT_FOR_ELEMENT'
  | 'WAIT_FOR_NAVIGATION'
  | 'GET_PAGE_STATE'
  | 'CANCEL_TASK';

export interface ScrollParams {
  direction: 'up' | 'down' | 'top' | 'bottom';
  amount?: 'small' | 'medium' | 'large' | number; // 'small' (~300px), 'medium' (~700px), 'large' (~1500px)
  targetElementDescription?: string; // e.g. "comments section", "video description"
}

export interface TypeParams {
  text: string;
  pressEnter?: boolean;
  clearFirst?: boolean;
}

export interface MediaParams {
  action: 'play' | 'pause' | 'toggle' | 'seek_forward' | 'seek_backward' | 'mute' | 'unmute';
  seconds?: number;
}

export interface BrowserActionRequest {
  actionId: string;
  tabId?: number;
  action: BrowserActionType;
  target?: TargetQuery;
  scrollParams?: ScrollParams;
  typeParams?: TypeParams;
  mediaParams?: MediaParams;
  url?: string;
  timeoutMs?: number;
  requiresVerification?: boolean;
}

export interface BrowserActionResult {
  success: boolean;
  actionId: string;
  action: BrowserActionType;
  tabId?: number;
  url?: string;
  title?: string;
  target?: {
    id?: string;
    text?: string;
    selector?: string;
    confidence?: number;
  };
  verification?: {
    passed: boolean;
    reason?: string;
  };
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
  stateChanged?: boolean;
  pageSummary?: string;
  spokenFeedback?: string;
  latencyMs?: number;
}

export interface BrowserTaskContext {
  activeTabId?: number;
  currentUrl?: string;
  currentPageTitle?: string;
  currentHostname?: string;
  currentTask?: string;
  lastAction?: BrowserActionType;
  lastTarget?: PageElement;
  recentTargets: PageElement[];
  recentPages: Partial<PageState>[];
  lastClickTime?: number;
}

export type ExtensionConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
