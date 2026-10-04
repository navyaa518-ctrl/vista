export type UserRole = 'super_admin' | 'admin' | 'manager' | 'billing' | 'billing_manager' | 'executive' | 'rental_sales_exec' | 'client' | 'field_worker' | 'crew';

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  production_company?: string;
  floor_assigned?: 1 | 2;
  badge_number?: string;
  designation?: string;
  emergency_contact?: string;
  license_type?: string;
  created_at: string;
}

export interface Prop {
  id: string;
  slug: string;
  title: string;
  category: string;
  era: string;
  color: string;
  dimensions: string;
  weight_kg: number;
  replacement_value: number;
  daily_rental_rate: number;
  total_units: number;
  available_units: number;
  floor: 1 | 2;
  rack: string;
  bin?: string;
  images: string[];
  description: string;
  film_credits?: string[];
  is_featured?: boolean;
  last_inspected_at?: string;
  last_inspected_by?: string;
  current_condition?: string;
  health_status?: string;
  created_at?: string;
}

export interface PropItem {
  id: string;
  prop_id: string;
  serial_number: string;
  qr_code_data: string;
  status: 'available' | 'reserved' | 'picked' | 'on_rent' | 'maintenance' | 'lost';
  condition: 'pristine' | 'good' | 'cinematic_distressed' | 'needs_repair';
  floor: 1 | 2;
  rack: string;
  bin?: string;
  notes?: string;
  created_at?: string;
}

export type OrderStatus =
  | 'rfq'
  | 'order_created'
  | 'picking_in_progress'
  | 'picked_verified'
  | 'dispatched'
  | 'returned'
  | 'cancelled';

export interface OrderExecutive {
  id: string;
  name: string;
  floor: 1 | 2;
}

export interface Order {
  id: string;
  order_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  production_name: string;
  shoot_location: string;
  start_date: string;
  end_date: string;
  rental_days: number;
  status: OrderStatus;
  total_replacement_value: number;
  base_rental_amount: number;
  discount_percent: number;
  discount_amount: number;
  security_deposit: number;
  tax_amount: number;
  grand_total: number;
  assigned_executives: OrderExecutive[];
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  gate_pass_number?: string;
  notes?: string;
  crew_type?: string;
  total_labor_charges?: number;
  is_archived_or_closed?: boolean;
  is_locked?: boolean;
  closed_at?: string;
  closed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  prop_id: string;
  prop_item_id?: string;
  item_serial?: string;
  prop_title: string;
  prop_category?: string;
  replacement_value: number;
  daily_rental_rate: number;
  rental_days: number;
  floor: 1 | 2;
  rack: string;
  status: 'pending' | 'picked' | 'loaded' | 'returned' | 'removed';
  picked_by_name?: string;
  picked_at?: string;
  notes?: string;
  created_at: string;
}

export interface InventoryLog {
  id: string;
  prop_item_id?: string;
  order_id?: string;
  action: string;
  executive_name?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export type CrewType = 'in_house' | 'client_sourced';

export interface OrderFieldCrew {
  id: string;
  order_id: string;
  crew_type: CrewType;
  worker_id?: string;
  external_name?: string;
  external_phone?: string;
  external_govt_id?: string;
  daily_wage: number;
  assigned_at: string;
}

export type DamageSeverity = 'Minor' | 'Moderate' | 'Total_Loss';
export type DamageIncidentStatus = 'Pending_Review' | 'Billed_To_Client' | 'Waived' | 'Settled';

export interface PropDamageIncident {
  id: string;
  incident_number: string;
  order_id: string;
  prop_serialized_item_id: string;
  reported_by?: string;
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

export interface OrderCrewAssignment {
  id: string;
  order_id: string;
  crew_member_id: string;
  start_date: string;
  end_date?: string | null;
  daily_wage: number;
  status: 'Active' | 'Replaced' | 'Completed';
  assigned_at: string;
}

export interface OrderExternalCrew {
  id: string;
  order_id: string;
  full_name: string;
  phone_number: string;
  notes?: string;
  created_at: string;
}

export type CrewFieldLogType = 'Attendance' | 'Location_Ping' | 'Prop_Health_Update' | 'Incident';

export interface CrewFieldLog {
  id: string;
  order_id: string;
  crew_member_id: string;
  log_type: CrewFieldLogType;
  location_name?: string;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  notes?: string;
  created_at: string;
}

