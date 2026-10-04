'use client';

import React from 'react';
import { formatINR } from '@/lib/utils';
import { CreditCard, UserCheck, ShieldCheck, Award } from 'lucide-react';

export default function StaffPayrollPage() {
  const staff = [
    { name: 'Arun Reddy', role: 'Billing & Warehouse Operations Manager', base: 95000, bonus: 15000, floor: 'Facility Manager', status: 'Disbursed' },
    { name: 'Ravi Kumar', role: 'Senior Sales Executive (Floor 1 Lead)', base: 65000, bonus: 18000, floor: 'Floor 1 Specialist', status: 'Disbursed' },
    { name: 'Vikram Singh', role: 'Senior Sales Executive (Floor 2 Lead)', base: 65000, bonus: 16500, floor: 'Floor 2 Specialist', status: 'Disbursed' },
    { name: 'Mohan Babu', role: 'Head of Logistics & Heavy Fleet Driver', base: 45000, bonus: 8000, floor: 'Transport Lead', status: 'Disbursed' },
    { name: 'M. Srinivas Rao', role: 'Chief Security & Gate Pass Officer', base: 40000, bonus: 5000, floor: 'Main Gate Control', status: 'Disbursed' },
  ];

  const totalPayroll = staff.reduce((s, m) => s + m.base + m.bonus, 0);

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Staff Salaries &amp; Payroll Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Warehouse managers, rental sales executives, dispatch lorry drivers, and security personnel.
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
          <span className="text-slate-500 font-semibold uppercase tracking-wider">Monthly Payroll Disbursal</span>
          <span className="font-bold text-slate-900 text-sm">
            Total Disbursed: <strong className="text-emerald-600 font-mono text-base">{formatINR(totalPayroll)}</strong>
          </span>
        </div>

        <div className="space-y-2">
          {staff.map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-bold text-slate-900">{m.name}</h4>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {m.role} • <span className="text-sky-700 font-medium">{m.floor}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-slate-900 text-sm">
                  {formatINR(m.base + m.bonus)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Base: {formatINR(m.base)} + Incentive: {formatINR(m.bonus)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
