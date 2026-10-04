'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Truck,
  X,
  Printer,
  Shield,
  HardHat,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Calendar,
  Building,
  MapPin,
  QrCode,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { WalkInOrder, WalkInOrderItem } from '@/types/orders';
import { crewHubService } from '@/lib/services/crewHub';
import { CrewMember360 } from '@/types/crewHub';
import { formatINR } from '@/lib/utils';

interface DeliveryChallanModalProps {
  order: WalkInOrder;
  items: WalkInOrderItem[];
  onClose: () => void;
  onConfirmDispatch?: (dispatchData: {
    vehicle_number: string;
    driver_name: string;
    driver_phone: string;
    crew_type: 'in_house' | 'client_sourced';
    in_house_workers: CrewMember360[];
    client_crew: Array<{ id: string; name: string; phone: string; notes?: string }>;
    notes: string;
  }) => Promise<void>;
  readOnly?: boolean;
}

export function DeliveryChallanModal({
  order,
  items,
  onClose,
  onConfirmDispatch,
  readOnly = false,
}: DeliveryChallanModalProps) {
  const [vehicleNumber, setVehicleNumber] = useState(order.vehicle_number || order.vehicle_no || 'TS 09 UA 8842');
  const [driverName, setDriverName] = useState(order.driver_name || 'Mohan Babu (Senior Cargo Driver)');
  const [driverPhone, setDriverPhone] = useState(order.driver_phone || '+91 94400 55667');
  const [crewType, setCrewType] = useState<'in_house' | 'client_sourced'>(
    order.assigned_crew_type || order.crew_type || 'in_house'
  );
  const [dispatchNotes, setDispatchNotes] = useState(order.notes || 'All props checked and loaded into padded crates.');

  const [availableCrew, setAvailableCrew] = useState<CrewMember360[]>([]);
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>(['cw-001', 'cw-002']);
  const [clientCrewList, setClientCrewList] = useState<Array<{ id: string; name: string; phone: string; notes?: string }>>(
    order.client_crew_details || [
      { id: 'cc-1', name: 'K. Naresh (Production Grip Lead)', phone: '+91 98480 11223', notes: 'Set Lead' },
    ]
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCrew() {
      const all = await crewHubService.getCrewMembers();
      setAvailableCrew(all);
    }
    loadCrew();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onConfirmDispatch) return;

    try {
      setSubmitting(true);
      const selectedMembers = availableCrew.filter((m) => selectedCrewIds.includes(m.id));
      await onConfirmDispatch({
        vehicle_number: vehicleNumber,
        driver_name: driverName,
        driver_phone: driverPhone,
        crew_type: crewType,
        in_house_workers: selectedMembers,
        client_crew: clientCrewList,
        notes: dispatchNotes,
      });
      onClose();
    } catch (err) {
      console.error('Dispatch confirmation failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 my-auto max-h-[95vh] flex flex-col text-slate-900">
        {/* Controls Header (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 block">
                Logistics Dispatch Pass &amp; Gate Authorization
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Delivery Challan &amp; Cargo Manifest — {order.order_number}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="py-2 px-3.5 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Challan</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Delivery Challan Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 print:p-0">
          {/* Company & Order Top Banner */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-xl tracking-wider text-slate-900">ASHWA</span>
                <span className="text-xs font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded">
                  Delivery Challan &amp; Gate Pass
                </span>
              </div>
              <p className="text-xs text-slate-600 font-semibold">{order.movie_project_name}</p>
              <p className="text-xs text-slate-500">
                Client: <strong className="text-slate-800">{order.client_name}</strong> • Phone: {order.client_phone || '+91 98490 00000'}
              </p>
              <p className="text-xs text-slate-500">
                Destination: <strong className="text-slate-800">{order.shoot_location || 'Ramoji Film City Soundstage'}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <div className="font-mono text-xs font-bold text-slate-900">CHALLAN #{order.order_number.replace('ORD', 'DC')}</div>
              <div className="font-mono text-[11px] text-emerald-700 font-semibold">GATE PASS: {order.gate_pass_number || 'GP-2026-DISPATCH'}</div>
              <div className="text-slate-500 text-[11px]">Shoot Duration: {order.actual_shoot_days || order.rental_days} Days</div>
              <div className="text-slate-400 text-[11px]">Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
            </div>
          </div>

          {/* Form / Inputs Section (Editable if not readOnly) */}
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* 1. Vehicle & Driver Details */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" /> Transit Vehicle &amp; Driver Gate Pass
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Transport Vehicle / Lorry No. <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={readOnly}
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="TS 09 UA 8842"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Driver Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={readOnly}
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Mohan Babu"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-amber-500 disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Driver Mobile Contact <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    disabled={readOnly}
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+91 94400 55667"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-amber-500 disabled:opacity-75"
                  />
                </div>
              </div>
            </div>

            {/* 2. Crew Assignment Toggle: Internal Crew vs Client Sourced */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-amber-600" /> On-Set Prop Handling Crew Assignment
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Allocate handling labor for transit, loading, and set coordination.
                  </p>
                </div>

                {/* Sourcing Toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => setCrewType('in_house')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      crewType === 'in_house'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Our Internal Crew
                  </button>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => setCrewType('client_sourced')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      crewType === 'client_sourced'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Client&apos;s Own Crew
                  </button>
                </div>
              </div>

              {/* Internal Crew Flow */}
              {crewType === 'in_house' ? (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    Select Active Ashwa Field Crew ({selectedCrewIds.length} Selected)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto">
                    {availableCrew.map((member) => {
                      const isSelected = selectedCrewIds.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => {
                            if (readOnly) return;
                            setSelectedCrewIds(
                              isSelected ? selectedCrewIds.filter((id) => id !== member.id) : [...selectedCrewIds, member.id]
                            );
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-50 border-amber-300 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-200 relative overflow-hidden shrink-0">
                              <Image src={member.avatar_url} alt={member.full_name} fill sizes="28px" className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <strong className="text-xs font-bold text-slate-900 truncate block">{member.full_name}</strong>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {member.badge_number} • ₹{member.analytics ? 1000 : 1000}/day
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Client Crew Repeater Flow */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Production House Handlers (Gate Pass Verification)
                    </span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() =>
                          setClientCrewList([
                            ...clientCrewList,
                            { id: `cc-${Date.now()}`, name: '', phone: '', notes: '' },
                          ])
                        }
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {clientCrewList.map((c, idx) => (
                      <div key={c.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 items-center">
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            required
                            disabled={readOnly}
                            placeholder="Full Name (e.g. K. Naresh)"
                            value={c.name}
                            onChange={(e) => {
                              const updated = [...clientCrewList];
                              updated[idx].name = e.target.value;
                              setClientCrewList(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="tel"
                            required
                            disabled={readOnly}
                            placeholder="Mobile (+91)"
                            value={c.phone}
                            onChange={(e) => {
                              const updated = [...clientCrewList];
                              updated[idx].phone = e.target.value;
                              setClientCrewList(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            disabled={readOnly}
                            placeholder="Department / Notes"
                            value={c.notes || ''}
                            onChange={(e) => {
                              const updated = [...clientCrewList];
                              updated[idx].notes = e.target.value;
                              setClientCrewList(updated);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        {!readOnly && (
                          <div className="sm:col-span-1 text-center">
                            <button
                              type="button"
                              onClick={() => setClientCrewList(clientCrewList.filter((_, i) => i !== idx))}
                              disabled={clientCrewList.length <= 1}
                              className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Dispatched Prop Manifest with Snapshot Conditions */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600" /> Dispatched Prop Manifest ({items.length} Props Loaded)
                </span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  Total Replacement Valuation: {formatINR(order.total_replacement_val || 0)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Serial / QR Code</th>
                      <th className="py-2.5 px-3">Prop Particulars</th>
                      <th className="py-2.5 px-3">Warehouse Bay</th>
                      <th className="py-2.5 px-3 text-right">Daily Rate</th>
                      <th className="py-2.5 px-3 text-center">Dispatch Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {item.item_code || 'ASH-OPT-1942'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {item.prop_title}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {item.warehouse_location || 'Floor 1, Shelf B'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatINR(item.daily_rent_price)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Pristine / Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-xs">
              <div>
                <div className="h-10 border-b border-slate-300" />
                <span className="font-bold block mt-1">Lorry Driver &amp; Crew Sign-off</span>
                <span className="text-[10px] text-slate-500">I have verified all props listed above are loaded securely.</span>
              </div>
              <div className="text-right">
                <div className="h-10 border-b border-slate-300" />
                <span className="font-bold block mt-1">For ASHWA Movie Property Rentals Ltd.</span>
                <span className="text-[10px] text-slate-500">Warehouse Dispatch Security In-Charge</span>
              </div>
            </div>

            {/* Footer Buttons (Hidden in Print) */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Close
              </button>
              {!readOnly && onConfirmDispatch && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Truck className="w-4 h-4" />
                  <span>{submitting ? 'Confirming Dispatch...' : 'Confirm & Dispatch to Pipeline'}</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
