/**
 * PermissionModal - Security confirmation dialog for sensitive or dangerous tool actions
 */

import React from 'react';
import { AlertTriangle, ShieldCheck, X, Check } from 'lucide-react';
import { ToolCallRequest } from '../types/assistant';

interface PermissionModalProps {
  request: ToolCallRequest | null;
  onConfirm: () => void;
  onDeny: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  request,
  onConfirm,
  onDeny,
}) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl shadow-amber-950/50 p-5 sm:p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-mono tracking-wide">
                PERMISSION CONFIRMATION
              </h3>
              <p className="text-xs text-amber-400/90 font-mono uppercase">
                {request.permissionLevel} Action Requested
              </p>
            </div>
          </div>
          <button
            onClick={onDeny}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Details */}
        <div className="mb-5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono text-xs space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>TOOL:</span>
            <span className="text-cyan-400 font-semibold">{request.name}</span>
          </div>
          <div className="text-slate-400">
            <span>ARGUMENTS:</span>
            <pre className="mt-1 p-2 rounded bg-slate-900/90 text-slate-300 overflow-x-auto text-[11px] max-h-36">
              {JSON.stringify(request.args, null, 2)}
            </pre>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          MJ requires explicit authorization before carrying out sensitive operations (such as sending messages or modifying stored records).
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onDeny}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono tracking-wider transition-all"
          >
            DENY
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono tracking-wider flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            AUTHORIZE
          </button>
        </div>
      </div>
    </div>
  );
};
