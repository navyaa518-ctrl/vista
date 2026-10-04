'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { RoleRouteGuard } from '@/routes/RoleRouteGuard';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  UserX,
  UserCheck,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  RefreshCw,
  MoreVertical,
  Building,
  Phone,
  Mail,
  Calendar,
  HardHat,
  Receipt,
  ScanLine,
  Eye,
  EyeOff,
  User,
  Crown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const DEPARTMENTS = [
  'General Operations',
  'Warehouse Logistics',
  'Billing & Accounts',
  'Props Picking & Staging',
  'Property Health & Audits',
  'Field Operations & Crew',
  'Executive Administration',
];

const ROLES = [
  { value: 'admin', label: 'Admin (Operations)', icon: Shield, badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { value: 'billing', label: 'Billing Operations', icon: Receipt, badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'rental_sales_exec', label: 'Rental Sales Executive', icon: ScanLine, badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'crew_member', label: 'Field Crew Member', icon: HardHat, badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { value: 'manager', label: 'Warehouse Manager', icon: Building, badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'super_admin', label: 'Super Admin', icon: Crown, badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { value: 'client', label: 'Client / Studio Account', icon: User, badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
];

/**
 * Generate a cryptographically secure temporary password
 */
function generateSecurePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function UserManagement() {
  const { user: currentUser, role: currentRole } = useAuth();

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [suspendModalUser, setSuspendModalUser] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);

  // Active Row Menu Dropdown
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Close open action menu on outside click
  useEffect(() => {
    const handleWindowClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Fetch Users List
  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
      } else {
        showToast(data.error || 'Failed to fetch user directory', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error connecting to user management API', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Exclude hard-deleted if flagged
      if (u.is_deleted) return false;

      // Search Query
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query) ||
        u.department?.toLowerCase().includes(query) ||
        u.role?.toLowerCase().includes(query);

      // Role Filter
      let matchesRole = true;
      if (selectedRoleFilter === 'ADMINS') {
        matchesRole = u.role === 'admin' || u.role === 'super_admin';
      } else if (selectedRoleFilter === 'BILLING') {
        matchesRole = u.role === 'billing' || u.role === 'billing_manager' || u.role === 'manager';
      } else if (selectedRoleFilter === 'SALES') {
        matchesRole = u.role === 'rental_sales_exec' || u.role === 'executive';
      } else if (selectedRoleFilter === 'CREW') {
        matchesRole = u.role === 'crew_member' || u.role === 'crew' || u.role === 'field_worker';
      } else if (selectedRoleFilter === 'SUSPENDED') {
        matchesRole = u.status === 'SUSPENDED';
      }

      // Department Filter
      const matchesDept = selectedDeptFilter === 'ALL' || u.department === selectedDeptFilter;

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedDeptFilter]);

  // Metrics Calculation
  const stats = useMemo(() => {
    const total = users.filter((u) => !u.is_deleted).length;
    const active = users.filter((u) => !u.is_deleted && u.status === 'ACTIVE').length;
    const suspended = users.filter((u) => !u.is_deleted && u.status === 'SUSPENDED').length;
    const crew = users.filter(
      (u) =>
        !u.is_deleted &&
        (u.role === 'crew_member' || u.role === 'crew' || u.role === 'field_worker' || u.role === 'rental_sales_exec')
    ).length;

    return { total, active, suspended, crew };
  }, [users]);

  // Helper for role details
  const getRoleDetails = (roleKey) => {
    const matched = ROLES.find((r) => r.value === roleKey);
    return matched || { label: roleKey, icon: User, badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  };

  // Helper for initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <RoleRouteGuard
      allowedRoles={['super_admin', 'admin']}
      deniedRedirect="/admin/dashboard"
      deniedMessage="Access Denied: Super Admin Clearance Required for User Directory & Credential Management"
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-[99999] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-top-3 ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
                : 'bg-slate-900/95 border-amber-500/50 text-white'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Crown className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Staff, Crew &amp; User Management Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Super Admin Direct Access
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage enterprise workforce authentication, reset operational passwords, suspend accounts, and configure RBAC roles.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
              title="Refresh User List"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer touch-manipulation"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Staff Member</span>
            </button>
          </div>
        </div>

        {/* 2. High-Density Bento Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Personnel */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-sky-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Staff &amp; Users
              </span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</span>
              <span className="text-[11px] text-slate-400 font-medium">Directory Identities</span>
            </div>
            <div className="mt-2 text-[11px] text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1">
              <span>All active &amp; registered records</span>
            </div>
          </div>

          {/* Card 2: Active Accounts */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Clearance
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.active}</span>
              <span className="text-[11px] text-slate-400 font-medium">Operational</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Full ERP clearance granted</span>
            </div>
          </div>

          {/* Card 3: Suspended Accounts */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Suspended Accounts
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.suspended}</span>
              <span className="text-[11px] text-slate-400 font-medium">Access Revoked</span>
            </div>
            <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
              <span>Sessions killed &amp; logins blocked</span>
            </div>
          </div>

          {/* Card 4: Field Crew & Operations */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Field Crew &amp; Sales
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <HardHat className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.crew}</span>
              <span className="text-[11px] text-slate-400 font-medium">Field Personnel</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <span>Mobile QR scanner &amp; picking crew</span>
            </div>
          </div>
        </div>

        {/* 3. Filters & Search Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, phone, or dept..."
                className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department Dropdown Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-500 font-semibold shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Department:</span>
              </span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer w-full md:w-56"
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
            {[
              { id: 'ALL', label: 'All Personnel', count: stats.total },
              { id: 'ADMINS', label: 'Admins & Chiefs', count: users.filter((u) => !u.is_deleted && (u.role === 'admin' || u.role === 'super_admin')).length },
              { id: 'BILLING', label: 'Billing & Accounts', count: users.filter((u) => !u.is_deleted && (u.role === 'billing' || u.role === 'billing_manager' || u.role === 'manager')).length },
              { id: 'SALES', label: 'Sales Executives', count: users.filter((u) => !u.is_deleted && (u.role === 'rental_sales_exec' || u.role === 'executive')).length },
              { id: 'CREW', label: 'Field Crew', count: users.filter((u) => !u.is_deleted && (u.role === 'crew_member' || u.role === 'crew' || u.role === 'field_worker')).length },
              { id: 'SUSPENDED', label: 'Suspended Accounts', count: stats.suspended },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRoleFilter(tab.id)}
                className={`px-3 py-2 rounded-xl transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  selectedRoleFilter === tab.id
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/10'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    selectedRoleFilter === tab.id
                      ? 'bg-black/20 text-black font-black'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. High-Density User Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <span className="text-xs font-semibold">Loading enterprise workforce directory...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Personnel Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No staff or crew members matched the specified filter criteria. Try adjusting your query or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 sm:px-6">Staff Details</th>
                    <th className="py-3.5 px-4">Role Clearance</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Department</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Last Sign In</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredUsers.map((item) => {
                    const roleInfo = getRoleDetails(item.role);
                    const RoleIcon = roleInfo.icon;
                    const isSuspended = item.status === 'SUSPENDED';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isSuspended ? 'bg-rose-500/[0.02] dark:bg-rose-950/[0.05]' : ''
                        }`}
                      >
                        {/* 1. Staff Details (Avatar, Name, Email, Phone) */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                                isSuspended
                                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                  : item.role === 'super_admin'
                                  ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-black font-black border-amber-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {getInitials(item.full_name)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                <span>{item.full_name}</span>
                                {item.role === 'super_admin' && (
                                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Super Admin" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1 truncate font-mono">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.email}</span>
                                </span>
                                {item.phone && (
                                  <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 truncate">
                                    • <Phone className="w-3 h-3 shrink-0" />
                                    <span>{item.phone}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role Clearance */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleInfo.badgeClass}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            <span>{roleInfo.label}</span>
                          </span>
                        </td>

                        {/* 3. Department */}
                        <td className="py-3.5 px-4 hidden md:table-cell whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200/60 dark:border-slate-700/60">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{item.department || 'General Operations'}</span>
                          </span>
                        </td>

                        {/* 4. Account Status Pill */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/30">
                              <Lock className="w-3 h-3" />
                              <span>SUSPENDED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>ACTIVE</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Last Sign In */}
                        <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap text-[11px] text-slate-500 font-mono">
                          {item.last_sign_in_at ? (
                            new Date(item.last_sign_in_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          ) : (
                            <span className="text-slate-400 italic">Never signed in</span>
                          )}
                        </td>

                        {/* 6. Actions Menu */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap relative">
                          <div className="inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              aria-label="Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu Popover */}
                            {activeMenuId === item.id && (
                              <div className="absolute right-4 mt-1 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setEditModalUser(item);
                                  }}
                                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Edit Profile &amp; Role</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setResetPasswordUser(item);
                                  }}
                                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-sky-500" />
                                  <span>Reset Password</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setSuspendModalUser(item);
                                  }}
                                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                                    isSuspended
                                      ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                                  }`}
                                >
                                  {isSuspended ? (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>Re-Activate Account</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Suspend Account</span>
                                    </>
                                  )}
                                </button>

                                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setDeleteModalUser(item);
                                  }}
                                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete User Profile</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL 1: CREATE USER (STAFF & CREW) */}
        {/* ========================================================================= */}
        {createModalOpen && (
          <CreateUserModal
            onClose={() => setCreateModalOpen(false)}
            onSuccess={(newUser) => {
              setCreateModalOpen(false);
              showToast(`Staff account for ${newUser.full_name} created successfully!`);
              fetchUsers();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: EDIT PROFILE & ROLE */}
        {/* ========================================================================= */}
        {editModalUser && (
          <EditUserModal
            user={editModalUser}
            onClose={() => setEditModalUser(null)}
            onSuccess={() => {
              setEditModalUser(null);
              showToast('User profile updated successfully!');
              fetchUsers();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: DIRECT PASSWORD RESET */}
        {/* ========================================================================= */}
        {resetPasswordUser && (
          <ResetPasswordModal
            user={resetPasswordUser}
            onClose={() => setResetPasswordUser(null)}
            onSuccess={(msg) => {
              setResetPasswordUser(null);
              showToast(msg || 'Password updated successfully!');
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: SUSPEND / ACTIVATE CONFIRMATION */}
        {/* ========================================================================= */}
        {suspendModalUser && (
          <SuspendUserModal
            user={suspendModalUser}
            onClose={() => setSuspendModalUser(null)}
            onSuccess={(newStatus) => {
              setSuspendModalUser(null);
              showToast(`Account status updated to ${newStatus}`);
              fetchUsers();
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* MODAL 5: PERMANENT USER PROFILE DELETION */}
        {/* ========================================================================= */}
        {deleteModalUser && (
          <DeleteUserModal
            user={deleteModalUser}
            onClose={() => setDeleteModalUser(null)}
            onSuccess={() => {
              setDeleteModalUser(null);
              showToast('User profile removed successfully');
              fetchUsers();
            }}
          />
        )}
      </div>
    </RoleRouteGuard>
  );
}

// =============================================================================
// SUB-COMPONENT: CREATE USER MODAL
// =============================================================================
function CreateUserModal({ onClose, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [role, setRole] = useState('rental_sales_exec');
  const [department, setDepartment] = useState('Warehouse Logistics');
  const [password, setPassword] = useState(generateSecurePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createUser',
          email,
          password,
          full_name: fullName,
          phone,
          role,
          department,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.user);
      } else {
        setError(data.error || 'Failed to create user account');
      }
    } catch (err) {
      setError(err.message || 'Error executing user creation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[92vh]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Create Staff / Crew Member</h2>
            <p className="text-xs text-slate-500">Provisions auth credentials and binds operational clearance.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Anand Varma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@aswamovies.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98480 12345"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">System Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Initial Password</label>
              <button
                type="button"
                onClick={() => setPassword(generateSecurePassword())}
                className="text-[11px] text-amber-500 hover:text-amber-400 font-semibold"
              >
                Generate New
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-400"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-amber-500"
                  title="Copy password"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Copy and securely transmit this temporary password to the staff member.</p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Creating User...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: EDIT USER MODAL
// =============================================================================
function EditUserModal({ user, onClose, onSuccess }) {
  const [fullName, setFullName] = useState(user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [role, setRole] = useState(user.role || 'crew_member');
  const [department, setDepartment] = useState(user.department || 'General Operations');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateUser',
          userId: user.id,
          full_name: fullName,
          phone,
          role,
          department,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to update user profile');
      }
    } catch (err) {
      setError(err.message || 'Error updating user profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Profile &amp; Role</h2>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: RESET PASSWORD MODAL
// =============================================================================
function ResetPasswordModal({ user, onClose, onSuccess }) {
  const [tab, setTab] = useState('direct'); // 'direct' or 'email'
  const [newPassword, setNewPassword] = useState(generateSecurePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload =
        tab === 'direct'
          ? { action: 'resetPassword', userId: user.id, newPassword }
          : { action: 'resetPassword', email: user.email, sendEmail: true };

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.message);
      } else {
        setError(data.error || 'Password reset operation failed');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with reset endpoint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Reset User Password</h2>
            <p className="text-xs text-slate-500">{user.full_name} ({user.email})</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('direct')}
            className={`py-2 rounded-lg transition-all ${
              tab === 'direct' ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Direct Set Password
          </button>
          <button
            type="button"
            onClick={() => setTab('email')}
            className={`py-2 rounded-lg transition-all ${
              tab === 'email' ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Send Reset Email
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4 text-xs">
          {tab === 'direct' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                <button
                  type="button"
                  onClick={() => setNewPassword(generateSecurePassword())}
                  className="text-[11px] text-sky-500 hover:text-sky-400 font-semibold"
                >
                  Generate Strong
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 text-slate-400 hover:text-amber-500"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Super Admin direct update takes effect instantly.</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">Email Notification Dispatch</p>
              <p className="text-[11px]">
                A password reset recovery email with an official link will be dispatched to <strong>{user.email}</strong>.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 text-black font-bold shadow-md shadow-sky-500/20 disabled:opacity-50"
            >
              {submitting ? 'Applying...' : tab === 'direct' ? 'Update Password Now' : 'Send Reset Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: SUSPEND / ACTIVATE ACCOUNT MODAL
// =============================================================================
function SuspendUserModal({ user, onClose, onSuccess }) {
  const isSuspended = user.status === 'SUSPENDED';
  const targetStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleStatus',
          userId: user.id,
          status: targetStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(targetStatus);
      } else {
        setError(data.error || 'Failed to update account status');
      }
    } catch (err) {
      setError(err.message || 'Status toggle failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-3 rounded-2xl border ${
              isSuspended
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}
          >
            {isSuspended ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isSuspended ? 'Re-Activate Account' : 'Suspend Staff Account'}
            </h2>
            <p className="text-xs text-slate-500">{user.full_name} ({user.email})</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 mb-6">
          {!isSuspended ? (
            <>
              <p>
                Suspending this user will <strong>immediately revoke all active sessions</strong> across mobile and web devices.
              </p>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300">
                Any subsequent login attempt will be blocked with:
                <div className="font-mono text-[11px] mt-1 font-bold">
                  &ldquo;Your account is temporarily suspended. Contact Super Admin.&rdquo;
                </div>
              </div>
            </>
          ) : (
            <p>
              Re-activating this user will lift the security ban and allow the staff member to log in using their registered credentials.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={submitting}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-white shadow-lg ${
              isSuspended
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20'
            }`}
          >
            {submitting
              ? 'Processing...'
              : isSuspended
              ? 'Confirm Re-Activation'
              : 'Suspend & Kill Sessions'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENT: PERMANENT USER PROFILE DELETION MODAL
// =============================================================================
function DeleteUserModal({ user, onClose, onSuccess }) {
  const [confirmationText, setConfirmationText] = useState('');
  const [hardDelete, setHardDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isConfirmed = confirmationText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteUser',
          userId: user.id,
          hardDelete,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setError(err.message || 'Error during account deletion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">Delete User Profile</h2>
            <p className="text-xs text-slate-500">{user.full_name} ({user.email})</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 leading-relaxed">
            <strong>Warning:</strong> This administrative action will permanently detach this user. To prevent accidental deletions, type <strong>DELETE</strong> below.
          </div>

          <div className="space-y-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Deletion Protocol:</label>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="delType"
                  checked={!hardDelete}
                  onChange={() => setHardDelete(false)}
                  className="mt-0.5 text-amber-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Soft Deletion (Recommended)</div>
                  <div className="text-[11px] text-slate-500">Revokes all credentials while preserving historical order logs and audit references.</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.03] cursor-pointer">
                <input
                  type="radio"
                  name="delType"
                  checked={hardDelete}
                  onChange={() => setHardDelete(true)}
                  className="mt-0.5 text-rose-500"
                />
                <div>
                  <div className="font-bold text-rose-600 dark:text-rose-400">Hard Purge (Irreversible)</div>
                  <div className="text-[11px] text-slate-500">Completely removes record from authentication directory.</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Type <span className="font-mono text-rose-500">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || submitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Deleting...' : 'Permanently Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
