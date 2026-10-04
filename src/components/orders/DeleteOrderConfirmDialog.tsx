'use client';

import React, { useState, useEffect } from 'react';
import { WalkInOrder } from '@/types/orders';
import { ordersService } from '@/lib/services/orders';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  X,
  Trash2,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Film,
  Building,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { soundEffects } from '@/lib/audio';

interface DeleteOrderConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: WalkInOrder | null;
  onOrderDeleted: (orderId: string) => void;
  currentUser?: { id?: string; email?: string } | null;
  userRole?: string;
}

export function DeleteOrderConfirmDialog({
  isOpen,
  onClose,
  order,
  onOrderDeleted,
  currentUser,
  userRole = 'admin',
}: DeleteOrderConfirmDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset internal state whenever modal opens or order changes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmInput('');
      setDeleting(false);
      setErrorMessage(null);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const permission = ordersService.canDeleteOrder(order, currentUser || null, userRole);
  const isSuperAdmin = permission.isSuperAdmin;

  const isDispatchedOrPipeline =
    order.status === 'DISPATCHED_RENTAL_PIPELINE' ||
    order.status === 'Dispatched' ||
    order.status === 'Returned' ||
    order.status === 'Confirmed';

  const requiredConfirmationText = order.order_number;
  const isConfirmInputValid =
    confirmInput.trim().toUpperCase() === requiredConfirmationText.toUpperCase() ||
    confirmInput.trim().toUpperCase() === 'DELETE';

  const handleProceedToStep2 = () => {
    setStep(2);
    setConfirmInput('');
    setErrorMessage(null);
  };

  const handleFinalDelete = async () => {
    if (!isConfirmInputValid) return;

    setDeleting(true);
    setErrorMessage(null);

    try {
      const res = await ordersService.deleteOrder(order.id, {
        userId: currentUser?.id,
        role: userRole,
      });

      if (res.success) {
        soundEffects.playSuccessChime();
        onOrderDeleted(order.id);
        onClose();
      } else {
        setErrorMessage(res.message || res.error || 'Failed to delete order.');
        setDeleting(false);
      }
    } catch (err: any) {
      console.error('Delete order error:', err);
      setErrorMessage(err.message || 'Failed to delete order. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 text-slate-900 overflow-hidden">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
              Step {step} of 2
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {step === 1 ? 'Authorization Check' : 'Strict Destruction Verification'}
            </span>
          </div>

          <button
            onClick={onClose}
            disabled={deleting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =================================================================
            STEP 1: FIRST CONFIRMATION & ORDER IMPACT SUMMARY
            ================================================================= */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Delete Order: {order.order_number}?
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Warning: This order has active operational/rental items. Are you sure you want to proceed?
              </p>
            </div>

            {/* Order Summary Snapshot */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Film className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="truncate max-w-[260px]">{order.movie_project_name}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isDispatchedOrPipeline
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block">Production House:</span>
                  <strong className="text-slate-800 font-semibold">{order.client_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Valuation:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatINR(order.total_rent_amount || order.final_payable || 0)}
                  </span>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200/80 text-[11px] text-sky-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    <strong>Super Admin Override Active:</strong> Universal permission to delete orders across all pipeline stages.
                  </span>
                </div>
              )}
            </div>

            {/* Automated Asset Release Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 space-y-1">
              <div className="font-bold text-amber-800 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Automatic Stock Release Protocol:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                All physical serialized prop items allocated to this order will be automatically restored to <strong className="text-slate-900">&apos;Available&apos;</strong> warehouse stock for other film productions.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToStep2}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* =================================================================
            STEP 2: FINAL STRICT DESTRUCTION CONFIRMATION (TYPE TO CONFIRM)
            ================================================================= */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-extrabold text-rose-600 tracking-tight">
                Final Confirmation Required
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Are you absolutely sure you want to permanently delete this order? All linked item allocations, picking assignments, and rental pipeline tasks will be completely reset.
              </p>
            </div>

            {/* High Impact Alert */}
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-700">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                Irreversible Enterprise Action:
              </span>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                This record will be permanently purged from the active rental register. You cannot undo this operation.
              </p>
            </div>

            {/* Type-To-Confirm Input Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                To confirm, type <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 select-all">{requiredConfirmationText}</span> or <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">DELETE</span> below:
              </label>
              <input
                type="text"
                autoFocus
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`Type ${requiredConfirmationText} or DELETE`}
                disabled={deleting}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono text-slate-900 font-bold placeholder-slate-400 focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                &larr; Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalDelete}
                  disabled={!isConfirmInputValid || deleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleting ? 'Deleting & Releasing...' : 'Yes, Permanently Delete Order'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
