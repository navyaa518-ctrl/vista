'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Copy,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  Info,
  Building2,
  Sliders,
  Check,
  X,
  Lock,
} from 'lucide-react';
import { rbacService } from '@/lib/services/rbac';
import {
  SecurityRole,
  EntityName,
  PermissionAction,
  AccessScope,
  ENTITY_METADATA,
  ACTION_METADATA,
  SCOPE_CONFIG,
  RolePrivileges,
} from '@/types/rbac';

const ENTITY_LIST: EntityName[] = [
  'props_catalog',
  'walkin_orders',
  'live_picking',
  'rental_pipeline',
  'invoices',
  'financials',
  'system_settings',
];

const ACTION_LIST: PermissionAction[] = [
  'create',
  'read',
  'update',
  'delete',
  'append_scan',
  'dispatch_pass',
];

const NEXT_SCOPE_MAP: Record<AccessScope, AccessScope> = {
  none: 'user',
  user: 'team',
  team: 'org',
  org: 'none',
};

export default function SecurityRolesPage() {
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [activePrivileges, setActivePrivileges] = useState<RolePrivileges | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Clone Modal State
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneTargetRole, setCloneTargetRole] = useState<SecurityRole | null>(null);
  const [clonedRoleName, setClonedRoleName] = useState('');

  // Load Roles
  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await rbacService.getSecurityRoles();
      setRoles(data);
      if (data.length > 0 && !selectedRoleId) {
        setSelectedRoleId(data[0].id);
        setActivePrivileges(JSON.parse(JSON.stringify(data[0].privileges)));
      } else if (selectedRoleId) {
        const found = data.find((r) => r.id === selectedRoleId);
        if (found) {
          setActivePrivileges(JSON.parse(JSON.stringify(found.privileges)));
        }
      }
    } catch (e) {
      console.error('Failed to load roles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  // Switch Selected Role
  const handleSelectRole = (r: SecurityRole) => {
    setSelectedRoleId(r.id);
    setActivePrivileges(JSON.parse(JSON.stringify(r.privileges)));
    setSaveSuccess(false);
  };

  // Cycle Scope on Cell Click
  const handleCycleScope = (entity: EntityName, action: PermissionAction) => {
    if (!activePrivileges) return;
    const current = activePrivileges[entity]?.[action] || 'none';
    const next = NEXT_SCOPE_MAP[current];

    setActivePrivileges({
      ...activePrivileges,
      [entity]: {
        ...activePrivileges[entity],
        [action]: next,
      },
    });
    setSaveSuccess(false);
  };

  // Bulk Set Entire Row
  const handleSetRowScope = (entity: EntityName, targetScope: AccessScope) => {
    if (!activePrivileges) return;
    const updatedRow = { ...activePrivileges[entity] };
    ACTION_LIST.forEach((act) => {
      updatedRow[act] = targetScope;
    });
    setActivePrivileges({
      ...activePrivileges,
      [entity]: updatedRow,
    });
    setSaveSuccess(false);
  };

  // Bulk Set Entire Column
  const handleSetColumnScope = (action: PermissionAction, targetScope: AccessScope) => {
    if (!activePrivileges) return;
    const updated = { ...activePrivileges };
    ENTITY_LIST.forEach((ent) => {
      updated[ent] = {
        ...updated[ent],
        [action]: targetScope,
      };
    });
    setActivePrivileges(updated);
    setSaveSuccess(false);
  };

  // Save Role Changes
  const handleSaveChanges = async () => {
    if (!selectedRole || !activePrivileges) return;
    setSaving(true);
    try {
      await rbacService.updateSecurityRole(selectedRole.id, {
        privileges: activePrivileges,
      });
      await loadRoles();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save role privileges:', e);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Create New Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    // Default template with 'none'
    const defaultPrivs: RolePrivileges = {} as RolePrivileges;
    ENTITY_LIST.forEach((ent) => {
      defaultPrivs[ent] = {
        create: 'none',
        read: 'user',
        update: 'none',
        delete: 'none',
        append_scan: 'none',
        dispatch_pass: 'none',
      };
    });

    const created = await rbacService.createSecurityRole({
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || 'Custom operational security role.',
      privileges: defaultPrivs,
    });

    setCreateModalOpen(false);
    setNewRoleName('');
    setNewRoleDesc('');
    await loadRoles();
    setSelectedRoleId(created.id);
    setActivePrivileges(created.privileges);
  };

  // Clone Role
  const handleCloneRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneTargetRole || !clonedRoleName.trim()) return;

    const cloned = await rbacService.cloneSecurityRole(cloneTargetRole.id, clonedRoleName.trim());
    if (cloned) {
      setCloneModalOpen(false);
      setCloneTargetRole(null);
      setClonedRoleName('');
      await loadRoles();
      setSelectedRoleId(cloned.id);
      setActivePrivileges(cloned.privileges);
    }
  };

  // Delete Role
  const handleDeleteRole = async (r: SecurityRole) => {
    if (r.is_system) {
      alert('System security roles cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete security role "${r.name}"?`)) return;

    try {
      await rbacService.deleteSecurityRole(r.id);
      const remaining = roles.filter((item) => item.id !== r.id);
      setRoles(remaining);
      if (selectedRoleId === r.id && remaining.length > 0) {
        setSelectedRoleId(remaining[0].id);
        setActivePrivileges(remaining[0].privileges);
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting role.');
    }
  };

  return (
    <div className="space-y-6 text-slate-900 pb-20">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 uppercase tracking-wider">
            <Link href="/admin/settings" className="hover:underline text-slate-500">
              System Settings
            </Link>
            <span className="text-slate-300">/</span>
            <span>Dynamics 365 RBAC Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-sky-600" />
            <span>Security Roles &amp; Granular Privilege Matrix</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure entity permissions, depth scopes (User, Team, Org), and operational clearances across the enterprise.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/settings/teams"
            className="py-2.5 px-3.5 rounded-xl font-semibold text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-sky-600" />
            <span>Configure Teams &amp; Groups</span>
          </Link>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Security Role</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMICS 365 SCOPE HIERARCHY LEGEND */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <Info className="w-4 h-4 text-sky-600" />
          <span>Access Scope Depth:</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {(['none', 'user', 'team', 'org'] as AccessScope[]).map((scopeKey) => {
            const conf = SCOPE_CONFIG[scopeKey];
            return (
              <div
                key={scopeKey}
                className={`px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 ${conf.badgeClass}`}
              >
                <span>{conf.symbol}</span>
                <span>{conf.label}</span>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 italic">
          Tip: Click any circular badge in the matrix to cycle privilege scope.
        </div>
      </div>

      {/* 3. MAIN SPLIT VIEW: ROLE SELECTOR RAIL + ENTITY MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Rail: Security Roles List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Security Roles ({roles.length})
            </span>
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = r.id === selectedRole?.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 relative group ${
                    isSelected
                      ? 'bg-sky-50/60 border-sky-300 shadow-xs ring-1 ring-sky-400/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{r.name}</h3>
                        {r.is_system && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            System Role
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Clone Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCloneTargetRole(r);
                          setClonedRoleName(`${r.name} (Copy)`);
                          setCloneModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-white transition-colors"
                        title="Clone Security Role"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Trigger */}
                      {!r.is_system && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(r);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                          title="Delete Security Role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {r.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Granular Entity Privilege Matrix (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedRole && activePrivileges ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              {/* Role Header Banner */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{selectedRole.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      ID: {selectedRole.id.slice(0, 8)}...
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedRole.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {saveSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Saved
                    </span>
                  )}
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Privileges'}</span>
                  </button>
                </div>
              </div>

              {/* Entity Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 min-w-[220px]">Entity Domain</th>
                      {ACTION_LIST.map((act) => {
                        const meta = ACTION_METADATA[act];
                        return (
                          <th key={act} className="py-3 px-2 text-center min-w-[80px]">
                            <div className="flex flex-col items-center gap-0.5">
                              <span>{meta.shortLabel}</span>
                              <span className="text-[9px] font-normal lowercase tracking-normal text-slate-400">
                                {meta.label}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                      <th className="py-3 px-3 text-right">Row Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {ENTITY_LIST.map((entityKey) => {
                      const entityMeta = ENTITY_METADATA[entityKey];
                      const privMap = activePrivileges[entityKey] || {
                        create: 'none',
                        read: 'none',
                        update: 'none',
                        delete: 'none',
                        append_scan: 'none',
                        dispatch_pass: 'none',
                      };

                      return (
                        <tr key={entityKey} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-xs text-slate-900">
                              {entityMeta.label}
                            </div>
                            <div className="text-[10px] text-slate-400 leading-tight">
                              {entityMeta.description}
                            </div>
                          </td>

                          {ACTION_LIST.map((act) => {
                            const scope = privMap[act] || 'none';
                            const conf = SCOPE_CONFIG[scope];

                            return (
                              <td key={act} className="py-3 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleCycleScope(entityKey, act)}
                                  className={`w-9 h-9 mx-auto rounded-xl border flex items-center justify-center text-sm font-bold shadow-2xs hover:scale-105 active:scale-95 transition-all ${conf.badgeClass}`}
                                  title={`${entityMeta.label} -> ${ACTION_METADATA[act].label}: Current Scope is ${conf.label}. Click to cycle.`}
                                >
                                  <span>{conf.symbol}</span>
                                </button>
                              </td>
                            );
                          })}

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetRowScope(entityKey, 'org')}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-[10px] font-bold text-slate-500 transition-colors"
                                title="Set row to Organization Scope (🟢)"
                              >
                                Max
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetRowScope(entityKey, 'none')}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-bold text-slate-500 transition-colors"
                                title="Clear row to None (⚪)"
                              >
                                Clear
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs">
              Select a Security Role from the left rail to view and edit its Dynamics 365 Privilege Matrix.
            </div>
          )}
        </div>
      </div>

      {/* 4. CREATE NEW ROLE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Security Role</h3>
                  <p className="text-[11px] text-slate-500">Define custom permissions matrix</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Role Name *</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Set Decorator Lead"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  rows={3}
                  placeholder="Responsibilities and access scope for this role..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-2xs"
                >
                  Create Role &amp; Open Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CLONE ROLE MODAL */}
      {cloneModalOpen && cloneTargetRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Clone Security Role</h3>
                  <p className="text-[11px] text-slate-500">Copy privileges from {cloneTargetRole.name}</p>
                </div>
              </div>
              <button
                onClick={() => setCloneModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloneRole} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">New Role Name *</label>
                <input
                  type="text"
                  value={clonedRoleName}
                  onChange={(e) => setClonedRoleName(e.target.value)}
                  placeholder="e.g. Senior Billing Specialist"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                All granular privileges and access scopes configured in <strong>{cloneTargetRole.name}</strong> will be duplicated into this new role.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCloneModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-2xs"
                >
                  Confirm Clone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
