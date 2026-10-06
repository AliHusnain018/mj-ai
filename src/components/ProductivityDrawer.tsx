/**
 * ProductivityDrawer - View and manage Reminders, Tasks, Notes, Calendar, and Memory
 */

import React, { useState } from 'react';
import { X, Bell, CheckSquare, FileText, Calendar, Brain, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { MemoryManager } from '../memory/MemoryManager';

interface ProductivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'reminders' | 'todos' | 'notes' | 'calendar' | 'memory';

export const ProductivityDrawer: React.FC<ProductivityDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('reminders');
  const memory = MemoryManager.getInstance();

  const [, forceUpdate] = useState({});
  const refresh = () => forceUpdate({});

  if (!isOpen) return null;

  const reminders = memory.listReminders();
  const todos = memory.listTodos();
  const notes = memory.listNotes();
  const calendarEvents = memory.listCalendarEvents();
  const memories = memory.listMemories();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono tracking-wider text-slate-100">
                PRODUCTIVITY & MEMORY
              </h2>
              <p className="text-[11px] text-slate-400">
                Managed via voice commands with MJ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-3 overflow-x-auto scrollbar-none font-mono text-xs">
          {[
            { id: 'reminders', label: 'Reminders', icon: Bell, count: reminders.length },
            { id: 'todos', label: 'Tasks', icon: CheckSquare, count: todos.length },
            { id: 'notes', label: 'Notes', icon: FileText, count: notes.length },
            { id: 'calendar', label: 'Calendar', icon: Calendar, count: calendarEvents.length },
            { id: 'memory', label: 'Memory', icon: Brain, count: memories.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-3 border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-cyan-400 text-cyan-300 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="space-y-2.5">
              {reminders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  No active reminders.
                  <p className="mt-1 text-slate-400">Try saying: "MJ, remind me at 8 PM to finish the report"</p>
                </div>
              ) : (
                reminders.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-slate-200">{r.text}</div>
                      <div className="text-[11px] text-cyan-400 font-mono mt-0.5">⏰ {r.timeStr}</div>
                    </div>
                    <button
                      onClick={() => {
                        memory.deleteReminder(r.id);
                        refresh();
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Todos Tab */}
          {activeTab === 'todos' && (
            <div className="space-y-2">
              {todos.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  No tasks added yet.
                  <p className="mt-1 text-slate-400">Try saying: "MJ, add review API docs to my tasks"</p>
                </div>
              ) : (
                todos.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <button
                      onClick={() => {
                        memory.toggleTodo(t.id);
                        refresh();
                      }}
                      className="flex items-center gap-2.5 min-w-0 text-left"
                    >
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <span className={t.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {t.task}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        memory.deleteTodo(t.id);
                        refresh();
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-2.5">
              {notes.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  No notes saved.
                  <p className="mt-1 text-slate-400">Try saying: "MJ, create a note called Project Ideas"</p>
                </div>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-cyan-300 font-mono">{n.title}</span>
                      <button
                        onClick={() => {
                          memory.deleteNote(n.id);
                          refresh();
                        }}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {n.content && <p className="text-slate-300 text-[11px] leading-relaxed">{n.content}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-2.5">
              {calendarEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  No events on calendar.
                  <p className="mt-1 text-slate-400">Try saying: "MJ, schedule a meeting tomorrow at 3 PM"</p>
                </div>
              ) : (
                calendarEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{ev.title}</div>
                      <div className="text-[11px] text-fuchsia-400 font-mono mt-0.5">📅 {ev.dateTime}</div>
                    </div>
                    <button
                      onClick={() => {
                        memory.deleteCalendarEvent(ev.id);
                        refresh();
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Memory Tab */}
          {activeTab === 'memory' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-300 leading-relaxed">
                MJ remembers your preferences and facts only when instructed. You can tell MJ: "Remember that I like Urdu" or "Forget that preference".
              </div>
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="min-w-0">
                    <span className="text-cyan-400 font-semibold">{m.key}: </span>
                    <span className="text-slate-300 font-sans">{m.value}</span>
                  </div>
                  <button
                    onClick={() => {
                      memory.forget(m.id);
                      refresh();
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title="Forget memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {memories.length > 0 && (
                <button
                  onClick={() => {
                    memory.clearAllMemories();
                    refresh();
                  }}
                  className="w-full mt-4 py-2 px-3 rounded-xl bg-red-950/40 border border-red-900/50 hover:bg-red-900/40 text-red-300 text-xs font-mono transition-colors"
                >
                  CLEAR ALL MEMORIES
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
