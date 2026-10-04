'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CreditCard,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  Building,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  StaffProfile,
  StaffPayroll,
  PayrollCalculationResult,
  DisburseSalaryInput,
} from '@/types/staff';
import { staffService } from '@/lib/services/staffService';
import { formatINR } from '@/lib/utils';

interface StaffPayrollSlipProps {
  initialStaff?: StaffProfile | null;
  initialPayroll?: StaffPayroll | null;
  onClearInitialPayroll?: () => void;
}

const MONTHS = [
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
];

// Helper to convert number to Indian words
function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(num: number): string {
    if (num === 0) return '';
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + units[num % 10] : '');
  }

  function convertThreeDigits(num: number): string {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    let res = '';
    if (hundred > 0) res += units[hundred] + ' Hundred';
    if (remainder > 0) res += (res ? ' and ' : '') + convertTwoDigits(remainder);
    return res;
  }

  let crore = Math.floor(rounded / 10000000);
  let lakh = Math.floor((rounded % 10000000) / 100000);
  let thousand = Math.floor((rounded % 100000) / 1000);
  let remainder = rounded % 1000;

  let result = '';
  if (crore > 0) result += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) result += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) result += convertTwoDigits(thousand) + ' Thousand ';
  if (remainder > 0) result += convertThreeDigits(remainder);

  return 'INR ' + result.trim() + ' Rupees Only';
}

export function StaffPayrollSlip({
  initialStaff,
  initialPayroll,
  onClearInitialPayroll,
}: StaffPayrollSlipProps) {
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>(initialStaff?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('September');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Form Inputs
  const [allowances, setAllowances] = useState<number>(0);
  const [extraDeductions, setExtraDeductions] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'NEFT' | 'IMPS' | 'UPI' | 'CASH'>('NEFT');
  const [paymentRef, setPaymentRef] = useState<string>('NEFT-202609-0045');
  const [remarks, setRemarks] = useState<string>('Monthly salary settlement');

  // Calculation Result
  const [calcResult, setCalcResult] = useState<PayrollCalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [disbursing, setDisbursing] = useState(false);

  // Past Payrolls Ledger
  const [payrolls, setPayrolls] = useState<StaffPayroll[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(true);

  // Active Pay Slip for Printing
  const [printingPayroll, setPrintingPayroll] = useState<StaffPayroll | null>(initialPayroll || null);

  useEffect(() => {
    loadStaffAndPayrolls();
  }, []);

  useEffect(() => {
    if (initialPayroll) {
      setPrintingPayroll(initialPayroll);
    }
  }, [initialPayroll]);

  useEffect(() => {
    if (initialStaff) {
      setSelectedStaffId(initialStaff.id);
    }
  }, [initialStaff]);

  const loadStaffAndPayrolls = async () => {
    setLoadingLedger(true);
    try {
      const [staff, pastPayrolls] = await Promise.all([
        staffService.getStaffMembers({ status: 'ACTIVE' }),
        staffService.getPayrolls(),
      ]);
      setStaffList(staff);
      setPayrolls(pastPayrolls);
      if (staff.length > 0 && !selectedStaffId && !initialStaff) {
        setSelectedStaffId(staff[0].id);
      }
    } catch (e) {
      console.error('Failed to load payroll prerequisites:', e);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Re-calculate whenever staff, month, year, or adjustment changes
  useEffect(() => {
    if (selectedStaffId) {
      runCalculation();
    }
  }, [selectedStaffId, selectedMonth, selectedYear, allowances, extraDeductions]);

  const runCalculation = async () => {
    if (!selectedStaffId) return;
    setCalculating(true);
    try {
      const result = await staffService.calculateMonthlyPayroll(
        selectedStaffId,
        selectedMonth,
        selectedYear,
        allowances,
        extraDeductions
      );
      setCalcResult(result);
    } catch (e) {
      console.error('Failed to calculate payroll:', e);
    } finally {
      setCalculating(false);
    }
  };

  const handleDisburseSalary = async () => {
    if (!calcResult) return;
    if (!paymentRef.trim()) {
      alert('Please provide a payment reference number (NEFT / IMPS / Cash voucher)');
      return;
    }

    setDisbursing(true);
    try {
      const input: DisburseSalaryInput = {
        staff_id: calcResult.staff.id,
        month: calcResult.month,
        year: calcResult.year,
        base_salary: calcResult.base_salary,
        total_days: calcResult.total_month_days,
        days_worked: calcResult.payable_days,
        unpaid_leave_days: calcResult.unpaid_leaves_count,
        allowances: calcResult.allowances,
        deductions: calcResult.total_deductions,
        net_salary: calcResult.net_salary,
        payment_mode: paymentMode,
        payment_ref: paymentRef,
        disbursed_by: 'Finance Controller',
        remarks: remarks || 'Monthly salary payment settled via banking channel',
      };

      const record = await staffService.disburseSalary(input);
      const updatedPayrolls = await staffService.getPayrolls();
      setPayrolls(updatedPayrolls);
      setPrintingPayroll(record);
    } catch (e: any) {
      alert(`Error disbursing salary: ${e.message}`);
    } finally {
      setDisbursing(false);
    }
  };

  const handleExportCSV = () => {
    const csv = staffService.exportPayrollCSV(payrolls);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ashwa_payroll_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Interactive Pay Run Calculator */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <span>Monthly Pay Run &amp; Salary Disbursal Engine</span>
            </h2>
            <p className="text-xs text-slate-500">
              Auto-computes payable working days by factoring in approved unpaid leaves.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Payroll CSV</span>
            </button>
          </div>
        </div>

        {/* Form Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Internal Staff</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.staff_id} - {s.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Target Pay Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Target Pay Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>
        </div>

        {/* Live Calculation Display Box */}
        {calcResult && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  Automated Calculation Breakdown
                </span>
                <h3 className="text-sm font-bold text-white">
                  {calcResult.staff.full_name} ({calcResult.staff.staff_id}) • {calcResult.month} {calcResult.year}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Net Salary Payable</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {formatINR(calcResult.net_salary)}
                </span>
              </div>
            </div>

            {/* Formula Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Base Salary</span>
                <span className="font-mono font-bold text-white">
                  {formatINR(calcResult.base_salary)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Month Days</span>
                <span className="font-mono font-bold text-white">
                  {calcResult.total_month_days} Days
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Unpaid Leaves</span>
                <span className="font-mono font-bold text-rose-400">
                  {calcResult.unpaid_leaves_count} Days
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Payable Days</span>
                <span className="font-mono font-bold text-emerald-400">
                  {calcResult.payable_days} Days
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block">Per-Day Rate</span>
                <span className="font-mono font-bold text-sky-400">
                  {formatINR(calcResult.per_day_rate)}
                </span>
              </div>
            </div>

            {calcResult.unpaid_leaves_count > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-[11px] text-rose-200 flex items-center justify-between">
                <span>
                  ⚠️ <strong>Unpaid Leave Deduction:</strong> {calcResult.unpaid_leaves_count} Days @{' '}
                  {formatINR(calcResult.per_day_rate)}/day
                </span>
                <strong className="font-mono text-rose-400">
                  - {formatINR(calcResult.leave_deductions)}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Adjustments & Payment Disbursal Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-slate-100">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Sales Incentive / Allowances (₹)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={allowances}
              onChange={(e) => setAllowances(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Other Deductions (TDS/Advance) (₹)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={extraDeductions}
              onChange={(e) => setExtraDeductions(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
            >
              <option value="NEFT">Bank Transfer (NEFT)</option>
              <option value="IMPS">Instant Transfer (IMPS)</option>
              <option value="UPI">Corporate UPI</option>
              <option value="CASH">Cash Voucher</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Payment Ref / UTR No.</label>
            <input
              type="text"
              required
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. NEFT-202609-0091"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleDisburseSalary}
            disabled={disbursing || !calcResult}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {disbursing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Confirm &amp; Disburse Monthly Salary</span>
          </button>
        </div>
      </div>

      {/* 2. Disbursed Salaries Historical Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Disbursed Salaries &amp; Settled Payroll Ledger
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {payrolls.length} Recorded Disbursements
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4">Staff Member &amp; ID</th>
                <th className="py-3.5 px-4">Pay Period</th>
                <th className="py-3.5 px-4">Working Days</th>
                <th className="py-3.5 px-4 text-right">Base Salary</th>
                <th className="py-3.5 px-4 text-right">Allowances</th>
                <th className="py-3.5 px-4 text-right">Deductions</th>
                <th className="py-3.5 px-4 text-right">Net Disbursed</th>
                <th className="py-3.5 px-4">Payment Reference</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingLedger ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    Loading settled payroll records...
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No payroll disbursements recorded yet.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{p.staff_name}</span>
                        <span className="font-mono text-[10px] text-sky-700">
                          {p.staff_code || p.staff_id}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {p.pay_month} {p.pay_year}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className="text-slate-800 font-bold">{p.days_worked}</span>
                      <span className="text-slate-400">/{p.total_days} Days</span>
                      {p.unpaid_leave_days > 0 && (
                        <span className="text-rose-600 block text-[10px]">
                          ({p.unpaid_leave_days} unpaid)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      {formatINR(p.base_salary)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600">
                      +{formatINR(p.allowances)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-rose-600">
                      -{formatINR(p.deductions)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatINR(p.net_salary)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-800 block">{p.payment_ref}</span>
                        <span className="text-[10px] text-slate-400">{p.payment_mode}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setPrintingPayroll(p)}
                        className="px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs border border-sky-200 transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Pay Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Official Printable Salary Slip Modal */}
      {printingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-200">
            {/* Action Bar (Hidden on print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-xs font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Official Employee Salary Slip Preview</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Pay Slip</span>
                </button>

                <button
                  onClick={() => {
                    setPrintingPayroll(null);
                    onClearInitialPayroll?.();
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 space-y-6 text-slate-900 printable-payslip bg-white">
              {/* Company Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-44 h-24 sm:w-52 sm:h-28 shrink-0">
                    <Image
                      src="/brand/aswa-logo.png"
                      alt="ASHWA Movie Props Rental Logo"
                      fill
                      sizes="(max-width: 640px) 176px, 208px"
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black tracking-tight text-slate-900">
                        ASHWA MOVIE PROPERTY RENTALS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Studio Logistics, Film Props &amp; Cinema Equipment Corporation
                    </p>
                    <p className="text-[10px] text-slate-400">
                      120-B, Ramoji Film City Zone, Hyderabad, Telangana - 501512
                    </p>
                    <p className="text-[10px] text-slate-400">
                      GSTIN: <strong>36AABCU9603R1ZM</strong> | Corporate CIN: U92100TG2024PTC184920
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-wider uppercase">
                    Salary Slip
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 block mt-1">
                    {printingPayroll.pay_month} {printingPayroll.pay_year}
                  </span>
                </div>
              </div>

              {/* Staff Metadata Table */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Employee Name
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {printingPayroll.staff_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Employee ID / Code
                    </span>
                    <span className="font-mono font-bold text-sky-700">
                      {printingPayroll.staff_code || printingPayroll.staff_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Department
                    </span>
                    <span className="font-semibold text-slate-800">
                      {printingPayroll.department?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Designation
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {printingPayroll.designation || 'Specialist'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Working Days in Month
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {printingPayroll.days_worked} / {printingPayroll.total_days} Days
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Unpaid Leaves Deducted
                    </span>
                    <span className="font-mono font-bold text-rose-600">
                      {printingPayroll.unpaid_leave_days} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* Earnings vs Deductions Breakdown */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-700 tracking-wider">
                      <th className="py-2.5 px-4 text-left w-1/2 border-r border-slate-200">Earnings</th>
                      <th className="py-2.5 px-4 text-left w-1/2">Deductions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-4 border-r border-slate-200 align-top">
                        <div className="flex justify-between py-1">
                          <span className="text-slate-600">Base Salary:</span>
                          <span className="font-mono font-semibold">
                            {formatINR(printingPayroll.base_salary)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-600">Performance Incentives:</span>
                          <span className="font-mono font-semibold">
                            +{formatINR(printingPayroll.allowances)}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-4 align-top">
                        <div className="flex justify-between py-1">
                          <span className="text-slate-600">
                            Unpaid Leave Deductions ({printingPayroll.unpaid_leave_days}d):
                          </span>
                          <span className="font-mono font-semibold text-rose-600">
                            -{formatINR(printingPayroll.deductions)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-600">Professional Tax / TDS:</span>
                          <span className="font-mono font-semibold text-slate-700">₹0.00</span>
                        </div>
                      </td>
                    </tr>

                    {/* Total Row */}
                    <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                      <td className="py-2.5 px-4 border-r border-slate-200">
                        <div className="flex justify-between">
                          <span>Total Gross Earnings:</span>
                          <span className="font-mono text-emerald-700">
                            {formatINR(printingPayroll.base_salary + printingPayroll.allowances)}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="flex justify-between">
                          <span>Total Deductions:</span>
                          <span className="font-mono text-rose-700">
                            -{formatINR(printingPayroll.deductions)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Disbursed Box */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Net Paid Amount (In Words)
                  </span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block italic">
                    {numberToWordsINR(printingPayroll.net_salary)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Take Home Pay
                  </span>
                  <span className="text-xl font-black font-mono text-slate-900">
                    {formatINR(printingPayroll.net_salary)}
                  </span>
                </div>
              </div>

              {/* Banking & Disbursal Information */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Mode:</span>
                  <strong className="text-slate-800">{printingPayroll.payment_mode}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Transaction Reference:</span>
                  <strong className="text-slate-800">{printingPayroll.payment_ref}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Disbursed Date:</span>
                  <strong className="text-slate-800">
                    {printingPayroll.disbursed_at
                      ? new Date(printingPayroll.disbursed_at).toLocaleDateString('en-IN')
                      : 'Settled'}
                  </strong>
                </div>
              </div>

              {/* Authorized Signatory Block */}
              <div className="pt-10 flex items-end justify-between border-t border-slate-200 text-xs">
                <div className="text-center space-y-1">
                  <div className="w-36 border-b border-slate-400 pb-1 font-mono text-[10px] text-slate-400">
                    [Digitally Authenticated]
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Employee Signature
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <div className="w-48 border-b-2 border-slate-900 pb-1 font-bold text-[11px] text-slate-900 font-serif">
                    K. Srinivas Varma
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 block">
                    Authorized Signatory
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    ASHWA Entertainment Logistics Pvt Ltd
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
