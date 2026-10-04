'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
  CreditCard,
  History,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ChevronRight,
  TrendingUp,
  Award,
  DollarSign,
  Tag,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { StaffProfile, StaffActivityLog, StaffLeave, StaffPayroll } from '@/types/staff';
import { auditLogService } from '@/lib/services/auditLogService';
import { staffService } from '@/lib/services/staffService';
import { formatINR } from '@/lib/utils';

interface StaffProfileDrawerProps {
  staff: StaffProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPaySlip?: (payroll: StaffPayroll) => void;
}

type DrawerTab = 'overview' | 'activity' | 'leaves' | 'payroll';

export function StaffProfileDrawer({
  staff,
  isOpen,
  onClose,
  onOpenPaySlip,
}: StaffProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');
  const [activities, setActivities] = useState<StaffActivityLog[]>([]);
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [payrolls, setPayrolls] = useState<StaffPayroll[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && staff) {
      loadDetails();
    }
  }, [isOpen, staff]);

  const loadDetails = async () => {
    if (!staff) return;
    setLoading(true);
    try {
      const [actLogs, lvList, payList] = await Promise.all([
        auditLogService.getStaffActivityLogs(staff.id, 50),
        staffService.getLeaves(staff.id),
        staffService.getPayrolls(staff.id),
      ]);
      setActivities(actLogs);
      setLeaves(lvList);
      setPayrolls(payList);
    } catch (e) {
      console.error('Failed to load staff details:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !staff) return null;

  const getDepartmentBadge = (dept: string) => {
    switch (dept) {
      case 'RENTAL_SALES':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'BILLING':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'LOGISTICS_FLEET':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'AUDITING_GOVERNANCE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ORDER_DISPATCHED':
        return 'bg-emerald-100 text-emerald-800';
      case 'PROPERTY_INSPECTED':
        return 'bg-purple-100 text-purple-800';
      case 'INVOICE_CREATED':
        return 'bg-sky-100 text-sky-800';
      case 'RETURN_CLEARED':
        return 'bg-amber-100 text-amber-800';
      case 'PAYROLL_GENERATED':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Slide-over panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                {staff.full_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
                    {staff.staff_id}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      staff.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : staff.status === 'ON_LEAVE'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {staff.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold mt-1 text-white tracking-tight">
                  {staff.full_name}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {staff.designation} •{' '}
                  <span className="text-sky-300 font-semibold">{staff.department.replace('_', ' ')}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-Tabs Bar */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>360 Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Activity Trail ({activities.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'leaves'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Leave Ledger ({leaves.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'payroll'
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Salary Slips ({payrolls.length})</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Highlights Card */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Base Monthly Salary
                    </span>
                    <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
                      {formatINR(staff.base_salary)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Verified Internal</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Joining Date
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900 mt-1.5 block">
                      {staff.joining_date}
                    </span>
                    <span className="text-[10px] text-slate-400">Tenure Active</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Approved Leaves Taken
                    </span>
                    <span className="text-lg font-bold font-mono text-sky-600 mt-1 block">
                      {leaves.filter((l) => l.status === 'APPROVED').reduce((acc, l) => acc + l.total_days, 0)}{' '}
                      Days
                    </span>
                    <span className="text-[10px] text-slate-400">Calendar Year 2026</span>
                  </div>
                </div>

                {/* Professional & Contact Info */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Employment &amp; Contact Records
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDepartmentBadge(
                        staff.department
                      )}`}
                    >
                      {staff.department}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        Corporate Email
                      </span>
                      <span className="font-semibold text-slate-900 font-mono">{staff.email}</span>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        Mobile Contact
                      </span>
                      <span className="font-semibold text-slate-900 font-mono">
                        {staff.phone || 'Not Registered'}
                      </span>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-slate-400" />
                        Emergency Contact
                      </span>
                      <span className="font-semibold text-slate-900 font-mono">
                        {staff.emergency_contact || 'N/A'}
                      </span>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        Facility Department
                      </span>
                      <span className="font-semibold text-slate-900">{staff.department.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Supervisor Notes */}
                {staff.notes && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                    <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      Role Assignment &amp; Operations Brief
                    </span>
                    <p className="text-amber-800 leading-relaxed">{staff.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SYSTEM ACTIVITY TRAIL */}
            {activeTab === 'activity' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Platform Action Audit Trail
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Captured by System Audit Interceptor
                  </span>
                </div>

                {activities.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No system activity recorded yet under this staff ID.
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                    {activities.map((act) => (
                      <div key={act.id} className="relative group">
                        {/* Timeline Bullet */}
                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-sky-600 group-hover:scale-125 transition-transform" />

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getActionBadge(
                                act.action_type
                              )}`}
                            >
                              {act.action_type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(act.created_at).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">
                              Target: {act.target_entity} •{' '}
                              <strong className="font-mono text-sky-700">{act.entity_id}</strong>
                            </span>
                          </div>

                          {/* Metadata pill list */}
                          {act.metadata && Object.keys(act.metadata).length > 0 && (
                            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                              {Object.entries(act.metadata).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600"
                                >
                                  <strong>{key}:</strong> {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LEAVE LEDGER */}
            {activeTab === 'leaves' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Staff Leave History &amp; Balances
                  </h3>
                </div>

                {leaves.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No leave requests logged for this staff member.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaves.map((leave) => (
                      <div
                        key={leave.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{leave.leave_type} Leave</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                leave.is_paid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {leave.is_paid ? 'Paid Leave' : 'Unpaid (Payroll Deduction)'}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              leave.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : leave.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {leave.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                          <span>
                            From: <strong className="text-slate-800">{leave.start_date}</strong>
                          </span>
                          <span>
                            To: <strong className="text-slate-800">{leave.end_date}</strong>
                          </span>
                          <span>
                            Total: <strong className="text-sky-700">{leave.total_days} Days</strong>
                          </span>
                        </div>

                        <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                          &quot;{leave.reason}&quot;
                        </p>

                        {leave.approved_by && (
                          <div className="text-[10px] text-slate-400">
                            Approved by <strong>{leave.approved_by}</strong> on{' '}
                            {leave.approved_at ? new Date(leave.approved_at).toLocaleDateString() : 'N/A'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SALARY & PAYROLL HISTORY */}
            {activeTab === 'payroll' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Disbursed Salaries &amp; Official Slips
                  </h3>
                </div>

                {payrolls.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No past payroll records found for this staff member.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payrolls.map((pay) => (
                      <div
                        key={pay.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {pay.pay_month} {pay.pay_year}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {pay.payment_status}
                            </span>
                          </div>
                          <p className="text-slate-400 font-mono text-[11px]">
                            Ref: {pay.payment_ref} • {pay.payment_mode} • {pay.days_worked}/{pay.total_days}{' '}
                            Days
                          </p>
                          {pay.unpaid_leave_days > 0 && (
                            <p className="text-rose-600 text-[10px] font-medium">
                              - Deducted {pay.unpaid_leave_days} unpaid days ({formatINR(pay.deductions)})
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Net Disbursed
                            </span>
                            <span className="font-mono font-bold text-base text-slate-900">
                              {formatINR(pay.net_salary)}
                            </span>
                          </div>

                          <button
                            onClick={() => onOpenPaySlip?.(pay)}
                            className="p-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-xs"
                            title="Generate Official Salary Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Pay Slip</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
