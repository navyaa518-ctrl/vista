'use client';

import React from 'react';
import Image from 'next/image';
import { Order, OrderItem } from '@/types/database';
import { X, Printer, ShieldCheck, Truck } from 'lucide-react';

interface GatePassModalProps {
  order: Order;
  items: OrderItem[];
  onClose: () => void;
}

export function GatePassModal({ order, items, onClose }: GatePassModalProps) {
  const pickedItems = items.filter((i) => i.status === 'picked');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#0f1118] border border-amber-500/40 p-6 shadow-2xl my-auto max-h-[95vh] flex flex-col">
        {/* Modal Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0 no-print">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Security Gate Clearance Document
            </span>
            <h3 className="text-xl font-bold text-white font-serif">
              Official Material Gate Pass
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Gate Pass</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE GATE PASS DOCUMENT */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-black rounded-xl border-2 border-black font-sans print-page">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-black pb-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-44 h-24 sm:w-52 sm:h-28 shrink-0">
                <Image
                  src="/brand/aswa-logo.png"
                  alt="ASWA Movie Props Rental Official Gold Logo"
                  fill
                  sizes="210px"
                  priority
                  className="object-contain object-left"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-serif tracking-wider text-black">ASHWA</h1>
                <p className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-neutral-700">
                  Movie Property Rentals &amp; Logistics Ltd.
                </p>
                <p className="text-[9px] text-neutral-500">
                  Plot 42, Film City Logistics Corridor, Hyderabad, TG 501512 • GSTIN: <strong>36AAACA1122D1Z9</strong>
                </p>
              </div>
            </div>

            <div className="text-right border-2 border-black p-2.5 rounded bg-neutral-50">
              <div className="text-[10px] uppercase font-bold text-neutral-500">Document Type</div>
              <div className="text-sm font-black tracking-wider text-black">
                RETURNABLE GATE PASS
              </div>
              <div className="text-xs font-mono font-bold mt-1">
                GP NO: {order.gate_pass_number || 'GP-2026-0914'}
              </div>
            </div>
          </div>

          {/* Logistics Information Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-neutral-300 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                Order Reference
              </span>
              <span className="font-mono font-bold">{order.order_number}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                Production / Client
              </span>
              <span className="font-bold">{order.production_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                Destination Set
              </span>
              <span>{order.shoot_location}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                Rental Period
              </span>
              <span className="font-semibold">{order.start_date} to {order.end_date} ({order.rental_days} Days)</span>
            </div>
          </div>

          {/* Transporter Details */}
          <div className="my-4 p-3 bg-neutral-100 rounded border border-neutral-300 grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-600 block">
                Transport Vehicle No:
              </span>
              <span className="font-mono font-bold text-sm">
                {order.vehicle_number || 'TS 09 UA 8842'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-600 block">
                Driver Name:
              </span>
              <span className="font-semibold">{order.driver_name || 'Mohan Babu'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-600 block">
                Driver Contact:
              </span>
              <span className="font-mono">{order.driver_phone || '+91 94400 55667'}</span>
            </div>
          </div>

          {/* Serialized Props List */}
          <div className="my-4">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2">
              Authorized Materials for Gate Exit ({pickedItems.length} Scanned Units):
            </h4>
            <table className="w-full text-left text-xs border-collapse border border-neutral-300">
              <thead>
                <tr className="bg-neutral-200 text-neutral-800 border-b border-neutral-300">
                  <th className="p-2 border-r border-neutral-300">#</th>
                  <th className="p-2 border-r border-neutral-300 font-mono">Serial Barcode</th>
                  <th className="p-2 border-r border-neutral-300">Description of Movie Prop</th>
                  <th className="p-2 border-r border-neutral-300">Warehouse Origin</th>
                  <th className="p-2 border-r border-neutral-300">Verified By</th>
                  <th className="p-2 text-right">Repl. Value</th>
                </tr>
              </thead>
              <tbody>
                {pickedItems.map((item, idx) => (
                  <tr key={item.id} className="border-b border-neutral-200">
                    <td className="p-2 border-r border-neutral-200">{idx + 1}</td>
                    <td className="p-2 border-r border-neutral-200 font-mono font-bold">
                      {item.item_serial || 'PENDING-SCAN'}
                    </td>
                    <td className="p-2 border-r border-neutral-200 font-medium">
                      {item.prop_title}
                    </td>
                    <td className="p-2 border-r border-neutral-200">
                      Floor {item.floor}, {item.rack}
                    </td>
                    <td className="p-2 border-r border-neutral-200 text-neutral-600">
                      {item.picked_by_name || 'Floor Executive'}
                    </td>
                    <td className="p-2 text-right font-mono">
                      ₹{item.replacement_value.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notice */}
          <div className="p-2.5 bg-neutral-50 rounded border border-neutral-300 text-[10px] text-neutral-600 mb-6">
            <strong>Security Notice:</strong> All items listed above are property of ASHWA Movie Property Rentals. This gate pass permits transit strictly between the warehouse and the approved shooting location. Any unauthorized transfer or subleasing is strictly prohibited.
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-neutral-300 text-center text-xs">
            <div>
              <div className="h-12 border-b border-neutral-400 flex items-end justify-center pb-1">
                <span className="font-serif italic font-semibold text-neutral-700">Arun Reddy</span>
              </div>
              <span className="font-bold block mt-1">Warehouse Operations Manager</span>
              <span className="text-[10px] text-neutral-500">ASHWA Logistics</span>
            </div>

            <div>
              <div className="h-12 border-b border-neutral-400 flex items-end justify-center pb-1">
                <span className="font-serif italic font-semibold text-neutral-700">Mohan Babu</span>
              </div>
              <span className="font-bold block mt-1">Transporter / Lorry Driver</span>
              <span className="text-[10px] text-neutral-500">Sign &amp; Vehicle Acknowledged</span>
            </div>

            <div>
              <div className="h-12 border-b border-neutral-400 flex items-end justify-center pb-1">
                <span className="font-serif italic font-semibold text-neutral-700">M. Srinivas Rao</span>
              </div>
              <span className="font-bold block mt-1">Security Gate Officer</span>
              <span className="text-[10px] text-neutral-500">Out-Gate Verified &amp; Timestamped</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
