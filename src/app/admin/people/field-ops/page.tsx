'use client';

import React from 'react';
import { Truck, MapPin, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function FieldOpsPage() {
  const fleet = [
    { vehicle: 'TS 09 UA 8842 (Ashok Leyland 16ft Covered)', driver: 'Mohan Babu', phone: '+91 94400 55667', destination: 'Ramoji Film City, Studio Floor 14', status: 'In Transit', currentOrder: 'ASH-ORD-2026-0881' },
    { vehicle: 'TS 07 UA 4421 (Eicher 14ft Hydraulic Bed)', driver: 'Suresh Reddy', phone: '+91 98480 99881', destination: 'Annapurna Studios 7 Acres, Soundstage B', status: 'Staged at Loading Bay', currentOrder: 'ASH-ORD-2026-0912' },
    { vehicle: 'AP 11 BA 2390 (Tata 407 Armored Vault Van)', driver: 'Venkat Rao', phone: '+91 99880 33445', destination: 'Saradhi Studios, Courtroom Floor', status: 'Available at Depot', currentOrder: 'None' },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Field Operations &amp; Film Logistics Fleet
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Dedicated movie property lorries, hydraulic lift vans, drivers, and on-set delivery dispatch tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {fleet.map((f, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3.5 shadow-xs hover:shadow-md hover:border-amber-400/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  f.status === 'In Transit'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                    : f.status.includes('Staged')
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {f.status}
                </span>
                <Truck className="w-4 h-4 text-slate-400" />
              </div>

              <h4 className="text-sm font-bold text-slate-900 font-mono mt-2">{f.vehicle}</h4>

              <div className="space-y-1.5 text-xs text-slate-600 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Driver:</span>
                  <strong className="text-slate-900 font-semibold">{f.driver}</strong>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-amber-500" />
                  <span>{f.phone}</span>
                </div>
                <div className="flex items-start gap-1.5 pt-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{f.destination}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Manifest:</span>
              <span className="font-mono text-amber-600 font-semibold">{f.currentOrder}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
