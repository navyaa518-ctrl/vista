'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  Building,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Briefcase,
  Calendar,
  X,
  UserPlus,
  Download,
} from 'lucide-react';
import {
  StaffProfile,
  StaffDepartment,
  StaffEmploymentStatus,
  CreateStaffInput,
  StaffPayroll,
} from '@/types/staff';
import { staffService } from '@/lib/services/staffService';
import { formatINR } from '@/lib/utils';
import { StaffProfileDrawer } from './StaffProfileDrawer';

interface StaffDirectoryViewProps {
  onOpenPayrollForStaff?: (staff: StaffProfile) => void;
  onOpenPaySlip?: (payroll: StaffPayroll) => void;
}

export function StaffDirectoryView({
  onOpenPayrollForStaff,
  onOpenPaySlip,
}: StaffDirectoryViewProps) {
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<StaffDepartment | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<StaffEmploymentStatus | 'ALL'>('ALL');

  // Drawer
  const [inspectingStaff, setInspectingStaff] = useState<StaffProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateStaffInput>({
    full_name: '',
    email: '',
    phone: '',
    department: 'RENTAL_SALES',
    designation: '',
    base_salary: 50000,
    joining_date: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    emergency_contact: '',
    notes: '',
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await staffService.getStaffMembers({
        department: selectedDept,
        status: selectedStatus,
        search,
      });
      setStaffList(data);
    } catch (e) {
      console.error('Failed to load internal staff directory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [selectedDept, selectedStatus, search]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await staffService.createStaff(createForm);
      setCreateModalOpen(false);
      setCreateForm({
        full_name: '',
        email: '',
        phone: '',
        department: 'RENTAL_SALES',
        designation: '',
        base_salary: 50000,
        joining_date: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        emergency_contact: '',
        notes: '',
      });
      await loadStaff();
    } catch (err: any) {
      alert(`Failed to onboard staff: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleExportCSV = () => {
    const csv = staffService.exportStaffCSV(staffList);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ashwa_internal_staff_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalBaseSalary = staffList.reduce((sum, s) => sum + (Number(s.base_salary) || 0), 0);
  const activeCount = staffList.filter((s) => s.status === 'ACTIVE').length;
  const onLeaveCount = staffList.filter((s) => s.status === 'ON_LEAVE').length;

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

  return (
    <div className="space-y-6">
      {/* 1. Top KPI Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Internal Staff Headcount
            </span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{staffList.length}</div>
          <p className="text-[11px] text-slate-400">Strictly salaried workforce</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Active On Duty
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">{activeCount}</div>
          <p className="text-[11px] text-slate-400">Desk &amp; warehouse floors</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              On Approved Leave
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{onLeaveCount}</div>
          <p className="text-[11px] text-slate-400">Current calendar day</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Monthly Base Payroll
            </span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {formatINR(totalBaseSalary)}
          </div>
          <p className="text-[11px] text-slate-400">Monthly gross commitment</p>
        </div>
      </div>

      {/* 2. Search, Department Filters & Quick Actions */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by Name, Staff ID (ASH-STF-001), Email, Role..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Roster CSV</span>
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Internal Staff</span>
            </button>
          </div>
        </div>

        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1 shrink-0">
            Departments:
          </span>

          {[
            { id: 'ALL', label: 'All Teams' },
            { id: 'RENTAL_SALES', label: 'Rental Sales' },
            { id: 'BILLING', label: 'Billing & Commercial' },
            { id: 'LOGISTICS_FLEET', label: 'Logistics & Fleet' },
            { id: 'AUDITING_GOVERNANCE', label: 'Auditing & Governance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDept(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                selectedDept === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Horizontal High-Density Staff DataTable */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-4">Staff Member &amp; ID</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4">Designation</th>
              <th className="py-3.5 px-4">Contact Info</th>
              <th className="py-3.5 px-4 text-right">Base Salary</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-600 mb-2" />
                  Loading internal workforce directory...
                </td>
              </tr>
            ) : staffList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                  No internal staff found matching your filter criteria.
                </td>
              </tr>
            ) : (
              staffList.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => {
                    setInspectingStaff(member);
                    setDrawerOpen(true);
                  }}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Staff Name & ID */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs">
                        {member.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                            {member.full_name}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          {member.staff_id}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDepartmentBadge(
                        member.department
                      )}`}
                    >
                      {member.department.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Designation */}
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800 block">{member.designation}</span>
                    <span className="text-[10px] text-slate-400">Since {member.joining_date}</span>
                  </td>

                  {/* Contact */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{member.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Base Salary */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                    {formatINR(member.base_salary)}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        member.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : member.status === 'ON_LEAVE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setInspectingStaff(member);
                          setDrawerOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        title="Open 360 Staff Profile"
                      >
                        Profile 360
                      </button>

                      {onOpenPayrollForStaff && (
                        <button
                          onClick={() => onOpenPayrollForStaff(member)}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs border border-sky-200 transition-colors cursor-pointer"
                          title="Run Monthly Payroll Calculation"
                        >
                          Payroll
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Staff Profile 360 Drawer */}
      <StaffProfileDrawer
        staff={inspectingStaff}
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setInspectingStaff(null);
        }}
        onOpenPaySlip={onOpenPaySlip}
      />

      {/* 5. Add Internal Staff Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Onboard Internal Staff Member
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sales executives, commercial billing, fleet logistics, or property auditors.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                    placeholder="e.g. Anand Varma"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                    placeholder="anand@ashwaprops.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                    placeholder="+91 98490 00000"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Department</label>
                  <select
                    value={createForm.department}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, department: e.target.value as StaffDepartment })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                  >
                    <option value="RENTAL_SALES">Rental Sales</option>
                    <option value="BILLING">Billing &amp; Commercial</option>
                    <option value="LOGISTICS_FLEET">Logistics &amp; Fleet</option>
                    <option value="AUDITING_GOVERNANCE">Auditing &amp; Governance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={createForm.designation}
                    onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                    placeholder="e.g. Sales Executive Lead"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Base Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min="10000"
                    step="1000"
                    required
                    value={createForm.base_salary}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, base_salary: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.joining_date}
                    onChange={(e) => setCreateForm({ ...createForm, joining_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={createForm.emergency_contact}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, emergency_contact: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                    placeholder="e.g. Kin / Spouse Phone"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Role Description / Notes</label>
                  <textarea
                    rows={2}
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                    placeholder="Primary job responsibilities, warehouse godown assignment, or clearances..."
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                  <span>Confirm &amp; Onboard</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
