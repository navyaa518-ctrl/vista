'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  ShieldCheck,
  HardHat,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Camera,
  Layers,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { WalkInOrder, WalkInOrderItem } from '@/types/orders';
import { ordersService } from '@/lib/services/orders';
import { formatINR } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface ReturnVerificationModalProps {
  order: WalkInOrder;
  items: WalkInOrderItem[];
  onClose: () => void;
  onReturnCompleted: () => void;
  onOpenInvoice?: () => void;
}

export function ReturnVerificationModal({
  order,
  items,
  onClose,
  onReturnCompleted,
  onOpenInvoice,
}: ReturnVerificationModalProps) {
  // Step A: Field Crew State
  const [stepAInitiated, setStepAInitiated] = useState(
    order.return_status_crew === 'Initiated' || order.return_status_crew === 'Approved'
  );
  const [fieldCrewName, setFieldCrewName] = useState('Ramesh Kumar (Lead Field Crew)');
  const [confirmedPropCount, setConfirmedPropCount] = useState(items.length);
  const [hasDamages, setHasDamages] = useState(Boolean(order.damage_deduction_amount && order.damage_deduction_amount > 0));
  const [damageNotes, setDamageNotes] = useState(order.return_notes_crew || '');
  const [damageEstimatedCost, setDamageEstimatedCost] = useState(order.damage_deduction_amount || 0);

  // Step B: Warehouse Floor Executive State
  const [warehouseExecName, setWarehouseExecName] = useState('Ravi Kumar (Floor 1 Specialist)');
  const [warehouseCondition, setWarehouseCondition] = useState<'Pristine' | 'Good' | 'Minor_Wear' | 'Damaged'>('Good');
  const [warehouseNotes, setWarehouseNotes] = useState(
    order.return_notes_exec || 'Physical bay verification complete. Props verified against dispatch manifest.'
  );

  const [submittingStepA, setSubmittingStepA] = useState(false);
  const [submittingStepB, setSubmittingStepB] = useState(false);
  const [returnTerminated, setReturnTerminated] = useState(
    order.status === 'Returned' || order.lifecycle_status === 'Verified_Closed'
  );

  // Step A: Field Crew Check
  const handleInitiateFieldReturn = async () => {
    try {
      setSubmittingStepA(true);
      await ordersService.initiateFieldReturn(order.id, {
        initiated_by: fieldCrewName,
        confirmed_count: confirmedPropCount,
        total_count: items.length,
        has_damages: hasDamages,
        damage_notes: damageNotes,
        damage_estimated_cost: damageEstimatedCost,
      });
      setStepAInitiated(true);
    } catch (err) {
      console.error('Failed to initiate return:', err);
      alert('Failed to record Step A field return.');
    } finally {
      setSubmittingStepA(false);
    }
  };

  // Step B: Warehouse Floor Sales Executive Sign-Off & Strict Termination
  const handleConfirmWarehouseReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingStepB(true);
      await ordersService.confirmWarehouseReturn(order.id, {
        verified_by: warehouseExecName,
        warehouse_condition_rating: warehouseCondition,
        warehouse_notes: warehouseNotes,
      });

      setReturnTerminated(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      onReturnCompleted();
    } catch (err) {
      console.error('Failed to confirm return:', err);
      alert('Failed to complete warehouse return verification.');
    } finally {
      setSubmittingStepB(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 my-auto max-h-[95vh] flex flex-col text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 block">
                2-Step Safe Return Verification Protocol
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Incoming Inventory Verification &amp; Lifecycle Termination
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shoot Information Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-5 flex flex-col sm:flex-row justify-between gap-3 text-xs">
          <div>
            <span className="font-mono text-xs font-bold text-slate-900">{order.order_number}</span>
            <h4 className="font-bold text-slate-900 text-sm mt-0.5">{order.movie_project_name}</h4>
            <p className="text-slate-500">
              Client: <strong className="text-slate-700">{order.client_name}</strong> • Location: {order.shoot_location}
            </p>
          </div>
          <div className="text-left sm:text-right space-y-0.5">
            <div className="text-slate-500">Total Loaded Props: <strong className="font-mono text-slate-900">{items.length} Units</strong></div>
            <div className="text-slate-500">Vehicle: <strong className="font-mono text-emerald-700">{order.vehicle_number || 'TS 09 UA 8842'}</strong></div>
            <div className="font-semibold text-amber-700">Actual Shoot Days: {order.actual_shoot_days || order.rental_days} Days</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {returnTerminated ? (
            /* Return Completed & Terminated State */
            <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-emerald-950">
                  Return Verified &amp; Lifecycle Closed
                </h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Both the on-set field crew and warehouse floor executive have approved the return. All {items.length} props have been restored to available inventory. The dispatch loop is permanently terminated.
                </p>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                {onOpenInvoice && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenInvoice();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate &amp; View Final Tax Invoice</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-semibold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* STEP A: Field Crew Check */}
              <div className={`p-4 rounded-xl border transition-all ${
                stepAInitiated
                  ? 'bg-emerald-50/50 border-emerald-300'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      stepAInitiated ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
                    }`}>
                      {stepAInitiated ? '✓' : '1'}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Step A: On-Set Field Crew Check &amp; Return Handover
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    stepAInitiated ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {stepAInitiated ? 'Initiated & Handed Over' : 'Pending Field Trigger'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Field Crew In-Charge</label>
                      <input
                        type="text"
                        disabled={stepAInitiated}
                        value={fieldCrewName}
                        onChange={(e) => setFieldCrewName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium disabled:opacity-75"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Verified Prop Count (Out of {items.length})</label>
                      <input
                        type="number"
                        disabled={stepAInitiated}
                        value={confirmedPropCount}
                        onChange={(e) => setConfirmedPropCount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 disabled:opacity-75"
                      />
                    </div>
                  </div>

                  {/* Damages check */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={stepAInitiated}
                        checked={hasDamages}
                        onChange={(e) => setHasDamages(e.target.checked)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span className="font-bold text-slate-800">Flag Prop Damages / Breakages on Set</span>
                    </label>

                    {hasDamages && (
                      <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in">
                        <input
                          type="text"
                          disabled={stepAInitiated}
                          placeholder="Describe damage (e.g. Vintage Telescope front glass chipped during crane move)"
                          value={damageNotes}
                          onChange={(e) => setDamageNotes(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-slate-600 text-[11px] font-semibold">Estimated Repair Cost (₹):</label>
                          <input
                            type="number"
                            disabled={stepAInitiated}
                            value={damageEstimatedCost}
                            onChange={(e) => setDamageEstimatedCost(Number(e.target.value))}
                            className="w-36 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono font-bold text-rose-700 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {!stepAInitiated && (
                    <button
                      type="button"
                      onClick={handleInitiateFieldReturn}
                      disabled={submittingStepA}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <HardHat className="w-3.5 h-3.5" />
                      <span>{submittingStepA ? 'Initiating...' : 'Complete Step A: Initiate Return'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* STEP B: Warehouse Floor Sales Executive Sign-Off */}
              <form onSubmit={handleConfirmWarehouseReturn} className={`p-4 rounded-xl border transition-all ${
                !stepAInitiated
                  ? 'bg-slate-50 border-slate-200 opacity-60 pointer-events-none'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Step B: Warehouse Floor Sales Executive Sign-Off (Final Restock)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Awaiting Warehouse Verification
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Floor Executive Verifier <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={warehouseExecName}
                        onChange={(e) => setWarehouseExecName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Warehouse Condition Rating <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={warehouseCondition}
                        onChange={(e) => setWarehouseCondition(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                      >
                        <option value="Pristine">Pristine (No Wear)</option>
                        <option value="Good">Good (Normal Rental Wear)</option>
                        <option value="Minor_Wear">Minor Wear &amp; Tear</option>
                        <option value="Damaged">Damaged / Repair Needed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Floor Executive Inspection Notes</label>
                    <textarea
                      rows={2}
                      value={warehouseNotes}
                      onChange={(e) => setWarehouseNotes(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Bug fix notice / state assurance */}
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      Lifecycle Termination Rule:
                    </div>
                    <p>
                      Clicking &quot;Confirm Return&quot; marks this order as strictly <strong>Verified &amp; Closed / Returned</strong>. It will be permanently closed and prevented from re-entering the Lorry Dispatch Pipeline.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingStepB || !stepAInitiated}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{submittingStepB ? 'Verifying & Closing...' : 'Confirm Return & Terminate Lifecycle'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
