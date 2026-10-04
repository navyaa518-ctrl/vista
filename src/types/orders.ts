export type OrderLifecycleStatus =
  | 'Draft'
  | 'DRAFT'
  | 'Assigned'
  | 'PICKING_IN_PROGRESS'
  | 'Picking_In_Progress'
  | 'Quotation'
  | 'QUOTATION'
  | 'Quotation_Review'
  | 'Confirmed'
  | 'DISPATCHED_RENTAL_PIPELINE'
  | 'Dispatched'
  | 'DISPATCHED'
  | 'On_Site_Active'
  | 'ON_SITE'
  | 'Return_Initiated'
  | 'RETURN_IN_PROGRESS'
  | 'Verified_Closed'
  | 'Returned'
  | 'RETURNED'
  | 'CLOSED'
  | 'Closed'
  | 'Cancelled'
  | 'CANCELLED';

export interface AssignedExecutive {
  id: string;
  name: string;
  floor: 1 | 2;
  phone?: string;
  active_picking?: boolean;
}

export interface WalkInOrder {
  id: string;
  order_number: string;
  client_id?: string;
  client_name: string; // Production Company / Client Name
  client_email?: string;
  client_phone?: string;
  movie_project_name: string;
  production_name?: string;
  shoot_location?: string;
  status: OrderLifecycleStatus;
  rental_start_date: string;
  rental_end_date: string;
  rental_days: number;
  duration_days: number;
  actual_shoot_days?: number; // Dynamic shooting days tracker
  total_replacement_val: number;
  total_rent_amount: number;
  discount_percent: number;
  discount_amount: number;
  security_deposit: number;
  tax_amount: number;
  final_payable: number;
  advance_paid: boolean;
  advance_amount: number;
  balance_amount: number;
  payment_mode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit Card';
  assigned_executives: AssignedExecutive[];
  vehicle_number?: string;
  vehicle_no?: string;
  driver_name?: string;
  driver_phone?: string;
  gate_pass_number?: string;
  notes?: string;
  crew_type?: 'in_house' | 'client_sourced';
  assigned_crew_type?: 'in_house' | 'client_sourced';
  total_labor_charges?: number;
  in_house_worker_count?: number;
  daily_wage_rate?: number;
  client_sourced_crew?: Array<{ id: string; name: string; phone: string; govt_id_or_notes?: string }>;
  client_crew_details?: Array<{ id: string; name: string; phone: string; notes?: string }>;
  order_field_crew?: Array<{
    id: string;
    worker_id?: string;
    worker_name?: string;
    worker_phone?: string;
    external_name?: string;
    external_phone?: string;
    crew_type: 'in_house' | 'client_sourced';
    daily_wage: number;
  }>;
  // 2-Step Return Verification & Pipeline Lifecycle Fields
  return_status_crew?: 'Pending' | 'Initiated' | 'Approved';
  return_status_exec?: 'Pending' | 'Verified' | 'Approved';
  return_notes_crew?: string;
  return_notes_exec?: string;
  return_initiated_at?: string;
  return_verified_at?: string;
  lifecycle_status?: 'Quotation' | 'Dispatched' | 'On_Site_Active' | 'Return_Initiated' | 'Verified_Closed' | 'Cancelled';
  final_invoice_generated?: boolean;
  final_invoice_id?: string;
  damage_deduction_amount?: number;
  // Immutable Locking & Closed Archive Status
  is_archived_or_closed?: boolean;
  is_locked?: boolean;
  closed_at?: string;
  closed_by?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryChallanData {
  order_id: string;
  order_number: string;
  movie_project_name: string;
  client_name: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  crew_type: 'in_house' | 'client_sourced';
  in_house_crew_ids: string[];
  client_crew_members: Array<{ name: string; phone: string; notes?: string }>;
  dispatch_notes?: string;
  dispatched_at: string;
  items_snapshot: Array<{
    id: string;
    prop_title: string;
    item_code: string;
    serial_number?: string;
    image_url?: string;
    replacement_value: number;
    daily_rate: number;
    condition_at_dispatch: string;
  }>;
}

export interface ReturnVerificationData {
  order_id: string;
  // Step A: Field Crew
  step_a_initiated_by: string;
  step_a_confirmed_count: number;
  step_a_total_count: number;
  has_damages: boolean;
  damage_notes?: string;
  damage_estimated_cost?: number;
  step_a_timestamp: string;
  // Step B: Warehouse Floor Sales Executive
  step_b_verified_by: string;
  warehouse_condition_rating: 'Pristine' | 'Good' | 'Minor_Wear' | 'Damaged';
  warehouse_notes?: string;
  step_b_timestamp: string;
}

export interface LaborSheetEntry {
  id: string;
  order_id: string;
  order_number: string;
  movie_project_name: string;
  crew_member_id: string;
  crew_name: string;
  badge_number: string;
  role_on_set: string;
  daily_wage_rate: number;
  active_shoot_days: number;
  total_wages_earned: number;
  voucher_number?: string;
  payment_status: 'Pending_Disbursement' | 'Approved' | 'Disbursed';
  disbursed_at?: string;
  created_at: string;
}

export interface FinalInvoiceRecord {
  id: string;
  invoice_number: string;
  order_id: string;
  order_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  production_name: string;
  shoot_location?: string;
  vehicle_no?: string;
  start_date: string;
  end_date: string;
  actual_shoot_days: number;
  base_rental_subtotal: number;
  handling_labor_charges: number;
  damage_penalties: number;
  gst_tax_amount: number;
  gross_total: number;
  advance_deduction: number;
  final_balance_due: number;
  items: Array<{
    id: string;
    prop_title: string;
    prop_category?: string;
    item_code: string;
    image_url?: string;
    daily_rental_rate: number;
    actual_days: number;
    line_total: number;
    replacement_value: number;
  }>;
  status: 'Issued' | 'Paid' | 'Partially_Paid' | 'Cancelled';
  created_at: string;
}

export interface WalkInOrderItem {
  id: string;
  order_id: string;
  prop_id?: string;
  prop_serialized_item_id?: string;
  item_code: string;
  prop_title: string;
  prop_category?: string;
  model_number?: string;
  image_url?: string;
  replacement_value: number;
  daily_rent_price: number;
  rental_days: number;
  line_total: number;
  quantity: number;
  warehouse_location: string;
  added_by_executive_id?: string;
  added_by_executive_name: string;
  scanned_by?: string;
  scanned_by_name: string;
  scanned_at: string;
  status: 'pending' | 'picked' | 'loaded' | 'dispatched' | 'returned';
  notes?: string;
}

export interface PropRentalHistoryEntry {
  id: string;
  prop_serialized_item_id: string;
  item_code: string;
  prop_name: string;
  order_id: string;
  order_number: string;
  client_name: string;
  movie_project_name: string;
  dispatched_at: string;
  returned_at?: string | null;
  rental_days: number;
  rental_earnings: number;
  return_condition: 'Good' | 'Minor Damage' | 'Repaired' | 'Pristine';
  vehicle_number?: string;
  driver_name?: string;
  created_at: string;
}

export interface CreateWalkInOrderInput {
  production_company_name: string;
  movie_project_name: string;
  client_contact_number: string;
  client_email_address: string;
  shoot_location: string;
  estimated_start_date: string;
  estimated_return_date: string;
  duration_days: number;
  assigned_executives: AssignedExecutive[];
  notes?: string;
  created_by?: string;
}

