'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  X,
  CheckCircle2,
  Receipt,
  FileText,
  Banknote,
  Smartphone,
  Building2,
} from 'lucide-react';
import { WalkInOrder } from '@/types/orders';
import { ordersService } from '@/lib/services/orders';
import { formatINR } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface RecordAdvanceModalProps {
  order: WalkInOrder;
  onClose: () => void;
  onAdvanceRecorded: () => void;
}

export function RecordAdvanceModal({
  order,
  onClose,
  onAdvanceRecorded,
}: RecordAdvanceModalProps) {
  const currentTotal = order.final_payable || order.total_rent_amount || 0;
  const currentAdvance = order.advance_amount || 0;
  const currentBalance = Math.max(0, currentTotal - currentAdvance);

  const [amount, setAmount] = useState<number>(currentAdvance > 0 ? currentAdvance : Math.round(currentTotal * 0.5));
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Credit Card'>('UPI');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid advance payment amount.');
      return;
    }

    try {
      setSubmitting(true);
      const noteStr = `${paymentMode} Advance: ${formatINR(amount)}${reference ? ` (Ref: ${reference})` : ''}${notes ? ` - ${notes}` : ''}`;
      await ordersService.recordAdvancePayment(order.id, amount, paymentMode, noteStr);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      onAdvanceRecorded();
      onClose();
    } catch (err) {
      console.error('Failed to record advance payment:', err);
      alert('Failed to update advance payment ledger.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Direct Pipeline Financial Ledger
              </span>
              <h3 className="text-base font-bold text-slate-900">Record Advance Payment</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Details */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-4 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="font-mono font-bold text-slate-800">{order.order_number}</span>
            <span className="text-slate-500">{order.client_name}</span>
          </div>
          <div className="font-semibold text-slate-900 text-[13px]">{order.movie_project_name}</div>
          <div className="flex justify-between pt-1 border-t border-slate-200 text-[11px]">
            <span className="text-slate-500">Quoted Total: <strong>{formatINR(currentTotal)}</strong></span>
            <span className="text-slate-500">Current Balance: <strong className="font-mono text-rose-700">{formatINR(currentBalance)}</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Quick Percentage Presets</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAmount(Math.round(currentTotal * 0.3))}
                className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                30% ({formatINR(Math.round(currentTotal * 0.3))})
              </button>
              <button
                type="button"
                onClick={() => setAmount(Math.round(currentTotal * 0.5))}
                className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                50% ({formatINR(Math.round(currentTotal * 0.5))})
              </button>
              <button
                type="button"
                onClick={() => setAmount(currentTotal)}
                className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                100% Full ({formatINR(currentTotal)})
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Advance Collected (₹) <span className="text-rose-600">*</span></label>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-extrabold text-base text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['UPI', 'Cash', 'Bank Transfer', 'Credit Card'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-1.5 px-2 rounded-lg font-bold border transition-all text-[11px] cursor-pointer ${
                    paymentMode === mode
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Reference / Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Transaction Ref / Cheque No.</label>
            <input
              type="text"
              placeholder="e.g. UPI-TXN-88492019"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none"
            />
          </div>

          {/* Updated Balance Preview */}
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 flex justify-between items-center text-xs">
            <span>Remaining Due Post-Advance:</span>
            <span className="font-mono font-extrabold text-sm text-emerald-900">
              {formatINR(Math.max(0, currentTotal - amount))}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Recording...' : 'Save Advance Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
