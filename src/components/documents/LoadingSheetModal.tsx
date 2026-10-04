'use client';

import React from 'react';
import Image from 'next/image';
import { Order, OrderItem } from '@/types/database';
import { X, Printer, Truck, CheckSquare, Layers } from 'lucide-react';

interface LoadingSheetModalProps {
  order: Order;
  items: OrderItem[];
  onClose: () => void;
}

export function LoadingSheetModal({ order, items, onClose }: LoadingSheetModalProps) {
  const floor1Items = items.filter((i) => i.floor === 1);
  const floor2Items = items.filter((i) => i.floor === 2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#0f1118] border border-amber-500/40 p-6 shadow-2xl my-auto max-h-[95vh] flex flex-col">
        {/* Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0 no-print">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Warehouse Staging &amp; Lorry Loading Checklist
            </span>
            <h3 className="text-xl font-bold text-white font-serif">
              Loading Sheet for Dispatch Lorry
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Loading Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SHEET */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-black rounded-xl border-2 border-black font-sans print-page">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-black pb-4 mb-4 gap-4">
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
                <h1 className="text-xl sm:text-2xl font-black font-serif tracking-wider text-black">ASHWA WAREHOUSE</h1>
                <p className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-neutral-700">
                  Loading Sheet &amp; Cargo Manifest
                </p>
                <p className="text-[9px] text-neutral-500">
                  Plot 42, Film City Logistics Corridor, Hyderabad, TG 501512
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-bold">ORD: {order.order_number}</div>
              <div className="text-xs text-neutral-600">Vehicle: {order.vehicle_number || 'TS 09 UA 8842'}</div>
              <div className="text-[10px] text-neutral-500">{new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
            </div>
          </div>

          {/* Instructions for Loading Crew */}
          <div className="p-3 bg-neutral-100 rounded border border-neutral-300 text-xs mb-4">
            <strong>Crew Directive:</strong> Floor 1 heavy sets to be loaded first on bottom truck bed. Floor 2 delicate electronic &amp; camera optics to be secured with foam blankets and strapped on top tier.
          </div>

          {/* Floor 1 Section */}
          <div className="mb-6">
            <div className="bg-neutral-800 text-white px-3 py-1.5 rounded-t text-xs font-bold uppercase tracking-wider flex justify-between items-center">
              <span>FLOOR 1: Heavy Sets &amp; Period Furniture ({floor1Items.length} Units)</span>
              <span className="text-[10px] text-neutral-300 font-normal">Ground Level Bay Ramp</span>
            </div>
            <table className="w-full text-left text-xs border border-neutral-300 border-t-0">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-700">
                  <th className="p-2 w-10 text-center">Staged</th>
                  <th className="p-2 w-10 text-center">Loaded</th>
                  <th className="p-2 font-mono">Serial Code</th>
                  <th className="p-2">Item Title</th>
                  <th className="p-2">Warehouse Rack</th>
                  <th className="p-2">Handling Category</th>
                </tr>
              </thead>
              <tbody>
                {floor1Items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-200">
                    <td className="p-2 text-center border-r border-neutral-200">
                      <div className="w-4 h-4 border border-black mx-auto rounded" />
                    </td>
                    <td className="p-2 text-center border-r border-neutral-200">
                      <div className="w-4 h-4 border border-black mx-auto rounded" />
                    </td>
                    <td className="p-2 border-r border-neutral-200 font-mono font-bold">
                      {item.item_serial || 'PENDING'}
                    </td>
                    <td className="p-2 border-r border-neutral-200 font-medium">
                      {item.prop_title}
                    </td>
                    <td className="p-2 border-r border-neutral-200">{item.rack}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 bg-neutral-200 rounded text-[10px] font-semibold">
                        HEAVY / WOOD
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Floor 2 Section */}
          <div className="mb-6">
            <div className="bg-neutral-800 text-white px-3 py-1.5 rounded-t text-xs font-bold uppercase tracking-wider flex justify-between items-center">
              <span>FLOOR 2: Precision Optics, Electronics &amp; Curios ({floor2Items.length} Units)</span>
              <span className="text-[10px] text-neutral-300 font-normal">Climate Level 2 Lift</span>
            </div>
            <table className="w-full text-left text-xs border border-neutral-300 border-t-0">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-700">
                  <th className="p-2 w-10 text-center">Staged</th>
                  <th className="p-2 w-10 text-center">Loaded</th>
                  <th className="p-2 font-mono">Serial Code</th>
                  <th className="p-2">Item Title</th>
                  <th className="p-2">Warehouse Rack</th>
                  <th className="p-2">Handling Category</th>
                </tr>
              </thead>
              <tbody>
                {floor2Items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-200">
                    <td className="p-2 text-center border-r border-neutral-200">
                      <div className="w-4 h-4 border border-black mx-auto rounded" />
                    </td>
                    <td className="p-2 text-center border-r border-neutral-200">
                      <div className="w-4 h-4 border border-black mx-auto rounded" />
                    </td>
                    <td className="p-2 border-r border-neutral-200 font-mono font-bold">
                      {item.item_serial || 'PENDING'}
                    </td>
                    <td className="p-2 border-r border-neutral-200 font-medium">
                      {item.prop_title}
                    </td>
                    <td className="p-2 border-r border-neutral-200">{item.rack}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 bg-neutral-200 text-neutral-800 rounded text-[10px] font-semibold">
                        FRAGILE / CUSHION
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Loader Signoff */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-neutral-300 text-xs">
            <div>
              <div className="h-10 border-b border-neutral-400" />
              <span className="font-bold block mt-1">Lorry Loading Supervisor Sign</span>
              <span className="text-[10px] text-neutral-500">Warehouse Ramp Bay #2</span>
            </div>
            <div>
              <div className="h-10 border-b border-neutral-400" />
              <span className="font-bold block mt-1">Driver In-Cabin Acknowledgment</span>
              <span className="text-[10px] text-neutral-500">Strapped &amp; Tarpaulin Covered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
