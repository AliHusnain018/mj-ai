/**
 * ActionToast - Subtle holographic toast notification displaying active tool actions
 */

import React, { useEffect, useState } from 'react';
import { Globe, Search, CloudSun, Bell, CheckSquare, FileText, Calendar, Database, Code, Mail, Cpu, CheckCircle2 } from 'lucide-react';

export interface ActionToastData {
  id: string;
  name: string;
  args: any;
  result?: any;
}

interface ActionToastProps {
  action: ActionToastData | null;
  onDismiss: () => void;
}

export const ActionToast: React.FC<ActionToastProps> = ({ action, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (action) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [action, onDismiss]);

  if (!action) return null;

  const getToolMeta = (name: string, args: any) => {
    switch (name) {
      case 'openWebsite':
        return {
          icon: <Globe className="w-4 h-4 text-cyan-400" />,
          title: `Opening ${args.label || args.url}`,
          sub: args.url,
        };
      case 'webSearch':
        return {
          icon: <Search className="w-4 h-4 text-emerald-400" />,
          title: `Searching Web`,
          sub: `"${args.query}"`,
        };
      case 'getWeather':
        return {
          icon: <CloudSun className="w-4 h-4 text-amber-400" />,
          title: `Weather Report`,
          sub: args.location || 'Local forecast',
        };
      case 'manageReminders':
        return {
          icon: <Bell className="w-4 h-4 text-purple-400" />,
          title: `Reminder ${args.action || 'Updated'}`,
          sub: args.text || args.idOrKeyword || 'Productivity item',
        };
      case 'manageTodos':
        return {
          icon: <CheckSquare className="w-4 h-4 text-blue-400" />,
          title: `Task ${args.action || 'Updated'}`,
          sub: args.task || args.idOrKeyword || 'To-do item',
        };
      case 'manageNotes':
        return {
          icon: <FileText className="w-4 h-4 text-teal-400" />,
          title: `Note ${args.action || 'Recorded'}`,
          sub: args.title || 'Personal notes',
        };
      case 'manageCalendar':
        return {
          icon: <Calendar className="w-4 h-4 text-rose-400" />,
          title: `Calendar Event`,
          sub: args.title || 'Scheduled item',
        };
      case 'manageMemory':
        return {
          icon: <Database className="w-4 h-4 text-indigo-400" />,
          title: `Memory Updated`,
          sub: args.key ? `${args.key}: ${args.value || ''}` : 'Knowledge synced',
        };
      case 'codingAssist':
        return {
          icon: <Code className="w-4 h-4 text-pink-400" />,
          title: `Coding Assistant (${args.task})`,
          sub: args.language || 'Code inspection',
        };
      case 'draftEmail':
        return {
          icon: <Mail className="w-4 h-4 text-yellow-400" />,
          title: `Email Action`,
          sub: `To: ${args.to} ("${args.subject}")`,
        };
      case 'systemAction':
        return {
          icon: <Cpu className="w-4 h-4 text-sky-400" />,
          title: `System Diagnostics`,
          sub: args.action,
        };
      default:
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-cyan-400" />,
          title: `Executed ${name}`,
          sub: 'Completed action',
        };
    }
  };

  const meta = getToolMeta(action.name, action.args);

  return (
    <div
      className={`fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 pointer-events-auto ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl shadow-cyan-950/40 text-slate-200 text-xs font-mono max-w-sm sm:max-w-md">
        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
          {meta.icon}
        </div>
        <div className="min-w-0 pr-2">
          <div className="font-semibold text-slate-100 flex items-center gap-2">
            <span>{meta.title}</span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-800/40">
              TOOL
            </span>
          </div>
          <div className="text-slate-400 truncate text-[11px] font-sans">
            {meta.sub}
          </div>
        </div>
      </div>
    </div>
  );
};
