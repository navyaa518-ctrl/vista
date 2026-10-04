'use client';

import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Film, 
  UserCheck, 
  FileText, 
  DollarSign, 
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { LaborSheetEntry } from '@/types/orders';

interface LaborWageVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: LaborSheetEntry | null;
  onUpdateStatus?: (entryId: string, status: 'Pending_Disbursement' | 'Approved' | 'Disbursed') => Promise<void>;
}

export const LaborWageVoucherModal: React.FC<LaborWageVoucherModalProps> = ({
  isOpen,
  onClose,
  entry,
  onUpdateStatus,
}) => {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !entry) return null;

  const voucherNo = entry.voucher_number || `VCH-${entry.order_number}-${entry.badge_number || '01'}`;

  const handleStatusChange = async (status: 'Pending_Disbursement' | 'Approved' | 'Disbursed') => {
    if (!onUpdateStatus) return;
    setUpdating(true);
    try {
      await onUpdateStatus(entry.id, status);
    } catch (err) {
      console.error('Error updating voucher status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm tracking-wide">
              Official Labor Wage Voucher • {voucherNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-medium transition-colors border border-slate-700 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              Print Voucher
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Content */}
        <div className="p-8 space-y-6 text-slate-900 print:p-6 print:m-0">
          
          {/* Corporate Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black text-base shadow-sm">
                    A
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-950">
                      ASHWA MOVIE PROPERTY RENTALS
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      Studio & Production Prop Logistics • Labor Disbursement Division
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Warehouse Complex, Film City Road, Hyderabad • Contact: +91 98765 43210
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 font-mono font-bold text-xs rounded uppercase tracking-wider">
                  Labor Wage Voucher
                </span>
                <p className="text-xs font-mono font-semibold text-slate-800 mt-2">
                  Voucher #: <span className="text-slate-950">{voucherNo}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Date: {new Date(entry.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Project & Order Information Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-semibold">
                Movie Project / Production
              </span>
              <p className="font-bold text-sm text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-amber-600" />
                {entry.movie_project_name || 'Feature Film Shoot'}
              </p>
              <p className="text-slate-600 mt-1">
                Order Ref: <span className="font-mono font-semibold">{entry.order_number}</span>
              </p>
            </div>

            <div>
              <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-semibold">
                Crew Member Details
              </span>
              <p className="font-bold text-sm text-slate-900 mt-0.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                {entry.crew_name}
              </p>
              <p className="text-slate-600 mt-1">
                Badge / Employee ID: <span className="font-mono font-semibold text-slate-800">{entry.badge_number || 'CRW-REG'}</span>
                <span className="mx-2 text-slate-300">•</span>
                Role: <span className="font-medium text-slate-800">{entry.role_on_set || 'Field Handling & Packing'}</span>
              </p>
            </div>
          </div>

          {/* Wage Computation Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Wage & Allowance Calculation
            </h3>
            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Work Scope / Service Description</th>
                    <th className="p-3 text-center">Active Shoot Days</th>
                    <th className="p-3 text-right">Daily Wage Rate</th>
                    <th className="p-3 text-right">Total Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">On-Set Prop Handling, Packing & Site Logistics</p>
                      <p className="text-[11px] text-slate-500">
                        Deployment across production schedule for Order #{entry.order_number}
                      </p>
                    </td>
                    <td className="p-3 text-center font-mono font-semibold text-slate-800">
                      {entry.active_shoot_days} {entry.active_shoot_days === 1 ? 'Day' : 'Days'}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800">
                      ₹{entry.daily_wage_rate?.toLocaleString('en-IN')} / day
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-950">
                      ₹{entry.total_wages_earned?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td colSpan={3} className="p-3 text-right font-bold text-slate-800">
                      Net Wage Disbursable:
                    </td>
                    <td className="p-3 text-right font-mono text-sm font-black text-emerald-700">
                      ₹{entry.total_wages_earned?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Status & Disbursed Info */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Disbursement Status:</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                entry.payment_status === 'Disbursed'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : entry.payment_status === 'Approved'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {entry.payment_status === 'Disbursed' && <CheckCircle2 className="w-3 h-3" />}
                {entry.payment_status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                {entry.payment_status === 'Pending_Disbursement' && <Clock className="w-3 h-3" />}
                {entry.payment_status.replace('_', ' ')}
              </span>
            </div>

            {entry.disbursed_at && (
              <span className="text-slate-500 text-[11px]">
                Disbursed on: {new Date(entry.disbursed_at).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Authorization & Signatures Grid */}
          <div className="pt-6 grid grid-cols-3 gap-6 border-t border-slate-200 text-center">
            <div className="space-y-8">
              <div className="h-10 border-b border-dashed border-slate-300" />
              <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Crew Member Signature<br />
                <span className="text-[10px] text-slate-400 font-normal">({entry.crew_name})</span>
              </p>
            </div>

            <div className="space-y-8">
              <div className="h-10 border-b border-dashed border-slate-300" />
              <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Production / Floor Manager<br />
                <span className="text-[10px] text-slate-400 font-normal">(Verified Shoot Days)</span>
              </p>
            </div>

            <div className="space-y-8">
              <div className="h-10 border-b border-dashed border-slate-300" />
              <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Accounts / Cashier Sign-off<br />
                <span className="text-[10px] text-slate-400 font-normal">(Authorized Payment)</span>
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            {onUpdateStatus && entry.payment_status !== 'Disbursed' && (
              <>
                {entry.payment_status === 'Pending_Disbursement' && (
                  <button
                    disabled={updating}
                    onClick={() => handleStatusChange('Approved')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    Approve for Disbursement
                  </button>
                )}
                <button
                  disabled={updating}
                  onClick={() => handleStatusChange('Disbursed')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  Mark as Disbursed (Paid)
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              Print Official Voucher
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
