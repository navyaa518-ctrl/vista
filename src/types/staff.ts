// ============================================================================
// ASHWA MOVIE PROPERTY RENTALS: INTERNAL STAFF & HRMS DOMAIN TYPES
// ============================================================================

export type StaffDepartment =
  | 'RENTAL_SALES'
  | 'BILLING'
  | 'LOGISTICS_FLEET'
  | 'AUDITING_GOVERNANCE';

export type StaffEmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export type StaffLeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type StaffPayrollStatus = 'DRAFT' | 'PAID';

export interface StaffProfile {
  id: string;
  staff_id: string; // e.g. ASH-STF-001
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  department: StaffDepartment;
  designation: string;
  base_salary: number;
  joining_date: string;
  status: StaffEmploymentStatus;
  emergency_contact?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffActivityLog {
  id: string;
  user_id: string;
  staff_name: string;
  action_type:
    | 'ORDER_DISPATCHED'
    | 'PROPERTY_INSPECTED'
    | 'INVOICE_CREATED'
    | 'RETURN_CLEARED'
    | 'LEAVE_REQUESTED'
    | 'PAYROLL_GENERATED'
    | string;
  target_entity: 'ORDER' | 'INSPECTION' | 'BILLING' | 'LEAVE' | 'PAYROLL' | string;
  entity_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface StaffLeave {
  id: string;
  staff_id: string;
  staff_name?: string;
  department?: StaffDepartment;
  designation?: string;
  leave_type: 'Casual' | 'Sick' | 'Emergency' | 'Annual' | string;
  start_date: string;
  end_date: string;
  total_days: number;
  is_paid: boolean;
  reason: string;
  status: StaffLeaveStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface StaffPayroll {
  id: string;
  staff_id: string;
  staff_name?: string;
  staff_code?: string;
  department?: StaffDepartment;
  designation?: string;
  pay_month: string;
  pay_year: number;
  base_salary: number;
  total_days: number;
  days_worked: number;
  unpaid_leave_days: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_status: StaffPayrollStatus;
  payment_ref?: string;
  payment_mode?: 'NEFT' | 'IMPS' | 'UPI' | 'CASH' | string;
  disbursed_at?: string;
  disbursed_by?: string;
  remarks?: string;
  created_at: string;
}

export interface CreateStaffInput {
  full_name: string;
  email: string;
  phone?: string;
  department: StaffDepartment;
  designation: string;
  base_salary: number;
  joining_date: string;
  status?: StaffEmploymentStatus;
  emergency_contact?: string;
  notes?: string;
}

export interface UpdateStaffInput {
  full_name?: string;
  email?: string;
  phone?: string;
  department?: StaffDepartment;
  designation?: string;
  base_salary?: number;
  status?: StaffEmploymentStatus;
  emergency_contact?: string;
  notes?: string;
}

export interface SubmitLeaveInput {
  staff_id: string;
  leave_type: 'Casual' | 'Sick' | 'Emergency' | 'Annual';
  start_date: string;
  end_date: string;
  is_paid?: boolean;
  reason: string;
}

export interface CalculatePayrollInput {
  staff_id: string;
  month: string;
  year: number;
  allowances?: number;
  extra_deductions?: number;
}

export interface PayrollCalculationResult {
  staff: StaffProfile;
  month: string;
  year: number;
  total_month_days: number;
  unpaid_leaves_count: number;
  payable_days: number;
  base_salary: number;
  per_day_rate: number;
  earned_base: number;
  allowances: number;
  leave_deductions: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
}

export interface DisburseSalaryInput {
  staff_id: string;
  month: string;
  year: number;
  base_salary: number;
  total_days: number;
  days_worked: number;
  unpaid_leave_days: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  payment_mode: 'NEFT' | 'IMPS' | 'UPI' | 'CASH';
  payment_ref: string;
  disbursed_by?: string;
  remarks?: string;
}

export interface StaffFilters {
  search?: string;
  department?: StaffDepartment | 'ALL';
  status?: StaffEmploymentStatus | 'ALL';
}
