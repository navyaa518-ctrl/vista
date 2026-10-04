/**
 * ASHWA Movie Property Rentals - Property Health & Warehouse Audits Domain Types
 * Live Supabase database models for warehouse_audits, audit_assignees, audit_inspection_items, and prop_health_history.
 */

export type AuditType = 'WEEKLY' | 'SPOT' | 'CYCLE' | 'Weekly Audit' | 'Spot Check' | 'Monthly Routine';
export type AuditTaskStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type AuditFloorLevel = 'Floor 1' | 'Floor 2' | 'Floor 3' | 'All Floors';

export type AuditHealthStatus =
  | 'PERFECT'
  | 'MINOR_DAMAGE'
  | 'MAJOR_DAMAGE'
  | 'MISSING';

export type AuditCondition = AuditHealthStatus | 'EXCELLENT' | 'GOOD' | 'MINOR_WEAR' | 'DAMAGED_NEEDS_REPAIR';

export type AuditResolutionStatus =
  | 'PENDING'
  | 'FLAGGED_MAINTENANCE'
  | 'REPAIRED'
  | 'RESOLVED'
  | 'WRITTEN_OFF';

export type AuditPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface AuditAssignee {
  id: string;
  audit_id: string;
  user_id: string;
  user_name?: string;
  user_role?: string;
  user_floor?: number;
  assigned_at?: string;
}

export interface WarehouseAudit {
  id: string;
  audit_code: string;
  title: string;
  audit_type: AuditType;
  status: AuditTaskStatus;
  floor_level: AuditFloorLevel;
  rack_range?: string;
  category_id?: string;
  category_name?: string;
  scheduled_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  completed_at?: string;
  assignees?: AuditAssignee[];
  total_items_count?: number;
  audited_items_count?: number;
  // Compatibility fields
  task_number?: string;
  priority?: AuditPriority;
  scope_type?: string;
  zone_or_rack?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  due_date?: string;
}

// Backward compatibility alias for components
export type InspectionTask = WarehouseAudit;

export interface AuditInspectionItem {
  id?: string;
  audit_id: string;
  prop_id: string;
  item_code?: string;
  prop_serialized_item_id?: string;
  physical_condition?: string;
  condition?: string;
  condition_status?: string;
  prop_title?: string;
  prop_code?: string;
  prop_image?: string;
  expected_rack?: string;
  current_rack?: string;
  category_name?: string;
  scanned_by?: string;
  scanned_by_name?: string;
  scanned_at?: string;
  inspected_by?: string;
  inspector_id?: string;
  inspected_at?: string;
  health_status?: AuditHealthStatus;
  rack_verified?: string;
  is_misplaced?: boolean;
  is_functional?: boolean;
  notes?: string;
  damage_notes?: string;
  evidence_photos?: string[];
  photo_url?: string;
  resolution_status?: AuditResolutionStatus;
  audited?: boolean;
}

// Backward compatibility alias
export interface AuditItemChecklistEntry {
  prop_id: string;
  prop_serialized_item_id?: string;
  prop_title: string;
  item_code: string;
  image?: string;
  category_name?: string;
  expected_rack: string;
  current_rack: string;
  is_misplaced: boolean;
  is_functional?: boolean;
  condition: AuditCondition;
  physical_condition?: string;
  health_status?: AuditHealthStatus;
  photo_url?: string;
  evidence_photos?: string[];
  notes: string;
  damage_notes?: string;
  audited: boolean;
  previous_location?: string;
  new_location?: string;
  storage_location?: string;
  relocation_applied?: boolean;
}

export interface PropHealthHistoryEntry {
  id: string;
  prop_id: string;
  item_code?: string;
  prop_title?: string;
  prop_code?: string;
  prop_image?: string;
  audit_id?: string;
  audit_code?: string;
  inspector_id?: string;
  inspector_name?: string;
  inspected_by?: string;
  inspected_by_name?: string;
  status: AuditHealthStatus | string;
  condition?: AuditCondition;
  condition_status?: string;
  physical_condition?: string;
  is_functional?: boolean;
  rack_location?: string;
  rack_verified?: string;
  previous_location?: string;
  new_location?: string;
  is_misplaced?: boolean;
  notes?: string;
  damage_notes?: string;
  photo_urls: string[];
  photo_url?: string;
  timestamp: string;
  inspected_at?: string;
  created_at?: string;
}

// Backward compatibility alias
export type PropertyAuditHistoryEntry = PropHealthHistoryEntry;

export interface CreateWarehouseAuditInput {
  title: string;
  audit_type: 'WEEKLY' | 'SPOT' | 'CYCLE' | string;
  floor_level: 'Floor 1' | 'Floor 2' | 'Floor 3' | 'All Floors';
  rack_range?: string;
  category_id?: string;
  scheduled_date: string;
  assignee_ids: string[];
  notes?: string;
  created_by?: string;
  // Compatibility fields
  priority?: AuditPriority;
  scope_type?: string;
  zone_or_rack?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  due_date?: string;
}

export type CreateInspectionTaskInput = CreateWarehouseAuditInput;

export interface LogInspectionEntryInput {
  audit_id: string;
  prop_id: string;
  prop_serialized_item_id?: string;
  item_code?: string;
  scanned_by?: string;
  scanned_by_name?: string;
  health_status: AuditHealthStatus;
  condition_status?: string;
  is_functional?: boolean;
  rack_verified?: string;
  previous_location?: string;
  new_location?: string;
  relocation_applied?: boolean;
  godown?: string;
  floor?: number | string;
  rack?: string;
  bay?: string;
  is_misplaced?: boolean;
  notes?: string;
  evidence_photos?: string[];
  resolution_status?: AuditResolutionStatus;
}

export interface SubmitAuditBatchInput {
  task_id?: string;
  taskId?: string;
  audit_id?: string;
  inspected_by?: string;
  inspected_by_name?: string;
  auditorId?: string;
  auditorName?: string;
  auditorRole?: string;
  items: {
    prop_id: string;
    prop_serialized_item_id?: string;
    item_code?: string;
    condition?: AuditCondition;
    health_status?: AuditHealthStatus;
    rack_verified?: string;
    verified_rack?: string;
    is_misplaced: boolean;
    photo_url?: string;
    photo_file?: File;
    photo_evidence_urls?: string[];
    evidence_photos?: string[];
    notes?: string;
    defect_notes?: string;
  }[];
}

export interface AuditMetricsOverview {
  totalInspectedThisWeek: number;
  overdueInspectionsCount: number;
  flaggedDamagedCount: number;
  rackAccuracyPercent: number;
  completedBatchesCount: number;
  activeBatchesCount: number;
  totalPendingCount?: number;
  perfectCount?: number;
  minorDamageCount?: number;
  missingCount?: number;
}

export interface AuditFilterParams {
  startDate?: string;
  endDate?: string;
  inspector?: string;
  zoneOrFloor?: string;
  condition?: string;
  healthStatus?: string;
  isMisplacedOnly?: boolean;
  search?: string;
}
