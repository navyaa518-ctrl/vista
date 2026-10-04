'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  itemType: 'Godown' | 'Floor' | 'Rack' | 'Row / Shelf';
  warningMessage?: string;
  childSummary?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemType,
  warningMessage,
  childSummary,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-start gap-3.5 pb-3">
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-900">
              Delete {itemType}?
            </h2>
            <p className="text-xs text-rose-700 mt-0.5 font-mono break-all font-semibold">
              &ldquo;{title}&rdquo;
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 leading-relaxed">
            {warningMessage || (
              <span>
                <strong>Warning:</strong> This action cannot be undone. Performing this deletion will permanently purge this {itemType.toLowerCase()} from the warehouse map.
              </span>
            )}
          </div>

          {childSummary && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
              <span className="text-[10px] text-slate-500 block uppercase font-bold mb-0.5">
                Cascading Impact Notice:
              </span>
              <span>{childSummary}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all flex items-center gap-1.5 text-xs disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Deleting...' : `Confirm Delete ${itemType}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
