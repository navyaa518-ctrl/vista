'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  Building,
  CheckCircle2,
  FileText,
  Truck,
  ClipboardCheck,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { StaffActivityLog } from '@/types/staff';
import { auditLogService } from '@/lib/services/auditLogService';

export function AllStaffActivityLogs() {
  const [logs, setLogs] = useState<StaffActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditLogService.getAllActivityLogs({
        actionType: selectedAction,
        search,
        limit: 100,
      });
      setLogs(data);
    } catch (e) {
      console.error('Failed to load system activity logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedAction, search]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ORDER_DISPATCHED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PROPERTY_INSPECTED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'INVOICE_CREATED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'RETURN_CLEARED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LEAVE_REQUESTED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PAYROLL_GENERATED':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Action Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity by Staff Name, Entity ID (ORD-2026-089), Action..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <button
            onClick={loadLogs}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Trail</span>
          </button>
        </div>

        {/* Action Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Operations' },
            { id: 'ORDER_DISPATCHED', label: 'Order Dispatches' },
            { id: 'PROPERTY_INSPECTED', label: 'Property Inspections' },
            { id: 'INVOICE_CREATED', label: 'Commercial Invoicing' },
            { id: 'RETURN_CLEARED', label: 'Return Clearances' },
            { id: 'LEAVE_REQUESTED', label: 'Leave Requests' },
            { id: 'PAYROLL_GENERATED', label: 'Payroll Runs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedAction(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                selectedAction === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-4">Timestamp</th>
              <th className="py-3.5 px-4">Staff Member</th>
              <th className="py-3.5 px-4">Action Type</th>
              <th className="py-3.5 px-4">Target Entity &amp; ID</th>
              <th className="py-3.5 px-4">Operation Details &amp; Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-600 mb-2" />
                  Loading organization activity log trail...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                  No activity records match the selected criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-IN')}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{log.staff_name}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(
                        log.action_type
                      )}`}
                    >
                      {log.action_type.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800">{log.target_entity}:</span>{' '}
                    <span className="font-mono text-sky-700 font-bold bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                      {log.entity_id}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(log.metadata).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[10px] font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-600"
                          >
                            <strong>{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">No extra metadata</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
