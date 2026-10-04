import { supabase } from '@/lib/supabase/client';
import {
  SecurityRole,
  Team,
  TeamMember,
  RolePrivileges,
  EntityName,
  PermissionAction,
  AccessScope,
  EffectivePermissionCheckResult,
  SCOPE_CONFIG,
} from '@/types/rbac';

const STORAGE_ROLES_KEY = 'ashwa_d365_security_roles_v1';
const STORAGE_TEAMS_KEY = 'ashwa_d365_teams_v1';
const STORAGE_TEAM_MEMBERS_KEY = 'ashwa_d365_team_members_v1';
const STORAGE_TEAM_ROLES_KEY = 'ashwa_d365_team_roles_v1';
const STORAGE_USER_ROLES_KEY = 'ashwa_d365_user_roles_v1';

// In-memory fallback
const mem = new Map<string, string>();

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    const raw = mem.get(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  const json = JSON.stringify(value);
  if (typeof window === 'undefined') {
    mem.set(key, json);
    return;
  }
  try {
    localStorage.setItem(key, json);
  } catch (e) {
    console.warn('Storage set error:', e);
  }
}

// Initial System Seed Roles
export const INITIAL_ROLES: SecurityRole[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Super Admin',
    description:
      'Full organization-wide administrative clearance across all film rental assets, picking pipelines, financials, and security settings.',
    is_system: true,
    privileges: {
      props_catalog: { create: 'org', read: 'org', update: 'org', delete: 'org', append_scan: 'org', dispatch_pass: 'org' },
      walkin_orders: { create: 'org', read: 'org', update: 'org', delete: 'org', append_scan: 'org', dispatch_pass: 'org' },
      live_picking: { create: 'org', read: 'org', update: 'org', delete: 'org', append_scan: 'org', dispatch_pass: 'org' },
      rental_pipeline: { create: 'org', read: 'org', update: 'org', delete: 'org', append_scan: 'org', dispatch_pass: 'org' },
      invoices: { create: 'org', read: 'org', update: 'org', delete: 'org', append_scan: 'org', dispatch_pass: 'org' },
      financials: { create: 'org', read: 'org', update: 'org', delete: 'org', append_scan: 'org', dispatch_pass: 'org' },
      system_settings: { create: 'org', read: 'org', update: 'org', delete: 'org', append_scan: 'org', dispatch_pass: 'org' },
    },
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Billing Specialist',
    description:
      'Manages walk-in intakes, deposits, invoices, payment receipts, and delivery challans. Restricted from system infrastructure settings.',
    is_system: false,
    privileges: {
      props_catalog: { create: 'none', read: 'org', update: 'none', delete: 'none', append_scan: 'team', dispatch_pass: 'none' },
      walkin_orders: { create: 'org', read: 'org', update: 'org', delete: 'user', append_scan: 'team', dispatch_pass: 'team' },
      live_picking: { create: 'team', read: 'org', update: 'team', delete: 'none', append_scan: 'team', dispatch_pass: 'team' },
      rental_pipeline: { create: 'none', read: 'org', update: 'team', delete: 'none', append_scan: 'none', dispatch_pass: 'team' },
      invoices: { create: 'org', read: 'org', update: 'org', delete: 'none', append_scan: 'none', dispatch_pass: 'org' },
      financials: { create: 'team', read: 'org', update: 'team', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      system_settings: { create: 'none', read: 'user', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
    },
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Warehouse Lead',
    description:
      'Oversees physical godown floors, serialized QR tagging, picking queues, and fleet lorry loading.',
    is_system: false,
    privileges: {
      props_catalog: { create: 'org', read: 'org', update: 'org', delete: 'none', append_scan: 'org', dispatch_pass: 'org' },
      walkin_orders: { create: 'team', read: 'org', update: 'team', delete: 'none', append_scan: 'org', dispatch_pass: 'org' },
      live_picking: { create: 'org', read: 'org', update: 'org', delete: 'none', append_scan: 'org', dispatch_pass: 'org' },
      rental_pipeline: { create: 'org', read: 'org', update: 'org', delete: 'none', append_scan: 'org', dispatch_pass: 'org' },
      invoices: { create: 'none', read: 'team', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'org' },
      financials: { create: 'none', read: 'user', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      system_settings: { create: 'none', read: 'none', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
    },
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Field Executive',
    description:
      'Warehouse floor runner responsible for live scanning of prop serials and cart fulfillment.',
    is_system: false,
    privileges: {
      props_catalog: { create: 'none', read: 'org', update: 'none', delete: 'none', append_scan: 'user', dispatch_pass: 'none' },
      walkin_orders: { create: 'none', read: 'team', update: 'user', delete: 'none', append_scan: 'user', dispatch_pass: 'none' },
      live_picking: { create: 'user', read: 'team', update: 'user', delete: 'none', append_scan: 'user', dispatch_pass: 'none' },
      rental_pipeline: { create: 'none', read: 'team', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      invoices: { create: 'none', read: 'none', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      financials: { create: 'none', read: 'none', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      system_settings: { create: 'none', read: 'none', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
    },
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Production Auditor',
    description:
      'Inspection and film production designer clearance. Read-only review across orders and equipment history.',
    is_system: false,
    privileges: {
      props_catalog: { create: 'none', read: 'org', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      walkin_orders: { create: 'none', read: 'org', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      live_picking: { create: 'none', read: 'org', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      rental_pipeline: { create: 'none', read: 'org', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      invoices: { create: 'none', read: 'org', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      financials: { create: 'none', read: 'org', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
      system_settings: { create: 'none', read: 'user', update: 'none', delete: 'none', append_scan: 'none', dispatch_pass: 'none' },
    },
    created_at: new Date().toISOString(),
  },
];

// Initial Operational Teams
export const INITIAL_TEAMS: Team[] = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    name: 'Billing & Commercial Desk Team',
    description:
      'Front counter specialists handling production studio accounts, GST invoices, advance receipts, and security clearances.',
    leader_name: 'Anita Roy (Head of Commercial Billing)',
    member_count: 3,
    assigned_role_ids: ['00000000-0000-0000-0000-000000000002'],
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    name: 'Rental Sales Executives (RSE) Team',
    description:
      'Floor 1 & Floor 2 warehouse specialists managing collaborative live picking, QR serial scanning, and rack retrieval.',
    leader_name: 'Ravi Kumar (Floor 1 Specialist)',
    member_count: 4,
    assigned_role_ids: ['00000000-0000-0000-0000-000000000004'],
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    name: 'Logistics & Fleet Dispatch Team',
    description:
      'Heavy cargo transport coordination, lorry dispatch gate passes, driver documentation, and returns inspection.',
    leader_name: 'Vikram Singh (Floor 2 & Yard Lead)',
    member_count: 3,
    assigned_role_ids: ['00000000-0000-0000-0000-000000000003'],
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    name: 'Executive Audit & Governance Team',
    description:
      'Film production contract compliance, high-value vintage prop loss prevention, and periodic stock reconciliations.',
    leader_name: 'Naveen Reddy (Chief Compliance Officer)',
    member_count: 2,
    assigned_role_ids: ['00000000-0000-0000-0000-000000000005'],
    created_at: new Date().toISOString(),
  },
];

// Initial Team Members
export const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'mem-001',
    team_id: '11111111-0000-0000-0000-000000000001',
    user_id: 'demo-billing-user',
    full_name: 'Anita Roy',
    email: 'billing@aswamovies.com',
    role: 'manager',
  },
  {
    id: 'mem-002',
    team_id: '11111111-0000-0000-0000-000000000002',
    user_id: 'exec-001',
    full_name: 'Ravi Kumar',
    email: 'ravi.k@aswamovies.com',
    role: 'executive',
  },
  {
    id: 'mem-003',
    team_id: '11111111-0000-0000-0000-000000000002',
    user_id: 'exec-002',
    full_name: 'Vikram Singh',
    email: 'vikram.s@aswamovies.com',
    role: 'executive',
  },
  {
    id: 'mem-004',
    team_id: '11111111-0000-0000-0000-000000000003',
    user_id: 'exec-003',
    full_name: 'Priya Sharma',
    email: 'priya.s@aswamovies.com',
    role: 'executive',
  },
  {
    id: 'mem-005',
    team_id: '11111111-0000-0000-0000-000000000004',
    user_id: 'demo-admin-user',
    full_name: 'Suresh Varma (COO)',
    email: 'admin@ashwarentals.com',
    role: 'super_admin',
  },
];

class Dynamics365RBACService {
  // ============================================================================
  // 1. SECURITY ROLES CRUD & CLONING
  // ============================================================================
  async getSecurityRoles(): Promise<SecurityRole[]> {
    try {
      const { data, error } = await supabase
        .from('security_roles')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        setStored(STORAGE_ROLES_KEY, data);
        return data as SecurityRole[];
      }
    } catch (e) {
      // Fallback
    }
    return getStored<SecurityRole[]>(STORAGE_ROLES_KEY, INITIAL_ROLES);
  }

  async getSecurityRoleById(id: string): Promise<SecurityRole | null> {
    const roles = await this.getSecurityRoles();
    return roles.find((r) => r.id === id) || null;
  }

  async createSecurityRole(input: {
    name: string;
    description: string;
    privileges: RolePrivileges;
  }): Promise<SecurityRole> {
    const newRole: SecurityRole = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `role-${Date.now()}`,
      name: input.name.trim(),
      description: input.description.trim(),
      privileges: input.privileges,
      is_system: false,
      created_at: new Date().toISOString(),
    };

    const roles = getStored<SecurityRole[]>(STORAGE_ROLES_KEY, INITIAL_ROLES);
    roles.push(newRole);
    setStored(STORAGE_ROLES_KEY, roles);

    try {
      await supabase.from('security_roles').insert([
        {
          id: newRole.id,
          name: newRole.name,
          description: newRole.description,
          privileges: newRole.privileges,
        },
      ]);
    } catch (e) {
      console.warn('Supabase role insert warning:', e);
    }

    return newRole;
  }

  async updateSecurityRole(
    id: string,
    updates: Partial<Omit<SecurityRole, 'id' | 'created_at'>>
  ): Promise<SecurityRole | null> {
    const roles = getStored<SecurityRole[]>(STORAGE_ROLES_KEY, INITIAL_ROLES);
    const index = roles.findIndex((r) => r.id === id);
    if (index === -1) return null;

    roles[index] = { ...roles[index], ...updates };
    setStored(STORAGE_ROLES_KEY, roles);

    try {
      await supabase
        .from('security_roles')
        .update({
          name: roles[index].name,
          description: roles[index].description,
          privileges: roles[index].privileges,
        })
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase role update warning:', e);
    }

    return roles[index];
  }

  async deleteSecurityRole(id: string): Promise<boolean> {
    const roles = getStored<SecurityRole[]>(STORAGE_ROLES_KEY, INITIAL_ROLES);
    const role = roles.find((r) => r.id === id);
    if (role?.is_system) {
      throw new Error('System Security Roles cannot be deleted.');
    }

    const filtered = roles.filter((r) => r.id !== id);
    setStored(STORAGE_ROLES_KEY, filtered);

    try {
      await supabase.from('security_roles').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase role delete warning:', e);
    }

    return true;
  }

  async cloneSecurityRole(sourceRoleId: string, newRoleName: string): Promise<SecurityRole | null> {
    const source = await this.getSecurityRoleById(sourceRoleId);
    if (!source) return null;

    return this.createSecurityRole({
      name: newRoleName.trim(),
      description: `Cloned from ${source.name}. ${source.description}`,
      privileges: JSON.parse(JSON.stringify(source.privileges)),
    });
  }

  // ============================================================================
  // 2. OPERATIONAL TEAMS CRUD
  // ============================================================================
  async getTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*, team_roles(role_id)')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map((t: any) => ({
          ...t,
          assigned_role_ids: t.team_roles ? t.team_roles.map((tr: any) => tr.role_id) : [],
        }));
        setStored(STORAGE_TEAMS_KEY, mapped);
        return mapped as Team[];
      }
    } catch (e) {
      // Fallback
    }
    return getStored<Team[]>(STORAGE_TEAMS_KEY, INITIAL_TEAMS);
  }

  async getTeamById(id: string): Promise<Team | null> {
    const teams = await this.getTeams();
    return teams.find((t) => t.id === id) || null;
  }

  async createTeam(input: {
    name: string;
    description: string;
    leader_name?: string;
    assigned_role_ids?: string[];
  }): Promise<Team> {
    const newTeam: Team = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `team-${Date.now()}`,
      name: input.name.trim(),
      description: input.description.trim(),
      leader_name: input.leader_name?.trim() || 'Team Lead',
      member_count: 0,
      assigned_role_ids: input.assigned_role_ids || [],
      created_at: new Date().toISOString(),
    };

    const teams = getStored<Team[]>(STORAGE_TEAMS_KEY, INITIAL_TEAMS);
    teams.push(newTeam);
    setStored(STORAGE_TEAMS_KEY, teams);

    try {
      await supabase.from('teams').insert([
        {
          id: newTeam.id,
          name: newTeam.name,
          description: newTeam.description,
        },
      ]);
      if (input.assigned_role_ids && input.assigned_role_ids.length > 0) {
        await supabase.from('team_roles').insert(
          input.assigned_role_ids.map((rId) => ({ team_id: newTeam.id, role_id: rId }))
        );
      }
    } catch (e) {
      console.warn('Supabase team insert warning:', e);
    }

    return newTeam;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | null> {
    const teams = getStored<Team[]>(STORAGE_TEAMS_KEY, INITIAL_TEAMS);
    const index = teams.findIndex((t) => t.id === id);
    if (index === -1) return null;

    teams[index] = { ...teams[index], ...updates };
    setStored(STORAGE_TEAMS_KEY, teams);

    try {
      await supabase
        .from('teams')
        .update({
          name: teams[index].name,
          description: teams[index].description,
        })
        .eq('id', id);

      if (updates.assigned_role_ids) {
        await supabase.from('team_roles').delete().eq('team_id', id);
        if (updates.assigned_role_ids.length > 0) {
          await supabase.from('team_roles').insert(
            updates.assigned_role_ids.map((rId) => ({ team_id: id, role_id: rId }))
          );
        }
      }
    } catch (e) {
      console.warn('Supabase team update warning:', e);
    }

    return teams[index];
  }

  async deleteTeam(id: string): Promise<boolean> {
    const teams = getStored<Team[]>(STORAGE_TEAMS_KEY, INITIAL_TEAMS);
    const filtered = teams.filter((t) => t.id !== id);
    setStored(STORAGE_TEAMS_KEY, filtered);

    try {
      await supabase.from('teams').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase team delete warning:', e);
    }

    return true;
  }

  // ============================================================================
  // 3. TEAM MEMBERS
  // ============================================================================
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*, profiles(full_name, email, role)')
        .eq('team_id', teamId);
      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          team_id: d.team_id,
          user_id: d.user_id,
          full_name: d.profiles?.full_name || 'Team Member',
          email: d.profiles?.email || 'user@aswamovies.com',
          role: d.profiles?.role || 'staff',
        }));
      }
    } catch (e) {
      // Fallback
    }
    const allMembers = getStored<TeamMember[]>(STORAGE_TEAM_MEMBERS_KEY, INITIAL_MEMBERS);
    return allMembers.filter((m) => m.team_id === teamId);
  }

  async addTeamMember(teamId: string, user: { id: string; full_name: string; email: string; role: string }): Promise<boolean> {
    const allMembers = getStored<TeamMember[]>(STORAGE_TEAM_MEMBERS_KEY, INITIAL_MEMBERS);
    if (allMembers.some((m) => m.team_id === teamId && m.user_id === user.id)) {
      return true;
    }

    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      team_id: teamId,
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    };

    allMembers.push(newMember);
    setStored(STORAGE_TEAM_MEMBERS_KEY, allMembers);

    // Update team member count
    const teams = getStored<Team[]>(STORAGE_TEAMS_KEY, INITIAL_TEAMS);
    const t = teams.find((item) => item.id === teamId);
    if (t) {
      t.member_count = (t.member_count || 0) + 1;
      setStored(STORAGE_TEAMS_KEY, teams);
    }

    try {
      await supabase.from('team_members').insert([
        {
          team_id: teamId,
          user_id: user.id,
        },
      ]);
    } catch (e) {
      console.warn('Supabase member insert warning:', e);
    }

    return true;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const allMembers = getStored<TeamMember[]>(STORAGE_TEAM_MEMBERS_KEY, INITIAL_MEMBERS);
    const filtered = allMembers.filter((m) => !(m.team_id === teamId && m.user_id === userId));
    setStored(STORAGE_TEAM_MEMBERS_KEY, filtered);

    const teams = getStored<Team[]>(STORAGE_TEAMS_KEY, INITIAL_TEAMS);
    const t = teams.find((item) => item.id === teamId);
    if (t) {
      t.member_count = Math.max(0, (t.member_count || 1) - 1);
      setStored(STORAGE_TEAMS_KEY, teams);
    }

    try {
      await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
    } catch (e) {
      console.warn('Supabase member delete warning:', e);
    }

    return true;
  }

  // ============================================================================
  // 4. ROLE BINDINGS & AGGREGATED PERMISSION EVALUATOR
  // ============================================================================
  async assignRoleToTeam(teamId: string, roleId: string): Promise<void> {
    const teams = await this.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const currentRoles = team.assigned_role_ids || [];
    if (!currentRoles.includes(roleId)) {
      team.assigned_role_ids = [...currentRoles, roleId];
      await this.updateTeam(teamId, { assigned_role_ids: team.assigned_role_ids });
    }
  }

  async removeRoleFromTeam(teamId: string, roleId: string): Promise<void> {
    const teams = await this.getTeams();
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    team.assigned_role_ids = (team.assigned_role_ids || []).filter((id) => id !== roleId);
    await this.updateTeam(teamId, { assigned_role_ids: team.assigned_role_ids });
  }

  // Resolve user effective roles (Direct + Team Inherited)
  async getUserEffectiveRoles(userId?: string, fallbackRoleName?: string): Promise<SecurityRole[]> {
    const roles = await this.getSecurityRoles();
    const teams = await this.getTeams();
    const allMembers = getStored<TeamMember[]>(STORAGE_TEAM_MEMBERS_KEY, INITIAL_MEMBERS);

    const assignedRoleIds = new Set<string>();

    // 0. Super Admin / Admin override guarantee
    if (fallbackRoleName === 'super_admin' || fallbackRoleName === 'admin') {
      const superAdminRole = roles.find((r) => r.name === 'Super Admin');
      if (superAdminRole) {
        assignedRoleIds.add(superAdminRole.id);
      }
    }

    if (userId) {
      // 1. Team memberships
      const userTeams = allMembers.filter((m) => m.user_id === userId).map((m) => m.team_id);
      for (const tId of userTeams) {
        const team = teams.find((t) => t.id === tId);
        if (team && team.assigned_role_ids) {
          team.assigned_role_ids.forEach((rId) => assignedRoleIds.add(rId));
        }
      }

      // 2. Direct user role bindings
      const userRolesStored = getStored<Record<string, string[]>>(STORAGE_USER_ROLES_KEY, {});
      if (userRolesStored[userId]) {
        userRolesStored[userId].forEach((rId) => assignedRoleIds.add(rId));
      }
    }

    // 3. Fallback standard mapping if no custom bindings configured yet
    if (assignedRoleIds.size === 0) {
      if (fallbackRoleName === 'super_admin' || fallbackRoleName === 'admin') {
        const superAdminRole = roles.find((r) => r.name === 'Super Admin');
        if (superAdminRole) return [superAdminRole];
      } else if (fallbackRoleName === 'manager') {
        const billingRole = roles.find((r) => r.name === 'Billing Specialist');
        if (billingRole) return [billingRole];
      } else if (fallbackRoleName === 'executive') {
        const execRole = roles.find((r) => r.name === 'Field Executive');
        if (execRole) return [execRole];
      }
    }

    const matchedRoles = roles.filter((r) => assignedRoleIds.has(r.id));
    return matchedRoles.length > 0
      ? matchedRoles
      : [roles.find((r) => r.name === 'Field Executive') || roles[0]];
  }

  // Evaluate dynamic permission for user on entity + action
  async checkPermission(
    userId: string | undefined,
    entity: EntityName,
    action: PermissionAction,
    requiredScope: AccessScope = 'user',
    userRoleFallback?: string
  ): Promise<EffectivePermissionCheckResult> {
    const roles = await this.getUserEffectiveRoles(userId, userRoleFallback);
    const roleNames = roles.map((r) => r.name);

    // If Super Admin role present, automatically grant Organization scope
    if (roleNames.includes('Super Admin')) {
      return {
        allowed: true,
        effectiveScope: 'org',
        roleNames,
      };
    }

    // Find highest scope level granted by any of the user's active/inherited roles
    let highestScope: AccessScope = 'none';
    let highestRank = -1;

    for (const r of roles) {
      const entityPrivs = r.privileges[entity];
      if (entityPrivs) {
        const scope = entityPrivs[action] || 'none';
        const rank = SCOPE_CONFIG[scope]?.rank ?? 0;
        if (rank > highestRank) {
          highestRank = rank;
          highestScope = scope;
        }
      }
    }

    const requiredRank = SCOPE_CONFIG[requiredScope]?.rank ?? 1;
    const allowed = highestRank >= requiredRank;

    return {
      allowed,
      effectiveScope: highestScope,
      reason: allowed
        ? undefined
        : `Access Denied: Requires '${SCOPE_CONFIG[requiredScope].label}' clearance on ${entity}:${action}. Your effective clearance is '${SCOPE_CONFIG[highestScope].label}'.`,
      roleNames,
    };
  }
}

export const rbacService = new Dynamics365RBACService();
