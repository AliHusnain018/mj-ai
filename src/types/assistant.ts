/**
 * Types and interfaces for the MJ Voice Assistant
 */

export type AssistantState = 'disconnected' | 'connecting' | 'listening' | 'speaking';

export type PersonalityMode =
  | 'friendly'
  | 'professional'
  | 'witty'
  | 'teacher'
  | 'coding'
  | 'motivational'
  | 'business';

export type PermissionLevel = 'safe' | 'sensitive' | 'dangerous';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, {
      type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';
      description: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required?: string[];
  };
  permissionLevel: PermissionLevel;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  args: Record<string, any>;
  permissionLevel: PermissionLevel;
}

export interface ToolCallResult {
  id: string;
  name: string;
  success: boolean;
  result: any;
  error?: string;
}

export interface MemoryRecord {
  id: string;
  key: string;
  value: string;
  category: 'preference' | 'fact' | 'work' | 'general';
  createdAt: number;
}

export interface ReminderItem {
  id: string;
  text: string;
  timeStr: string;
  completed: boolean;
  createdAt: number;
}

export interface TodoItem {
  id: string;
  task: string;
  completed: boolean;
  createdAt: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  dateTime: string;
  description?: string;
  createdAt: number;
}

export interface DebugLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'audio' | 'tool' | 'gemini' | 'error';
  message: string;
  data?: any;
}

export interface AssistantSettings {
  personalityMode: PersonalityMode;
  preferredLanguage: 'auto' | 'english' | 'urdu' | 'mixed';
  voiceName: 'Aoede' | 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr';
  wakeWordEnabled: boolean;
  reducedMotion: boolean;
  autoConnectOnLaunch: boolean;
  soundFeedback: boolean;
}
