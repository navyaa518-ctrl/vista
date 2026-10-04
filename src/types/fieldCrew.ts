import { DamageSeverity, DamageIncidentStatus, CrewType } from './database';

export type { DamageSeverity, DamageIncidentStatus, CrewType };

export interface FieldWorkerProfile {
  id: string;
  full_name: string;
  email?: string;
  phone: string;
  role: 'field_worker';
  designation: string; // e.g. "Senior Prop Handling Specialist", "Heavy Rigging Lead"
  badge_number: string; // e.g. "ASH-FW-01"
  assigned_team: string; // "Field Operations / Fleet"
  status: 'Available' | 'On Set' | 'In Transit';
  avatar_url?: string;
}

export interface ClientSourcedCrewInput {
  id: string;
  name: string;
  phone: string;
  govt_id_or_notes?: string;
}

export interface OrderFieldCrewAssignment {
  id: string;
  order_id: string;
  crew_type: CrewType;
  worker_id?: string;
  worker_name?: string;
  worker_phone?: string;
  external_name?: string;
  external_phone?: string;
  external_govt_id?: string;
  daily_wage: number;
  assigned_at: string;
}

export interface CreateDamageIncidentInput {
  order_id: string;
  prop_serialized_item_id: string;
  prop_title: string;
  item_code: string;
  severity: DamageSeverity;
  description: string;
  evidence_photos: string[];
  shoot_location?: string;
  reported_by?: string;
  reported_by_name?: string;
  custom_penalty_amount?: number;
}

export interface DamageIncidentRecord {
  id: string;
  incident_number: string; // e.g. ASH-DMG-2026-001
  order_id: string;
  order_number: string;
  movie_project_name: string;
  client_name: string;
  prop_serialized_item_id: string;
  prop_title: string;
  item_code: string;
  prop_category?: string;
  replacement_value: number;
  reported_by?: string;
  reported_by_name?: string;
  severity: DamageSeverity;
  description: string;
  evidence_photos: string[];
  shoot_location?: string;
  repair_or_replacement_cost: number;
  status: DamageIncidentStatus;
  manager_notes?: string;
  settled_at?: string;
  created_at: string;
}

export interface FieldInspectionChecklist {
  order_id: string;
  worker_id: string;
  worker_name: string;
  verified_item_ids: string[];
  verified_all_packed: boolean;
  packed_notes?: string;
  inspected_at: string;
}

export interface ReturnHandoverChecklist {
  order_id: string;
  worker_id: string;
  worker_name: string;
  checked_item_ids: string[];
  verified_return_to_bay: boolean;
  bay_notes?: string;
  returned_at: string;
}
