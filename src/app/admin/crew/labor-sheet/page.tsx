'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  UserCheck,
  Film,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  RefreshCw,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Receipt,
  Building,
  Check,
  Filter,
} from 'lucide-react';
import { crewHubService } from '@/lib/services/crewHub';
import { LaborSheetEntry } from '@/types/orders';
import { formatINR } from '@/lib/utils';
import { LaborWageVoucherModal } from '@/components/crew/LaborWageVoucherModal';

type StatusFilter = 'all' | 'Pending_Disbursement' | 'Approved' | 'Disbursed';

export default function CrewLaborSheetPage() {
  const [entries, setEntries] = useState<LaborSheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntryForVoucher, setSelectedEntryForVoucher] = useState<LaborSheetEntry | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await crewHubService.getLaborSheetEntries();
      setEntries(data);
    } catch (err) {
      console.error('Failed to load labor sheet entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    const unsubscribe = crewHubService.subscribeToCrewHub((event) => {
      if (event.table === 'labor_vouchers' || event.table === 'order_crew_assignments') {
        loadEntries();
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdateStatus = async (
    entryId: string,
    status: 'Pending_Disbursement' | 'Approved' | 'Disbursed'
  ) => {
    setUpdatingId(entryId);
    try {
      await crewHubService.updateVoucherPaymentStatus(entryId, status);
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? {
                ...e,
                payment_status: status,
                disbursed_at: status === 'Disbursed' ? new Date().toISOString() : e.disbursed_at,
              }
            : e
        )
      );
      if (selectedEntryForVoucher && selectedEntryForVoucher.id === entryId) {
        setSelectedEntryForVoucher((prev) =>
          prev
            ? {
                ...prev,
                payment_status: status,
                disbursed_at: status === 'Disbursed' ? new Date().toISOString() : prev.disbursed_at,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Error updating disbursement status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let pendingCount = 0;
    let pendingAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let disbursedCount = 0;
    let disbursedAmount = 0;
    let totalGrossAmount = 0;

    entries.forEach((e) => {
      totalGrossAmount += e.total_wages_earned || 0;
      if (e.payment_status === 'Pending_Disbursement') {
        pendingCount++;
        pendingAmount += e.total_wages_earned || 0;
      } else if (e.payment_status === 'Approved') {
        approvedCount++;
        approvedAmount += e.total_wages_earned || 0;
      } else if (e.payment_status === 'Disbursed') {
        disbursedCount++;
        disbursedAmount += e.total_wages_earned || 0;
      }
    });

    return {
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      disbursedCount,
      disbursedAmount,
      totalGrossAmount,
    };
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((e) => {
      if (statusFilter !== 'all' && e.payment_status !== statusFilter) return false;
      if (!q) return true;

      const crew = (e.crew_name || '').toLowerCase();
      const badge = (e.badge_number || '').toLowerCase();
      const movie = (e.movie_project_name || '').toLowerCase();
      const orderNum = (e.order_number || '').toLowerCase();
      const voucher = (e.voucher_number || '').toLowerCase();

      return (
        crew.includes(q) ||
        badge.includes(q) ||
        movie.includes(q) ||
        orderNum.includes(q) ||
        voucher.includes(q)
      );
    });
  }, [entries, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <FileText className="w-3 h-3 text-amber-600" />
              Integrated Crew Hub Ledger
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Total Vouchers: <strong className="text-slate-900">{entries.length}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight font-sans">
            Crew Labor Sheet &amp; Wage Vouchers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-synced field labor ledger, shooting day verifications, daily wage rates, and authorized disbursement vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadEntries}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 text-slate-600 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
            title="Refresh Labor Entries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <Link
            href="/admin/orders/pipeline"
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md shadow-slate-950/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Go to Rental Pipeline</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Gross Labor</span>
            <Receipt className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-950 font-mono">
            {formatINR(stats.totalGrossAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {entries.length} crew assignments</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Pending Disbursement</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">
            {formatINR(stats.pendingAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.pendingCount} vouchers awaiting audit</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Approved for Payout</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 font-mono">
            {formatINR(stats.approvedAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.approvedCount} vouchers authorized</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Disbursed &amp; Settled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            {formatINR(stats.disbursedAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.disbursedCount} vouchers paid</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Vouchers ({entries.length})
          </button>
          <button
            onClick={() => setStatusFilter('Pending_Disbursement')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'Pending_Disbursement'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending ({stats.pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('Approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'Approved'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Approved ({stats.approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('Disbursed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'Disbursed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Disbursed ({stats.disbursedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crew, project, voucher..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Labor Sheet Entries</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When internal crew are dispatched with walk-in orders, their daily shoot wages are automatically tracked here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none">
                <tr>
                  <th className="py-3 px-4">Voucher Ref</th>
                  <th className="py-3 px-4">Crew Member</th>
                  <th className="py-3 px-4">Movie Project / Order</th>
                  <th className="py-3 px-4 text-center">Active Shoot Days</th>
                  <th className="py-3 px-4 text-right">Daily Wage</th>
                  <th className="py-3 px-4 text-right">Total Payable</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Voucher &amp; Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Voucher Ref */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {entry.voucher_number || `VCH-${entry.order_number}-${entry.badge_number || '01'}`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(entry.created_at || Date.now()).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    {/* Crew Member */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold text-[11px]">
                          {entry.crew_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">{entry.crew_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {entry.badge_number || 'CRW-REG'} • {entry.role_on_set || 'Field Crew'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Movie Project / Order */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                        {entry.movie_project_name || 'Feature Film Shoot'}
                      </p>
                      <Link
                        href={`/admin/orders/${entry.order_id}/billing-cart`}
                        className="text-[10px] font-mono text-sky-700 hover:underline flex items-center gap-1"
                      >
                        <span>{entry.order_number}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </Link>
                    </td>

                    {/* Active Shoot Days */}
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-900">
                      {entry.active_shoot_days} {entry.active_shoot_days === 1 ? 'Day' : 'Days'}
                    </td>

                    {/* Daily Wage */}
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      ₹{entry.daily_wage_rate?.toLocaleString('en-IN')} / day
                    </td>

                    {/* Total Wages */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-950 text-sm">
                      {formatINR(entry.total_wages_earned)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          entry.payment_status === 'Disbursed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : entry.payment_status === 'Approved'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {entry.payment_status === 'Disbursed' && <CheckCircle2 className="w-3 h-3" />}
                        {entry.payment_status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                        {entry.payment_status === 'Pending_Disbursement' && <Clock className="w-3 h-3" />}
                        {entry.payment_status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => setSelectedEntryForVoucher(entry)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="View / Print Printable Wage Voucher"
                        >
                          <Printer className="w-3 h-3 text-slate-600" />
                          <span>Voucher</span>
                        </button>

                        {entry.payment_status === 'Pending_Disbursement' && (
                          <button
                            disabled={updatingId === entry.id}
                            onClick={() => handleUpdateStatus(entry.id, 'Approved')}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                            title="Approve for disbursement"
                          >
                            Approve
                          </button>
                        )}

                        {entry.payment_status === 'Approved' && (
                          <button
                            disabled={updatingId === entry.id}
                            onClick={() => handleUpdateStatus(entry.id, 'Disbursed')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                            title="Mark as paid out"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Labor Wage Voucher Modal */}
      {selectedEntryForVoucher && (
        <LaborWageVoucherModal
          isOpen={!!selectedEntryForVoucher}
          entry={selectedEntryForVoucher}
          onClose={() => setSelectedEntryForVoucher(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}
