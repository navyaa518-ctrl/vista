'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  User,
  ShieldCheck,
  Building,
  DollarSign,
  X,
} from 'lucide-react';
import { StaffLeave, StaffProfile, StaffLeaveStatus, SubmitLeaveInput } from '@/types/staff';
import { staffService } from '@/lib/services/staffService';

export function StaffLeaveManager() {
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | StaffLeaveStatus>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveForm, setLeaveForm] = useState<SubmitLeaveInput>({
    staff_id: '',
    leave_type: 'Casual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    is_paid: true,
    reason: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allLeaves, allStaff] = await Promise.all([
        staffService.getLeaves(undefined, activeFilter),
        staffService.getStaffMembers({ status: 'ACTIVE' }),
      ]);
      setLeaves(allLeaves);
      setStaffList(allStaff);
      if (allStaff.length > 0 && !leaveForm.staff_id) {
        setLeaveForm((prev) => ({ ...prev, staff_id: allStaff[0].id }));
      }
    } catch (e) {
      console.error('Failed to load leaves:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  const handleStatusUpdate = async (
    leaveId: string,
    status: StaffLeaveStatus,
    isPaid: boolean = true
  ) => {
    try {
      await staffService.updateLeaveStatus(leaveId, status, isPaid, 'Admin Supervisor');
      await loadData();
    } catch (e) {
      alert('Failed to update leave status');
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      alert('Please enter a reason for leave.');
      return;
    }
    setSubmitting(true);
    try {
      await staffService.submitLeave(leaveForm);
      setModalOpen(false);
      setLeaveForm({
        staff_id: staffList[0]?.id || '',
        leave_type: 'Casual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        is_paid: true,
        reason: '',
      });
      await loadData();
    } catch (e: any) {
      alert(`Error submitting leave: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const unpaidCount = leaves.filter((l) => l.status === 'APPROVED' && !l.is_paid).length;

  return (
    <div className="space-y-6">
      {/* 1. Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Pending Leave Approvals
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{pendingCount}</div>
          <p className="text-[11px] text-slate-400">Awaiting supervisor review</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Approved Leaves
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">{approvedCount}</div>
          <p className="text-[11px] text-slate-400">Total approved in cycle</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Unpaid Leaves (Deduction)
            </span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono">{unpaidCount}</div>
          <p className="text-[11px] text-slate-400">Deducted during payroll run</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Calendar Year Total
            </span>
            <Calendar className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{leaves.length}</div>
          <p className="text-[11px] text-slate-400">Total logged records</p>
        </div>
      </div>

      {/* 2. Top Filter Bar & Action */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'PENDING', label: `Pending (${pendingCount})` },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Leave Request</span>
        </button>
      </div>

      {/* 3. Leave Requests Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-4">Staff Member &amp; Role</th>
              <th className="py-3.5 px-4">Leave Type</th>
              <th className="py-3.5 px-4">Duration &amp; Dates</th>
              <th className="py-3.5 px-4">Payroll Impact</th>
              <th className="py-3.5 px-4">Reason</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Approval Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-600 mb-2" />
                  Loading leave records...
                </td>
              </tr>
            ) : leaves.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                  No leave requests found for this status.
                </td>
              </tr>
            ) : (
              leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Staff Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {leave.staff_name ? leave.staff_name.charAt(0) : 'S'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{leave.staff_name}</h4>
                        <p className="text-[10px] text-slate-400">
                          {leave.department ? leave.department.replace('_', ' ') : 'Internal Staff'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800">{leave.leave_type} Leave</span>
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-slate-800 font-bold">{leave.total_days} Days</div>
                    <div className="text-slate-400 text-[10px]">
                      {leave.start_date} ➔ {leave.end_date}
                    </div>
                  </td>

                  {/* Payroll Impact */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        leave.is_paid
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {leave.is_paid ? 'Paid (No Cut)' : 'Unpaid (Salary Cut)'}
                    </span>
                  </td>

                  {/* Reason */}
                  <td className="py-3.5 px-4 max-w-[220px]">
                    <p className="text-slate-600 truncate" title={leave.reason}>
                      {leave.reason}
                    </p>
                    {leave.approved_by && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Approved by {leave.approved_by}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        leave.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : leave.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    {leave.status === 'PENDING' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStatusUpdate(leave.id, 'APPROVED', true)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                          title="Approve as standard paid leave"
                        >
                          Approve (Paid)
                        </button>

                        <button
                          onClick={() => handleStatusUpdate(leave.id, 'APPROVED', false)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] transition-colors cursor-pointer"
                          title="Approve but mark unpaid for payroll deduction"
                        >
                          Approve (Unpaid)
                        </button>

                        <button
                          onClick={() => handleStatusUpdate(leave.id, 'REJECTED', false)}
                          className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors cursor-pointer"
                          title="Reject leave request"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        Processed on {leave.updated_at ? new Date(leave.updated_at).toLocaleDateString() : 'N/A'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Log Leave Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Submit Staff Leave Request
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Record casual, sick, or emergency leave in the HRMS ledger.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLeave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Staff Member</label>
                <select
                  value={leaveForm.staff_id}
                  onChange={(e) => setLeaveForm({ ...leaveForm, staff_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.staff_id} - {s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Leave Type</label>
                  <select
                    value={leaveForm.leave_type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                  >
                    <option value="Casual">Casual Leave</option>
                    <option value="Sick">Medical / Sick</option>
                    <option value="Emergency">Emergency Leave</option>
                    <option value="Annual">Annual Vacation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Paid Status</label>
                  <select
                    value={leaveForm.is_paid ? 'PAID' : 'UNPAID'}
                    onChange={(e) =>
                      setLeaveForm({ ...leaveForm, is_paid: e.target.value === 'PAID' })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                  >
                    <option value="PAID">Paid Leave (Standard)</option>
                    <option value="UNPAID">Unpaid (Deducts from Pay)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason / Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Attending family wedding, doctor visit, personal emergency..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                  <span>Record Leave</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
