// ============================================================================
// ASHWA MOVIE PROPERTY RENTALS: INTERNAL STAFF & HRMS SERVICE
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import {
  StaffProfile,
  StaffLeave,
  StaffPayroll,
  CreateStaffInput,
  UpdateStaffInput,
  SubmitLeaveInput,
  PayrollCalculationResult,
  DisburseSalaryInput,
  StaffFilters,
  StaffDepartment,
  StaffLeaveStatus,
} from '@/types/staff';
import { auditLogService } from './auditLogService';

const STORAGE_STAFF_KEY = 'ashwa_internal_staff_profiles_v1';
const STORAGE_LEAVES_KEY = 'ashwa_internal_staff_leaves_v1';
const STORAGE_PAYROLLS_KEY = 'ashwa_internal_staff_payrolls_v1';

// Seed Profiles
const INITIAL_STAFF: StaffProfile[] = [
  {
    id: 'stf-00000001-0000-0000-0000-000000000001',
    staff_id: 'ASH-STF-001',
    full_name: 'Arun Reddy',
    email: 'arun.reddy@ashwaprops.com',
    phone: '+91 98480 12345',
    department: 'BILLING',
    designation: 'Billing & Commercial Operations Manager',
    base_salary: 95000,
    joining_date: '2024-03-15',
    status: 'ACTIVE',
    emergency_contact: '+91 98480 99999',
    notes: 'Oversees commercial invoicing, high-value deposit returns, and movie production clearances.',
    created_at: new Date('2024-03-15T09:00:00Z').toISOString(),
  },
  {
    id: 'stf-00000002-0000-0000-0000-000000000002',
    staff_id: 'ASH-STF-002',
    full_name: 'Ravi Kumar',
    email: 'ravi.kumar@ashwaprops.com',
    phone: '+91 98491 23456',
    department: 'RENTAL_SALES',
    designation: 'Senior Rental Sales Executive (Floor 1 Lead)',
    base_salary: 65000,
    joining_date: '2024-06-01',
    status: 'ACTIVE',
    emergency_contact: '+91 98491 88888',
    notes: 'Leads walk-in quotations, studio consultations, and vintage prop packages.',
    created_at: new Date('2024-06-01T09:00:00Z').toISOString(),
  },
  {
    id: 'stf-00000003-0000-0000-0000-000000000003',
    staff_id: 'ASH-STF-003',
    full_name: 'Vikram Singh',
    email: 'vikram.singh@ashwaprops.com',
    phone: '+91 98492 34567',
    department: 'RENTAL_SALES',
    designation: 'Senior Rental Sales Executive (Floor 2 Lead)',
    base_salary: 65000,
    joining_date: '2024-08-10',
    status: 'ACTIVE',
    emergency_contact: '+91 98492 77777',
    notes: 'In charge of Modern Armory, Sci-Fi sets, and digital production orders.',
    created_at: new Date('2024-08-10T09:00:00Z').toISOString(),
  },
  {
    id: 'stf-00000004-0000-0000-0000-000000000004',
    staff_id: 'ASH-STF-004',
    full_name: 'Mohan Babu',
    email: 'mohan.babu@ashwaprops.com',
    phone: '+91 98493 45678',
    department: 'LOGISTICS_FLEET',
    designation: 'Fleet Dispatch Supervisor & Heavy Vehicle Lead',
    base_salary: 48000,
    joining_date: '2024-04-20',
    status: 'ACTIVE',
    emergency_contact: '+91 98493 66666',
    notes: 'Coordinates lorry dispatches, gate passes, driver documentation, and set deliveries.',
    created_at: new Date('2024-04-20T09:00:00Z').toISOString(),
  },
  {
    id: 'stf-00000005-0000-0000-0000-000000000005',
    staff_id: 'ASH-STF-005',
    full_name: 'K. Sunita Devi',
    email: 'sunita.devi@ashwaprops.com',
    phone: '+91 98494 56789',
    department: 'AUDITING_GOVERNANCE',
    designation: 'Warehouse Property Auditor & QC Specialist',
    base_salary: 52000,
    joining_date: '2025-01-05',
    status: 'ACTIVE',
    emergency_contact: '+91 98494 55555',
    notes: 'Performs weekly zone audits, wear & tear gradings, rack reconciliations, and defect flagging.',
    created_at: new Date('2025-01-05T09:00:00Z').toISOString(),
  },
];

// Seed Leaves
const INITIAL_LEAVES: StaffLeave[] = [
  {
    id: 'lv-00000001-0000-0000-0000-000000000001',
    staff_id: 'stf-00000002-0000-0000-0000-000000000002',
    staff_name: 'Ravi Kumar',
    department: 'RENTAL_SALES',
    designation: 'Senior Rental Sales Executive (Floor 1 Lead)',
    leave_type: 'Casual',
    start_date: '2026-09-08',
    end_date: '2026-09-09',
    total_days: 2,
    is_paid: true,
    reason: 'Family religious ceremony in hometown',
    status: 'APPROVED',
    approved_by: 'Arun Reddy',
    approved_at: new Date(Date.now() - 3600000 * 240).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 260).toISOString(),
  },
  {
    id: 'lv-00000002-0000-0000-0000-000000000002',
    staff_id: 'stf-00000004-0000-0000-0000-000000000004',
    staff_name: 'Mohan Babu',
    department: 'LOGISTICS_FLEET',
    designation: 'Fleet Dispatch Supervisor & Heavy Vehicle Lead',
    leave_type: 'Emergency',
    start_date: '2026-09-12',
    end_date: '2026-09-13',
    total_days: 2,
    is_paid: false,
    reason: 'Vehicle maintenance and personal travel',
    status: 'APPROVED',
    approved_by: 'Arun Reddy',
    approved_at: new Date(Date.now() - 3600000 * 144).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 160).toISOString(),
  },
  {
    id: 'lv-00000003-0000-0000-0000-000000000003',
    staff_id: 'stf-00000003-0000-0000-0000-000000000003',
    staff_name: 'Vikram Singh',
    department: 'RENTAL_SALES',
    designation: 'Senior Rental Sales Executive (Floor 2 Lead)',
    leave_type: 'Sick',
    start_date: '2026-09-22',
    end_date: '2026-09-23',
    total_days: 2,
    is_paid: true,
    reason: 'Scheduled doctor visit and dental procedure',
    status: 'PENDING',
    created_at: new Date().toISOString(),
  },
];

// Seed Payrolls
const INITIAL_PAYROLLS: StaffPayroll[] = [
  {
    id: 'pay-00000001-0000-0000-0000-000000000001',
    staff_id: 'stf-00000001-0000-0000-0000-000000000001',
    staff_name: 'Arun Reddy',
    staff_code: 'ASH-STF-001',
    department: 'BILLING',
    designation: 'Billing & Commercial Operations Manager',
    pay_month: 'August',
    pay_year: 2026,
    base_salary: 95000,
    total_days: 31,
    days_worked: 31,
    unpaid_leave_days: 0,
    allowances: 15000,
    deductions: 0,
    net_salary: 110000,
    payment_status: 'PAID',
    payment_ref: 'NEFT-202608-0011',
    payment_mode: 'NEFT',
    disbursed_at: '2026-08-31T18:00:00Z',
    disbursed_by: 'Managing Director',
    remarks: 'Disbursed on time via HDFC Corporate Banking',
    created_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'pay-00000002-0000-0000-0000-000000000002',
    staff_id: 'stf-00000002-0000-0000-0000-000000000002',
    staff_name: 'Ravi Kumar',
    staff_code: 'ASH-STF-002',
    department: 'RENTAL_SALES',
    designation: 'Senior Rental Sales Executive (Floor 1 Lead)',
    pay_month: 'August',
    pay_year: 2026,
    base_salary: 65000,
    total_days: 31,
    days_worked: 31,
    unpaid_leave_days: 0,
    allowances: 18000,
    deductions: 0,
    net_salary: 83000,
    payment_status: 'PAID',
    payment_ref: 'NEFT-202608-0012',
    payment_mode: 'NEFT',
    disbursed_at: '2026-08-31T18:00:00Z',
    disbursed_by: 'Managing Director',
    remarks: 'Production sales incentive included',
    created_at: '2026-08-31T18:00:00Z',
  },
  {
    id: 'pay-00000003-0000-0000-0000-000000000003',
    staff_id: 'stf-00000004-0000-0000-0000-000000000004',
    staff_name: 'Mohan Babu',
    staff_code: 'ASH-STF-004',
    department: 'LOGISTICS_FLEET',
    designation: 'Fleet Dispatch Supervisor & Heavy Vehicle Lead',
    pay_month: 'August',
    pay_year: 2026,
    base_salary: 48000,
    total_days: 31,
    days_worked: 29,
    unpaid_leave_days: 2,
    allowances: 6000,
    deductions: 3097,
    net_salary: 50903,
    payment_status: 'PAID',
    payment_ref: 'IMPS-202608-0089',
    payment_mode: 'IMPS',
    disbursed_at: '2026-08-31T18:00:00Z',
    disbursed_by: 'Managing Director',
    remarks: '2 days unpaid emergency leave deducted',
    created_at: '2026-08-31T18:00:00Z',
  },
];

// Fallback Memory Store for Node.js
const memoryStore = new Map<string, string>();

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    const raw = memoryStore.get(key);
    if (!raw) {
      memoryStore.set(key, JSON.stringify(fallback));
      return fallback;
    }
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
  if (typeof window === 'undefined') {
    memoryStore.set(key, JSON.stringify(value));
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode
  }
}

// Days in month helper
function getDaysInMonth(monthName: string, year: number): number {
  const monthMap: Record<string, number> = {
    January: 31,
    February: year % 4 === 0 ? 29 : 28,
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 30,
    December: 31,
  };
  return monthMap[monthName] || 30;
}

export const staffService = {
  // 1. Fetch All Internal Staff Members with Filters
  async getStaffMembers(filters?: StaffFilters): Promise<StaffProfile[]> {
    try {
      let query = supabase.from('staff_profiles').select('*');
      if (filters?.department && filters.department !== 'ALL') {
        query = query.eq('department', filters.department);
      }
      if (filters?.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }
      const { data, error } = await query.order('staff_id', { ascending: true });

      if (!error && data && data.length > 0) {
        // Merge with local changes
        const local = getStored<StaffProfile[]>(STORAGE_STAFF_KEY, INITIAL_STAFF);
        const map = new Map<string, StaffProfile>();
        data.forEach((s: any) => map.set(s.id, s as StaffProfile));
        local.forEach((s) => {
          if (!map.has(s.id)) map.set(s.id, s);
        });
        let result = Array.from(map.values());
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          result = result.filter(
            (s) =>
              s.full_name.toLowerCase().includes(q) ||
              s.staff_id.toLowerCase().includes(q) ||
              s.email.toLowerCase().includes(q) ||
              s.designation.toLowerCase().includes(q)
          );
        }
        return result;
      }
    } catch (e) {
      console.warn('Supabase getStaffMembers fallback:', e);
    }

    let staff = getStored<StaffProfile[]>(STORAGE_STAFF_KEY, INITIAL_STAFF);
    if (filters?.department && filters.department !== 'ALL') {
      staff = staff.filter((s) => s.department === filters.department);
    }
    if (filters?.status && filters.status !== 'ALL') {
      staff = staff.filter((s) => s.status === filters.status);
    }
    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      staff = staff.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.staff_id.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.designation.toLowerCase().includes(q)
      );
    }
    return staff;
  },

  // 2. Fetch Single Staff Profile by ID
  async getStaffById(id: string): Promise<StaffProfile | null> {
    const all = await this.getStaffMembers();
    return all.find((s) => s.id === id || s.staff_id === id) || null;
  },

  // 3. Create Internal Staff Profile
  async createStaff(input: CreateStaffInput): Promise<StaffProfile> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `stf-${Date.now()}`;
    const all = await this.getStaffMembers();
    const nextSeq = all.length + 1;
    const staffId = `ASH-STF-${String(nextSeq).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    const newStaff: StaffProfile = {
      id,
      staff_id: staffId,
      full_name: input.full_name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || '',
      department: input.department,
      designation: input.designation.trim(),
      base_salary: Number(input.base_salary) || 45000,
      joining_date: input.joining_date || timestamp.split('T')[0],
      status: input.status || 'ACTIVE',
      emergency_contact: input.emergency_contact?.trim() || '',
      notes: input.notes?.trim() || '',
      created_at: timestamp,
      updated_at: timestamp,
    };

    try {
      await supabase.from('staff_profiles').insert(newStaff);
    } catch (e) {
      console.warn('Supabase createStaff fallback:', e);
    }

    const current = getStored<StaffProfile[]>(STORAGE_STAFF_KEY, INITIAL_STAFF);
    setStored(STORAGE_STAFF_KEY, [...current, newStaff]);

    // Audit log
    await auditLogService.logStaffAction({
      user_id: newStaff.id,
      staff_name: newStaff.full_name,
      action_type: 'STAFF_ONBOARDED',
      target_entity: 'STAFF',
      entity_id: newStaff.staff_id,
      metadata: {
        department: newStaff.department,
        designation: newStaff.designation,
        base_salary: newStaff.base_salary,
      },
    });

    return newStaff;
  },

  // 4. Update Staff Profile
  async updateStaff(id: string, input: UpdateStaffInput): Promise<StaffProfile | null> {
    const timestamp = new Date().toISOString();
    let updatedStaff: StaffProfile | null = null;

    const current = getStored<StaffProfile[]>(STORAGE_STAFF_KEY, INITIAL_STAFF);
    const updated = current.map((s) => {
      if (s.id === id || s.staff_id === id) {
        updatedStaff = {
          ...s,
          ...input,
          updated_at: timestamp,
        };
        return updatedStaff;
      }
      return s;
    });

    setStored(STORAGE_STAFF_KEY, updated);

    try {
      await supabase
        .from('staff_profiles')
        .update({ ...input, updated_at: timestamp })
        .eq('id', id);
    } catch (e) {
      console.warn('Supabase updateStaff fallback:', e);
    }

    return updatedStaff;
  },

  // 5. Fetch Leave Requests
  async getLeaves(staffId?: string, status?: StaffLeaveStatus | 'ALL'): Promise<StaffLeave[]> {
    const staffMembers = await this.getStaffMembers();
    const staffMap = new Map(staffMembers.map((s) => [s.id, s]));

    try {
      let query = supabase.from('staff_leaves').select('*');
      if (staffId) {
        query = query.eq('staff_id', staffId);
      }
      if (status && status !== 'ALL') {
        query = query.eq('status', status);
      }
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((l: any) => {
          const s = staffMap.get(l.staff_id);
          return {
            ...l,
            staff_name: s ? s.full_name : l.staff_name || 'Staff Member',
            department: s?.department,
            designation: s?.designation,
          };
        });
      }
    } catch (e) {
      console.warn('Supabase getLeaves fallback:', e);
    }

    let all = getStored<StaffLeave[]>(STORAGE_LEAVES_KEY, INITIAL_LEAVES);
    if (staffId) {
      all = all.filter((l) => l.staff_id === staffId);
    }
    if (status && status !== 'ALL') {
      all = all.filter((l) => l.status === status);
    }
    return all.map((l) => {
      const s = staffMap.get(l.staff_id);
      return {
        ...l,
        staff_name: s ? s.full_name : l.staff_name || 'Staff Member',
        department: s?.department,
        designation: s?.designation,
      };
    });
  },

  // 6. Submit a Leave Request
  async submitLeave(input: SubmitLeaveInput): Promise<StaffLeave> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `lv-${Date.now()}`;
    const staff = await this.getStaffById(input.staff_id);
    const start = new Date(input.start_date);
    const end = new Date(input.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newLeave: StaffLeave = {
      id,
      staff_id: input.staff_id,
      staff_name: staff ? staff.full_name : 'Internal Staff',
      department: staff?.department,
      designation: staff?.designation,
      leave_type: input.leave_type,
      start_date: input.start_date,
      end_date: input.end_date,
      total_days: totalDays,
      is_paid: input.is_paid !== undefined ? input.is_paid : true,
      reason: input.reason.trim(),
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('staff_leaves').insert(newLeave);
    } catch (e) {
      console.warn('Supabase submitLeave fallback:', e);
    }

    const current = getStored<StaffLeave[]>(STORAGE_LEAVES_KEY, INITIAL_LEAVES);
    setStored(STORAGE_LEAVES_KEY, [newLeave, ...current]);

    // Log action
    if (staff) {
      await auditLogService.logStaffAction({
        user_id: staff.id,
        staff_name: staff.full_name,
        action_type: 'LEAVE_REQUESTED',
        target_entity: 'LEAVE',
        entity_id: newLeave.id,
        metadata: {
          leaveType: newLeave.leave_type,
          startDate: newLeave.start_date,
          endDate: newLeave.end_date,
          totalDays: newLeave.total_days,
        },
      });
    }

    return newLeave;
  },

  // 7. Approve or Reject Leave Request
  async updateLeaveStatus(
    leaveId: string,
    status: StaffLeaveStatus,
    isPaid: boolean = true,
    approvedBy: string = 'Admin Supervisor',
    rejectionReason?: string
  ): Promise<StaffLeave | null> {
    const timestamp = new Date().toISOString();
    let updatedLeave: StaffLeave | null = null;

    const current = getStored<StaffLeave[]>(STORAGE_LEAVES_KEY, INITIAL_LEAVES);
    const updated = current.map((l) => {
      if (l.id === leaveId) {
        updatedLeave = {
          ...l,
          status,
          is_paid: isPaid,
          approved_by: status === 'APPROVED' ? approvedBy : undefined,
          approved_at: status === 'APPROVED' ? timestamp : undefined,
          rejection_reason: status === 'REJECTED' ? rejectionReason : undefined,
          updated_at: timestamp,
        };
        return updatedLeave;
      }
      return l;
    });

    setStored(STORAGE_LEAVES_KEY, updated);

    try {
      await supabase
        .from('staff_leaves')
        .update({
          status,
          is_paid: isPaid,
          approved_by: status === 'APPROVED' ? approvedBy : null,
          approved_at: status === 'APPROVED' ? timestamp : null,
          rejection_reason: status === 'REJECTED' ? rejectionReason : null,
          updated_at: timestamp,
        })
        .eq('id', leaveId);
    } catch (e) {
      console.warn('Supabase updateLeaveStatus fallback:', e);
    }

    return updatedLeave;
  },

  // 8. Monthly Pay Run Calculator (With Unpaid Leave Impact)
  async calculateMonthlyPayroll(
    staffId: string,
    month: string,
    year: number,
    allowances: number = 0,
    extraDeductions: number = 0
  ): Promise<PayrollCalculationResult> {
    const staff = await this.getStaffById(staffId);
    if (!staff) {
      throw new Error(`Staff member with ID ${staffId} not found`);
    }

    const totalMonthDays = getDaysInMonth(month, year);

    // Calculate unpaid leaves in target month
    const allLeaves = await this.getLeaves(staff.id, 'APPROVED');
    let unpaidLeaveDays = 0;

    allLeaves.forEach((leave) => {
      if (leave.is_paid === false && leave.status === 'APPROVED') {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        // Check if leave falls in this year/month
        const monthIndex = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ].indexOf(month);

        if (start.getFullYear() === year && start.getMonth() === monthIndex) {
          unpaidLeaveDays += leave.total_days;
        }
      }
    });

    const payableDays = Math.max(0, totalMonthDays - unpaidLeaveDays);
    const perDayRate = Number((staff.base_salary / totalMonthDays).toFixed(2));
    const earnedBase = Number((perDayRate * payableDays).toFixed(2));
    const leaveDeductions = Number((perDayRate * unpaidLeaveDays).toFixed(2));
    const totalDeductions = Number((leaveDeductions + extraDeductions).toFixed(2));
    const netSalary = Math.max(0, Math.round(earnedBase + allowances - extraDeductions));

    return {
      staff,
      month,
      year,
      total_month_days: totalMonthDays,
      unpaid_leaves_count: unpaidLeaveDays,
      payable_days: payableDays,
      base_salary: staff.base_salary,
      per_day_rate: perDayRate,
      earned_base: earnedBase,
      allowances,
      leave_deductions: leaveDeductions,
      other_deductions: extraDeductions,
      total_deductions: totalDeductions,
      net_salary: netSalary,
    };
  },

  // 9. Generate & Disburse Salary Record
  async disburseSalary(input: DisburseSalaryInput): Promise<StaffPayroll> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`;
    const staff = await this.getStaffById(input.staff_id);
    const timestamp = new Date().toISOString();

    const newPayroll: StaffPayroll = {
      id,
      staff_id: input.staff_id,
      staff_name: staff?.full_name || 'Staff Member',
      staff_code: staff?.staff_id || 'ASH-STF-000',
      department: staff?.department,
      designation: staff?.designation,
      pay_month: input.month,
      pay_year: input.year,
      base_salary: input.base_salary,
      total_days: input.total_days,
      days_worked: input.days_worked,
      unpaid_leave_days: input.unpaid_leave_days,
      allowances: input.allowances,
      deductions: input.deductions,
      net_salary: input.net_salary,
      payment_status: 'PAID',
      payment_ref: input.payment_ref,
      payment_mode: input.payment_mode,
      disbursed_at: timestamp,
      disbursed_by: input.disbursed_by || 'Finance Controller',
      remarks: input.remarks || 'Monthly salary payment successfully settled',
      created_at: timestamp,
    };

    try {
      await supabase.from('staff_payrolls').insert(newPayroll);
    } catch (e) {
      console.warn('Supabase disburseSalary fallback:', e);
    }

    const current = getStored<StaffPayroll[]>(STORAGE_PAYROLLS_KEY, INITIAL_PAYROLLS);
    setStored(STORAGE_PAYROLLS_KEY, [newPayroll, ...current]);

    // Audit log
    if (staff) {
      await auditLogService.logStaffAction({
        user_id: staff.id,
        staff_name: staff.full_name,
        action_type: 'PAYROLL_GENERATED',
        target_entity: 'PAYROLL',
        entity_id: newPayroll.id,
        metadata: {
          period: `${input.month} ${input.year}`,
          netSalary: newPayroll.net_salary,
          paymentRef: newPayroll.payment_ref,
          paymentMode: newPayroll.payment_mode,
        },
      });
    }

    return newPayroll;
  },

  // 10. Fetch Payroll History
  async getPayrolls(staffId?: string, month?: string, year?: number): Promise<StaffPayroll[]> {
    const staffMembers = await this.getStaffMembers();
    const staffMap = new Map(staffMembers.map((s) => [s.id, s]));

    try {
      let query = supabase.from('staff_payrolls').select('*');
      if (staffId) query = query.eq('staff_id', staffId);
      if (month) query = query.eq('pay_month', month);
      if (year) query = query.eq('pay_year', year);
      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((p: any) => {
          const s = staffMap.get(p.staff_id);
          return {
            ...p,
            staff_name: s ? s.full_name : p.staff_name,
            staff_code: s ? s.staff_id : p.staff_code,
            department: s?.department,
            designation: s?.designation,
          };
        });
      }
    } catch (e) {
      console.warn('Supabase getPayrolls fallback:', e);
    }

    let all = getStored<StaffPayroll[]>(STORAGE_PAYROLLS_KEY, INITIAL_PAYROLLS);
    if (staffId) all = all.filter((p) => p.staff_id === staffId);
    if (month) all = all.filter((p) => p.pay_month === month);
    if (year) all = all.filter((p) => p.pay_year === year);

    return all.map((p) => {
      const s = staffMap.get(p.staff_id);
      return {
        ...p,
        staff_name: s ? s.full_name : p.staff_name,
        staff_code: s ? s.staff_id : p.staff_code,
        department: s?.department,
        designation: s?.designation,
      };
    });
  },

  // 11. Export Staff Roster to CSV
  exportStaffCSV(staffList: StaffProfile[]): string {
    const headers = [
      'Staff ID',
      'Full Name',
      'Email',
      'Phone',
      'Department',
      'Designation',
      'Base Salary (INR)',
      'Joining Date',
      'Status',
      'Emergency Contact',
    ];

    const rows = staffList.map((s) => [
      `"${s.staff_id}"`,
      `"${s.full_name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.phone || 'N/A'}"`,
      `"${s.department}"`,
      `"${s.designation.replace(/"/g, '""')}"`,
      s.base_salary,
      `"${s.joining_date}"`,
      `"${s.status}"`,
      `"${s.emergency_contact || 'N/A'}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  // 12. Export Payroll Ledger to CSV
  exportPayrollCSV(payrolls: StaffPayroll[]): string {
    const headers = [
      'Payroll ID',
      'Staff ID',
      'Staff Name',
      'Department',
      'Pay Period',
      'Base Salary (INR)',
      'Days in Month',
      'Days Worked',
      'Unpaid Leaves',
      'Allowances (INR)',
      'Deductions (INR)',
      'Net Salary Paid (INR)',
      'Payment Status',
      'Payment Reference',
      'Disbursed Date',
    ];

    const rows = payrolls.map((p) => [
      `"${p.id}"`,
      `"${p.staff_code || p.staff_id}"`,
      `"${(p.staff_name || 'Staff').replace(/"/g, '""')}"`,
      `"${p.department || 'N/A'}"`,
      `"${p.pay_month} ${p.pay_year}"`,
      p.base_salary,
      p.total_days,
      p.days_worked,
      p.unpaid_leave_days,
      p.allowances,
      p.deductions,
      p.net_salary,
      `"${p.payment_status}"`,
      `"${p.payment_ref || 'N/A'}"`,
      `"${p.disbursed_at || 'N/A'}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
