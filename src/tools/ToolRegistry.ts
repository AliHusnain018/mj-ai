/**
 * ToolRegistry - Declares all functions available to Gemini Live
 */

import { ToolDefinition } from '../types/assistant';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'browserControl',
    description:
      'Directly controls the user active browser tab and websites (such as YouTube, GitHub, Google, Wikipedia). Supports opening sites, searching, clicking videos/channels/buttons/links, scrolling up/down/top/bottom, navigating back/forward/reload, and media playback control.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          enum: [
            'OPEN_URL',
            'CLICK_ELEMENT',
            'SCROLL',
            'TYPE_TEXT',
            'PLAY_MEDIA',
            'PAUSE_MEDIA',
            'SEEK_MEDIA',
            'GO_BACK',
            'GO_FORWARD',
            'RELOAD',
            'INSPECT_PAGE',
          ],
          description: 'The specific browser action to perform on the active page.',
        },
        targetDescription: {
          type: 'STRING',
          description:
            'Natural language description of the target element to click or interact with (e.g. "first Python lecture", "FreeCodeCamp channel", "subscribe button", "third video", "that channel").',
        },
        url: {
          type: 'STRING',
          description: 'URL to open or navigate to (e.g. https://www.youtube.com).',
        },
        text: {
          type: 'STRING',
          description: 'Text or search query to type into the active search box or input field.',
        },
        direction: {
          type: 'STRING',
          enum: ['up', 'down', 'top', 'bottom'],
          description: 'Direction to scroll.',
        },
        scrollAmount: {
          type: 'STRING',
          enum: ['small', 'medium', 'large'],
          description: 'Amount to scroll (small = ~300px, medium = ~700px, large = ~1500px).',
        },
        mediaAction: {
          type: 'STRING',
          enum: ['play', 'pause', 'toggle', 'seek_forward', 'seek_backward', 'mute', 'unmute'],
          description: 'Media control action for active video or audio players.',
        },
        seconds: {
          type: 'NUMBER',
          description: 'Number of seconds to seek forward or backward.',
        },
      },
      required: ['action'],
    },
    permissionLevel: 'safe',
  },
  {
    name: 'openWebsite',
    description: 'Safely opens a website or popular service in the user browser, such as YouTube, GitHub, Google, Gmail, Wikipedia, ChatGPT, etc.',
    parameters: {
      type: 'OBJECT',
      properties: {
        url: {
          type: 'STRING',
          description: 'The complete URL to open (e.g. https://www.youtube.com, https://github.com). Must start with https:// or http://.',
        },
        label: {
          type: 'STRING',
          description: 'Friendly name of the site (e.g. "YouTube", "GitHub").',
        },
      },
      required: ['url'],
    },
    permissionLevel: 'safe',
  },
  {
    name: 'webSearch',
    description: 'Searches the web for current events, facts, latest tech news, definitions, documentation, or real-time topics.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'The search query to look up on the web.',
        },
      },
      required: ['query'],
    },
    permissionLevel: 'safe',
  },
  {
    name: 'getWeather',
    description: 'Gets current weather conditions, temperature, and forecast for a given city or location.',
    parameters: {
      type: 'OBJECT',
      properties: {
        location: {
          type: 'STRING',
          description: 'City or location name (e.g. "Lahore", "London", "San Francisco").',
        },
      },
      required: ['location'],
    },
    permissionLevel: 'safe',
  },
  {
    name: 'manageReminders',
    description: 'Creates, lists, or deletes conversational reminders for the user.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          description: 'Action to perform: "add", "list", or "delete".',
          enum: ['add', 'list', 'delete'],
        },
        text: {
          type: 'STRING',
          description: 'The reminder content/description (required for "add").',
        },
        timeStr: {
          type: 'STRING',
          description: 'When to remind the user (e.g. "8:00 PM", "tomorrow morning").',
        },
        idOrKeyword: {
          type: 'STRING',
          description: 'ID or keyword of the reminder to delete.',
        },
      },
      required: ['action'],
    },
    permissionLevel: 'safe',
  },
  {
    name: 'manageTodos',
    description: 'Manages personal to-do list tasks (add, check/toggle, list, delete).',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          description: 'Action: "add", "list", "toggle", or "delete".',
          enum: ['add', 'list', 'toggle', 'delete'],
        },
        task: {
          type: 'STRING',
          description: 'Task description to add (e.g. "Finish backend testing").',
        },
        idOrKeyword: {
          type: 'STRING',
          description: 'Task identifier or keyword to toggle or delete.',
        },
      },
      required: ['action'],
    },
    permissionLevel: 'safe',
  },
  {
    name: 'manageNotes',
    description: 'Creates, reads, lists, or removes quick notes and project ideas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          description: 'Action: "add", "list", or "delete".',
          enum: ['add', 'list', 'delete'],
        },
        title: {
          type: 'STRING',
          description: 'Title of the note (e.g. "Project Ideas").',
        },
        content: {
          type: 'STRING',
          description: 'Detailed content of the note.',
        },
        idOrKeyword: {
          type: 'STRING',
          description: 'Title or ID of note to delete.',
        },
      },
      required: ['action'],
    },
    permissionLevel: 'safe',
  },
  {
    name: 'manageCalendar',
    description: 'Schedules or reviews calendar events and meetings.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          description: 'Action: "add", "list", or "delete".',
          enum: ['add', 'list', 'delete'],
        },
        title: {
          type: 'STRING',
          description: 'Title of the event or meeting.',
        },
        dateTime: {
          type: 'STRING',
          description: 'Date and time of the event (e.g. "Tomorrow at 3 PM").',
        },
        idOrKeyword: {
          type: 'STRING',
          description: 'Event keyword to delete.',
        },
      },
      required: ['action'],
    },
    permissionLevel: 'safe',
  },
  {
    name: 'manageMemory',
    description: 'Explicitly stores or retrieves user preferences, frequent websites, or personal facts ("remember that...", "what is my...", "forget...").',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          description: 'Action: "remember", "retrieve", "forget", or "list".',
          enum: ['remember', 'retrieve', 'forget', 'list'],
        },
        key: {
          type: 'STRING',
          description: 'The topic or key (e.g. "preferred_language", "favorite_editor", "name").',
        },
        value: {
          type: 'STRING',
          description: 'The detail to remember (e.g. "Urdu", "VS Code", "Farhan").',
        },
      },
      required: ['action'],
    },
    permissionLevel: 'safe',
  },
  {
    name: 'codingAssist',
    description: 'Assists with software engineering tasks: explains errors, debugs code snippets, suggests refactorings, or explains Git commands.',
    parameters: {
      type: 'OBJECT',
      properties: {
        task: {
          type: 'STRING',
          description: 'Type of help: "explain", "debug", "refactor", or "git_help".',
          enum: ['explain', 'debug', 'refactor', 'git_help'],
        },
        snippetOrError: {
          type: 'STRING',
          description: 'Code snippet, compiler error, or Git issue to diagnose.',
        },
        language: {
          type: 'STRING',
          description: 'Programming language (e.g. TypeScript, Python, Rust).',
        },
      },
      required: ['task', 'snippetOrError'],
    },
    permissionLevel: 'safe',
  },
  {
    name: 'draftEmail',
    description: 'Drafts or sends an email message. Sending an email directly is a sensitive action that requires user confirmation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        to: {
          type: 'STRING',
          description: 'Recipient email address or name.',
        },
        subject: {
          type: 'STRING',
          description: 'Email subject line.',
        },
        body: {
          type: 'STRING',
          description: 'Body text of the email message.',
        },
        sendImmediately: {
          type: 'BOOLEAN',
          description: 'Whether to send right away (requires confirmation) or keep as draft.',
        },
      },
      required: ['to', 'subject', 'body'],
    },
    permissionLevel: 'sensitive',
  },
  {
    name: 'systemAction',
    description: 'Checks browser or desktop companion system diagnostic status (battery, memory, platform info) or simulates controlled assistant actions.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          description: 'Action: "system_info", "battery_status", "lock_screen", or "open_app".',
          enum: ['system_info', 'battery_status', 'lock_screen', 'open_app'],
        },
        appName: {
          type: 'STRING',
          description: 'Application name if action is open_app.',
        },
      },
      required: ['action'],
    },
    permissionLevel: 'sensitive',
  },
];
