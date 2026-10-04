'use client';

import React from 'react';
import { formatINR } from '@/lib/utils';
import { DollarSign, Building, Truck, ShieldAlert, Plus } from 'lucide-react';

export default function OperatingExpensesPage() {
  const expenses = [
    { title: 'Warehouse Electricity & 24/7 Precision HVAC (Floor 2)', category: 'Utilities', amount: 84000, date: '01 Sep 2026', status: 'Paid' },
    { title: 'Fleet Diesel & Maintenance (3 Lorry Vans)', category: 'Logistics', amount: 48500, date: '04 Sep 2026', status: 'Paid' },
    { title: 'Teakwood Restoration & Prop Polishing Supplies', category: 'Maintenance', amount: 32000, date: '06 Sep 2026', status: 'Paid' },
    { title: 'Thermal QR Label Paper Rolls (30,000 stickers)', category: 'Operations', amount: 14500, date: '08 Sep 2026', status: 'Paid' },
    { title: 'Comprehensive Film Prop Warehouse Insurance Premium', category: 'Insurance', amount: 125000, date: '10 Sep 2026', status: 'Scheduled' },
  ];

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Operating Expenses &amp; Warehouse Overheads
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logistics, facility maintenance, restoration materials, and operational expenditures.
          </p>
        </div>

        <button className="py-2 px-3.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>Log Expense</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
          <span className="text-slate-500 font-semibold uppercase tracking-wider">September 2026 Overheads</span>
          <span className="font-bold text-slate-900 text-sm">
            Total Monthly Outflow: <strong className="text-rose-600 font-mono text-base">{formatINR(totalExpense)}</strong>
          </span>
        </div>

        <div className="space-y-2">
          {expenses.map((exp, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-bold text-slate-900">{exp.title}</h4>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Category: <span className="text-sky-700 font-medium">{exp.category}</span> • Date: {exp.date}
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-slate-900 text-sm">
                  {formatINR(exp.amount)}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  exp.status === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {exp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
