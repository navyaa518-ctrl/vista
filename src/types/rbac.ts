export type EntityName =
  | 'props_catalog'
  | 'walkin_orders'
  | 'live_picking'
  | 'rental_pipeline'
  | 'invoices'
  | 'financials'
  | 'system_settings';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'append_scan'
  | 'dispatch_pass';

export type AccessScope = 'none' | 'user' | 'team' | 'org';

export type EntityPrivilegeMap = Record<PermissionAction, AccessScope>;

export type RolePrivileges = Record<EntityName, EntityPrivilegeMap>;

export interface SecurityRole {
  id: string;
  name: string;
  description: string;
  privileges: RolePrivileges;
  is_system?: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  leader_name?: string;
  member_count?: number;
  assigned_role_ids?: string[];
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  role?: string;
  avatar_url?: string;
}

export interface EffectivePermissionCheckResult {
  allowed: boolean;
  effectiveScope: AccessScope;
  reason?: string;
  roleNames: string[];
}

export const ENTITY_METADATA: Record<
  EntityName,
  { label: string; category: string; description: string }
> = {
  props_catalog: {
    label: 'Props & Asset Catalog',
    category: 'Warehouse & Inventory',
    description: 'Serialized film props, camera optics, godown storage racks, and replacement valuations.',
  },
  walkin_orders: {
    label: 'Walk-In Rental Orders',
    category: 'Orders & Front Desk',
    description: 'Walk-in intakes, client productions, rental durations, and floor executive assignments.',
  },
  live_picking: {
    label: 'Live Picking & Cart',
    category: 'Orders & Front Desk',
    description: 'Real-time picking monitoring, barcode/QR scanning, cart append, and floor verification.',
  },
  rental_pipeline: {
    label: 'Rental Pipeline & Fleet',
    category: 'Logistics & Dispatch',
    description: 'Lorry loading, driver logistics, gate passes, condition inspection, and returns tracking.',
  },
  invoices: {
    label: 'Invoices & Quotations',
    category: 'Commercial & Finance',
    description: 'GST tax invoices, delivery challans, gate passes, and printable billing registers.',
  },
  financials: {
    label: 'Financials, Deposits & Rates',
    category: 'Commercial & Finance',
    description: 'Advance deposits, cash/UPI counter collections, discounts, and replacement liabilities.',
  },
  system_settings: {
    label: 'System & Cloud Settings',
    category: 'Enterprise Governance',
    description: 'PostgreSQL database, real-time channels, S3 storage buckets, and RBAC policy engines.',
  },
};

export const ACTION_METADATA: Record<
  PermissionAction,
  { label: string; shortLabel: string; description: string }
> = {
  create: {
    label: 'Create',
    shortLabel: 'C',
    description: 'Create new records in this entity domain.',
  },
  read: {
    label: 'Read',
    shortLabel: 'R',
    description: 'View records, details, and telemetry.',
  },
  update: {
    label: 'Update',
    shortLabel: 'U',
    description: 'Edit properties, status changes, and configurations.',
  },
  delete: {
    label: 'Delete',
    shortLabel: 'D',
    description: 'Remove records or purge associated logs.',
  },
  append_scan: {
    label: 'Append / Scan to Cart',
    shortLabel: 'A',
    description: 'Scan QR codes and append serialized props into active picking carts.',
  },
  dispatch_pass: {
    label: 'Dispatch & Print Pass',
    shortLabel: 'P',
    description: 'Authorize cargo transport vehicle, clear lorry, and issue official gate passes.',
  },
};

export const SCOPE_CONFIG: Record<
  AccessScope,
  { label: string; symbol: string; color: string; badgeClass: string; rank: number }
> = {
  none: {
    label: 'None',
    symbol: '⚪',
    color: '#94a3b8',
    badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
    rank: 0,
  },
  user: {
    label: 'User / Assigned Only',
    symbol: '🟡',
    color: '#f59e0b',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    rank: 1,
  },
  team: {
    label: 'Team Level',
    symbol: '🔵',
    color: '#0284c7',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    rank: 2,
  },
  org: {
    label: 'Organization / Global',
    symbol: '🟢',
    color: '#10b981',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rank: 3,
  },
};
