'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ChevronRight,
  ShieldCheck,
  Calendar,
  CreditCard,
  History,
  UserCheck,
  Plus,
  Sparkles,
} from 'lucide-react';
import { StaffProfile, StaffPayroll } from '@/types/staff';
import { StaffDirectoryView } from '@/components/staff/StaffDirectoryView';
import { StaffLeaveManager } from '@/components/staff/StaffLeaveManager';
import { StaffPayrollSlip } from '@/components/staff/StaffPayrollSlip';
import { AllStaffActivityLogs } from '@/components/staff/AllStaffActivityLogs';

type StaffModuleTab = 'directory' | 'leaves' | 'payroll' | 'activity';

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState<StaffModuleTab>('directory');
  const [selectedStaffForPayroll, setSelectedStaffForPayroll] = useState<StaffProfile | null>(null);
  const [selectedPayrollForSlip, setSelectedPayrollForSlip] = useState<StaffPayroll | null>(null);

  const handleOpenPayroll = (staff: StaffProfile) => {
    setSelectedStaffForPayroll(staff);
    setSelectedPayrollForSlip(null);
    setActiveTab('payroll');
  };

  const handleOpenPaySlip = (payroll: StaffPayroll) => {
    setSelectedPayrollForSlip(payroll);
    setActiveTab('payroll');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Breadcrumbs & Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
            <Link href="/admin/dashboard" className="hover:text-slate-700 transition-colors">
              Admin
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-500">People &amp; Teams</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-700 font-semibold">Staff Directory &amp; HRMS</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Internal Staff &amp; Operations HRMS
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  <ShieldCheck className="w-3 h-3 text-sky-600" /> Internal Workforce
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Salaried staff directory, platform activity audit trails, leave approvals, and automated monthly payroll calculation.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launchers */}
        <div className="flex items-center gap-2">
          {activeTab !== 'leaves' && (
            <button
              onClick={() => setActiveTab('leaves')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Leave Approvals</span>
            </button>
          )}

          {activeTab !== 'payroll' && (
            <button
              onClick={() => setActiveTab('payroll')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Run Monthly Payroll</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Apple-Microsoft Dynamics Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'directory'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('leaves')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'leaves'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Leave Management &amp; Approvals</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'payroll'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payroll Operations &amp; Salary Slips</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'activity'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Organization Activity Audit Trail</span>
          </button>
        </div>
      </div>

      {/* 3. Tab Contents */}
      <div className="transition-all duration-200">
        {activeTab === 'directory' && (
          <StaffDirectoryView
            onOpenPayrollForStaff={handleOpenPayroll}
            onOpenPaySlip={handleOpenPaySlip}
          />
        )}

        {activeTab === 'leaves' && <StaffLeaveManager />}

        {activeTab === 'payroll' && (
          <StaffPayrollSlip
            initialStaff={selectedStaffForPayroll}
            initialPayroll={selectedPayrollForSlip}
            onClearInitialPayroll={() => setSelectedPayrollForSlip(null)}
          />
        )}

        {activeTab === 'activity' && <AllStaffActivityLogs />}
      </div>
    </div>
  );
}
