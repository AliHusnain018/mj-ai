/**
 * MemoryManager - Handles persistent user-approved memory and productivity data
 * (reminders, to-dos, notes, calendar events, preferences) in a secure, controlled way.
 */

import {
  CalendarEventItem,
  MemoryRecord,
  NoteItem,
  ReminderItem,
  TodoItem,
} from '../types/assistant';

const STORAGE_KEYS = {
  MEMORY: 'mj_user_memory_v1',
  REMINDERS: 'mj_reminders_v1',
  TODOS: 'mj_todos_v1',
  NOTES: 'mj_notes_v1',
  CALENDAR: 'mj_calendar_v1',
  SETTINGS: 'mj_settings_v1',
};

export class MemoryManager {
  private static instance: MemoryManager;
  private inMemoryStore: Record<string, string> = {};

  private constructor() {
    this.seedDefaultMemory();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  private getItem(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // In-memory fallback
    }
    return this.inMemoryStore[key] || null;
  }

  private setItem(key: string, val: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val);
        return;
      }
    } catch {
      // In-memory fallback
    }
    this.inMemoryStore[key] = val;
  }

  private removeItem(key: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    } catch {
      // In-memory fallback
    }
    delete this.inMemoryStore[key];
  }

  private seedDefaultMemory(): void {
    const existing = this.listMemories();
    if (existing.length === 0) {
      this.remember('assistant_name', 'MJ', 'preference');
      this.remember('preferred_language', 'English and Urdu (Bilingual)', 'preference');
      this.remember('favorite_domains', 'GitHub, YouTube, Google Docs', 'fact');
    }
  }

  // ===================== LONG TERM MEMORY =====================

  public remember(
    key: string,
    value: string,
    category: 'preference' | 'fact' | 'work' | 'general' = 'general'
  ): MemoryRecord {
    const memories = this.listMemories();
    const existingIndex = memories.findIndex((m) => m.key.toLowerCase() === key.toLowerCase());

    const record: MemoryRecord = {
      id: existingIndex >= 0 ? memories[existingIndex].id : 'mem_' + Date.now(),
      key,
      value,
      category,
      createdAt: Date.now(),
    };

    if (existingIndex >= 0) {
      memories[existingIndex] = record;
    } else {
      memories.push(record);
    }

    this.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(memories));
    return record;
  }

  public retrieve(query: string): MemoryRecord[] {
    const memories = this.listMemories();
    const q = query.toLowerCase().trim();
    if (!q) return memories;
    return memories.filter(
      (m) =>
        m.key.toLowerCase().includes(q) ||
        m.value.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }

  public forget(key: string): boolean {
    const memories = this.listMemories();
    const filtered = memories.filter(
      (m) => m.key.toLowerCase() !== key.toLowerCase() && m.id !== key
    );
    const changed = filtered.length !== memories.length;
    if (changed) {
      this.setItem(STORAGE_KEYS.MEMORY, JSON.stringify(filtered));
    }
    return changed;
  }

  public listMemories(): MemoryRecord[] {
    try {
      const data = this.getItem(STORAGE_KEYS.MEMORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public clearAllMemories(): void {
    this.removeItem(STORAGE_KEYS.MEMORY);
  }

  // ===================== REMINDERS =====================

  public addReminder(text: string, timeStr: string): ReminderItem {
    const reminders = this.listReminders();
    const reminder: ReminderItem = {
      id: 'rem_' + Date.now(),
      text,
      timeStr,
      completed: false,
      createdAt: Date.now(),
    };
    reminders.push(reminder);
    this.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    return reminder;
  }

  public listReminders(): ReminderItem[] {
    try {
      const data = this.getItem(STORAGE_KEYS.REMINDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public deleteReminder(id: string): boolean {
    const reminders = this.listReminders();
    const filtered = reminders.filter((r) => r.id !== id && !r.text.toLowerCase().includes(id.toLowerCase()));
    const changed = filtered.length !== reminders.length;
    if (changed) {
      this.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
    }
    return changed;
  }

  // ===================== TO-DOS =====================

  public addTodo(task: string): TodoItem {
    const todos = this.listTodos();
    const todo: TodoItem = {
      id: 'todo_' + Date.now(),
      task,
      completed: false,
      createdAt: Date.now(),
    };
    todos.push(todo);
    this.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
    return todo;
  }

  public listTodos(): TodoItem[] {
    try {
      const data = this.getItem(STORAGE_KEYS.TODOS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public toggleTodo(id: string): boolean {
    const todos = this.listTodos();
    const target = todos.find((t) => t.id === id || t.task.toLowerCase().includes(id.toLowerCase()));
    if (target) {
      target.completed = !target.completed;
      this.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
      return true;
    }
    return false;
  }

  public deleteTodo(id: string): boolean {
    const todos = this.listTodos();
    const filtered = todos.filter((t) => t.id !== id && !t.task.toLowerCase().includes(id.toLowerCase()));
    const changed = filtered.length !== todos.length;
    if (changed) {
      this.setItem(STORAGE_KEYS.TODOS, JSON.stringify(filtered));
    }
    return changed;
  }

  // ===================== NOTES =====================

  public addNote(title: string, content: string): NoteItem {
    const notes = this.listNotes();
    const note: NoteItem = {
      id: 'note_' + Date.now(),
      title,
      content,
      createdAt: Date.now(),
    };
    notes.push(note);
    this.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    return note;
  }

  public listNotes(): NoteItem[] {
    try {
      const data = this.getItem(STORAGE_KEYS.NOTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public deleteNote(id: string): boolean {
    const notes = this.listNotes();
    const filtered = notes.filter((n) => n.id !== id && !n.title.toLowerCase().includes(id.toLowerCase()));
    const changed = filtered.length !== notes.length;
    if (changed) {
      this.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
    }
    return changed;
  }

  // ===================== CALENDAR =====================

  public addCalendarEvent(title: string, dateTime: string, description?: string): CalendarEventItem {
    const events = this.listCalendarEvents();
    const ev: CalendarEventItem = {
      id: 'cal_' + Date.now(),
      title,
      dateTime,
      description,
      createdAt: Date.now(),
    };
    events.push(ev);
    this.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(events));
    return ev;
  }

  public listCalendarEvents(): CalendarEventItem[] {
    try {
      const data = this.getItem(STORAGE_KEYS.CALENDAR);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public deleteCalendarEvent(id: string): boolean {
    const events = this.listCalendarEvents();
    const filtered = events.filter((e) => e.id !== id && !e.title.toLowerCase().includes(id.toLowerCase()));
    const changed = filtered.length !== events.length;
    if (changed) {
      this.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(filtered));
    }
    return changed;
  }

  /**
   * Generates a context summary for system prompt or daily briefing
   */
  public getContextSummary(): string {
    const memories = this.listMemories().map((m) => `${m.key}: ${m.value}`).join('; ');
    const todos = this.listTodos().filter((t) => !t.completed).map((t) => t.task).join(', ');
    const reminders = this.listReminders().filter((r) => !r.completed).map((r) => `${r.text} at ${r.timeStr}`).join(', ');
    return `[User Preferences & Memory: ${memories || 'none'} | Active Tasks: ${todos || 'none'} | Reminders: ${reminders || 'none'}]`;
  }
}
