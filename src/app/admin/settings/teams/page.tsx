'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  UserPlus,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  Layers,
  ChevronRight,
  ShieldCheck,
  Mail,
  Phone,
  Search,
} from 'lucide-react';
import { rbacService } from '@/lib/services/rbac';
import { Team, TeamMember, SecurityRole } from '@/types/rbac';
import { supabase } from '@/lib/supabase/client';

export default function TeamsManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [systemProfiles, setSystemProfiles] = useState<any[]>([]);

  // Create Team Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Assign Roles Modal
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [teamToAssignRoles, setTeamToAssignRoles] = useState<Team | null>(null);
  const [assignedRoleIdsDraft, setAssignedRoleIdsDraft] = useState<string[]>([]);

  // Member Search
  const [memberSearch, setMemberSearch] = useState('');

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsData, rolesData] = await Promise.all([
        rbacService.getTeams(),
        rbacService.getSecurityRoles(),
      ]);
      setTeams(teamsData);
      setRoles(rolesData);

      // Load active system profiles
      const { data: profs } = await supabase.from('profiles').select('*').limit(50);
      if (profs && profs.length > 0) {
        setSystemProfiles(profs);
      } else {
        setSystemProfiles([
          { id: 'demo-billing-user', full_name: 'Anita Roy', email: 'billing@aswamovies.com', role: 'manager' },
          { id: 'exec-001', full_name: 'Ravi Kumar', email: 'ravi.k@aswamovies.com', role: 'executive' },
          { id: 'exec-002', full_name: 'Vikram Singh', email: 'vikram.s@aswamovies.com', role: 'executive' },
          { id: 'exec-003', full_name: 'Priya Sharma', email: 'priya.s@aswamovies.com', role: 'executive' },
          { id: 'demo-admin-user', full_name: 'Suresh Varma (COO)', email: 'admin@ashwarentals.com', role: 'super_admin' },
        ]);
      }
    } catch (e) {
      console.error('Failed to load teams:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Manage Members
  const handleOpenMembers = async (t: Team) => {
    setSelectedTeam(t);
    const mems = await rbacService.getTeamMembers(t.id);
    setTeamMembers(mems);
    setMembersDrawerOpen(true);
  };

  // Add Member
  const handleAddMember = async (profile: any) => {
    if (!selectedTeam) return;
    await rbacService.addTeamMember(selectedTeam.id, {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email || 'user@aswamovies.com',
      role: profile.role || 'staff',
    });
    const updated = await rbacService.getTeamMembers(selectedTeam.id);
    setTeamMembers(updated);
    await loadData();
  };

  // Remove Member
  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    await rbacService.removeTeamMember(selectedTeam.id, userId);
    const updated = await rbacService.getTeamMembers(selectedTeam.id);
    setTeamMembers(updated);
    await loadData();
  };

  // Create Team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    await rbacService.createTeam({
      name: newTeamName.trim(),
      description: newTeamDesc.trim() || 'Operational team unit.',
      leader_name: newTeamLeader.trim() || 'Team Lead',
      assigned_role_ids: selectedRoleIds,
    });

    setCreateModalOpen(false);
    setNewTeamName('');
    setNewTeamDesc('');
    setNewTeamLeader('');
    setSelectedRoleIds([]);
    await loadData();
  };

  // Open Assign Roles Modal
  const handleOpenAssignRoles = (t: Team) => {
    setTeamToAssignRoles(t);
    setAssignedRoleIdsDraft(t.assigned_role_ids || []);
    setRolesModalOpen(true);
  };

  // Save Assigned Roles
  const handleSaveTeamRoles = async () => {
    if (!teamToAssignRoles) return;
    await rbacService.updateTeam(teamToAssignRoles.id, {
      assigned_role_ids: assignedRoleIdsDraft,
    });
    setRolesModalOpen(false);
    setTeamToAssignRoles(null);
    await loadData();
  };

  // Delete Team
  const handleDeleteTeam = async (t: Team) => {
    if (!confirm(`Are you sure you want to delete Team "${t.name}"?`)) return;
    await rbacService.deleteTeam(t.id);
    await loadData();
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
            <span>Operational Teams</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-sky-600" />
            <span>Teams &amp; Security Role Inheritance Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize warehouse, commercial desk, and logistics staff into Teams with automated Security Role inheritance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/settings/security-roles"
            className="py-2.5 px-3.5 rounded-xl font-semibold text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs transition-all flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-sky-600" />
            <span>Security Roles Matrix</span>
          </Link>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="py-2.5 px-4 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Operational Team</span>
          </button>
        </div>
      </div>

      {/* 2. TEAMS GRID */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading Operational Teams...</div>
      ) : teams.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Operational Teams Defined</h3>
          <p className="text-xs text-slate-500">Create a team to group staff and assign shared security roles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teams.map((t) => {
            const boundRoles = roles.filter((r) => (t.assigned_role_ids || []).includes(r.id));

            return (
              <div
                key={t.id}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold text-sm">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Leader: <strong className="text-slate-700">{t.leader_name || 'Team Lead'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteTeam(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Team"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>

                  {/* Inherited Security Roles */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Inherited Security Roles ({boundRoles.length})</span>
                      <button
                        onClick={() => handleOpenAssignRoles(t)}
                        className="text-sky-600 hover:text-sky-700 text-[10px] font-semibold lowercase tracking-normal flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>edit roles</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {boundRoles.length > 0 ? (
                        boundRoles.map((r) => (
                          <span
                            key={r.id}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1 shadow-2xs"
                          >
                            <Shield className="w-3 h-3 text-sky-600" />
                            <span>{r.name}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-amber-600 italic">
                          No security role bound (members have no team-inherited privileges)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Members Count & Manage Trigger */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{t.member_count || 0} active members</span>
                  </span>

                  <button
                    onClick={() => handleOpenMembers(t)}
                    className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-sky-600" />
                    <span>Manage Members</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. MANAGE MEMBERS DRAWER / MODAL */}
      {membersDrawerOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col justify-between overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold text-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Manage Team Members</h3>
                  <p className="text-[11px] text-slate-500">{selectedTeam.name}</p>
                </div>
              </div>
              <button
                onClick={() => setMembersDrawerOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Current Members Section */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Assigned Team Members ({teamMembers.length})
                </span>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {teamMembers.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No members currently assigned to this team. Add staff from the directory below.
                    </div>
                  ) : (
                    teamMembers.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {m.full_name?.slice(0, 2).toUpperCase() || 'TM'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{m.full_name}</div>
                            <div className="text-[10px] text-slate-400">{m.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {m.role || 'Member'}
                          </span>
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove Member from Team"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Members from Directory */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Add Active Staff Profiles to Team
                </span>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {systemProfiles
                    .filter((p) => !teamMembers.some((m) => m.user_id === p.id))
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{p.full_name}</div>
                          <div className="text-[10px] text-slate-400">{p.email || 'system user'}</div>
                        </div>

                        <button
                          onClick={() => handleAddMember(p)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Team</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setMembersDrawerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CREATE TEAM MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold text-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Operational Team</h3>
                  <p className="text-[11px] text-slate-500">Group personnel for automated role inheritance</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Team Name *</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Vintage Armory & Weaponry Team"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Team Leader</label>
                <input
                  type="text"
                  value={newTeamLeader}
                  onChange={(e) => setNewTeamLeader(e.target.value)}
                  placeholder="e.g. Vikram Singh"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Description</label>
                <textarea
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  rows={2}
                  placeholder="Operational responsibilities..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
                />
              </div>

              {/* Bind Initial Roles */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Assign Inherited Security Roles
                </label>
                <div className="space-y-1 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {roles.map((r) => {
                    const isSelected = selectedRoleIds.includes(r.id);
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedRoleIds(selectedRoleIds.filter((id) => id !== r.id));
                          } else {
                            setSelectedRoleIds([...selectedRoleIds, r.id]);
                          }
                        }}
                        className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-sky-100/70 text-sky-900 font-bold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-sky-600" />
                          <span>{r.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                      </button>
                    );
                  })}
                </div>
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
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ASSIGN ROLES MODAL */}
      {rolesModalOpen && teamToAssignRoles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold text-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bind Security Roles to Team</h3>
                  <p className="text-[11px] text-slate-500">{teamToAssignRoles.name}</p>
                </div>
              </div>
              <button
                onClick={() => setRolesModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <p className="text-[11px] text-slate-500">
                All members in this team automatically inherit the permissions granted by the selected roles.
              </p>

              <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                {roles.map((r) => {
                  const isChecked = assignedRoleIdsDraft.includes(r.id);
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => {
                        if (isChecked) {
                          setAssignedRoleIdsDraft(assignedRoleIdsDraft.filter((id) => id !== r.id));
                        } else {
                          setAssignedRoleIdsDraft([...assignedRoleIdsDraft, r.id]);
                        }
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'bg-sky-100 text-sky-900 font-bold border border-sky-300'
                          : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-sky-600" />
                          <span>{r.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                          {r.description}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isChecked ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setRolesModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeamRoles}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-2xs"
              >
                Save Role Bindings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
