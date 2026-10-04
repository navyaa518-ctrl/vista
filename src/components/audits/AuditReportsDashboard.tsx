'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  ShieldCheck,
  RefreshCw,
  X,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  ExternalLink,
  Users,
  CheckCheck,
} from 'lucide-react';
import {
  AuditMetricsOverview,
  PropHealthHistoryEntry,
  AuditCondition,
} from '@/types/audits';
import { inspectionService } from '@/lib/services/inspectionService';
import { PropAuditHistoryView } from './PropAuditHistoryView';

interface AuditReportsDashboardProps {
  initialTab?: 'overview' | 'reports';
  onSelectTask?: (taskId: string) => void;
  onOpenExecutionConsole?: () => void;
}

export function AuditReportsDashboard({
  initialTab = 'overview',
  onSelectTask,
  onOpenExecutionConsole,
}: AuditReportsDashboardProps = {}) {
  const [metrics, setMetrics] = useState<AuditMetricsOverview>({
    totalInspectedThisWeek: 0,
    overdueInspectionsCount: 0,
    flaggedDamagedCount: 0,
    rackAccuracyPercent: 100,
    completedBatchesCount: 0,
    activeBatchesCount: 0,
    totalPendingCount: 0,
  });

  const [logs, setLogs] = useState<PropHealthHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedInspector, setSelectedInspector] = useState('all');
  const [misplacedOnly, setMisplacedOnly] = useState(false);

  // Modal State
  const [historyPropId, setHistoryPropId] = useState<string | null>(null);
  const [historyPropTitle, setHistoryPropTitle] = useState<string | undefined>();

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedMetrics, fetchedLogs] = await Promise.all([
        inspectionService.getAuditOverviewMetrics(),
        inspectionService.getAuditHistoryLog(),
      ]);
      setMetrics(fetchedMetrics);
      setLogs(fetchedLogs);
    } catch (e) {
      console.error('Failed to load audit reports data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const conditionVal = l.status || l.condition || '';
    if (selectedCondition !== 'all' && conditionVal !== selectedCondition) return false;

    const inspectorName = l.inspected_by_name || '';
    if (selectedInspector !== 'all' && !inspectorName.toLowerCase().includes(selectedInspector.toLowerCase())) {
      return false;
    }

    const rackVal = l.rack_location || l.rack_verified || '';
    if (selectedZone !== 'all' && !rackVal.toLowerCase().includes(selectedZone.toLowerCase())) {
      return false;
    }

    if (misplacedOnly && !l.is_misplaced) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const ttl = (l.prop_title || '').toLowerCase();
      const code = (l.prop_code || '').toLowerCase();
      const nts = (l.notes || '').toLowerCase();
      const rck = rackVal.toLowerCase();

      return ttl.includes(q) || code.includes(q) || nts.includes(q) || rck.includes(q);
    }
    return true;
  });

  // One-Click CSV Export
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No audit log records to export.');
      return;
    }

    const csvContent = inspectionService.exportAuditLogsToCSV(filteredLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `ashwa_property_health_audit_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getConditionBadge = (c?: string) => {
    switch (c) {
      case 'PERFECT':
      case 'EXCELLENT':
      case 'GOOD':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MINOR_DAMAGE':
      case 'MINOR_WEAR':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MAJOR_DAMAGE':
      case 'DAMAGED_NEEDS_REPAIR':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'MISSING':
        return 'bg-red-50 text-red-700 border-red-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 KPI Widgets with Total Checked vs Pending */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* KPI 1: Inspected This Week */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Props Checked This Week</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-950 font-mono">
            {metrics.totalInspectedThisWeek}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Physical units verified</p>
        </div>

        {/* KPI 2: Total Pending in Active Scope */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Pending Inspections</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-950 font-mono">
            {metrics.totalPendingCount ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting physical scan</p>
        </div>

        {/* KPI 3: Flagged Damaged */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Flagged for Repair</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">
            {metrics.flaggedDamagedCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Requires maintenance</p>
        </div>

        {/* KPI 4: Rack Accuracy */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Rack Location Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-950 font-mono">
            {metrics.rackAccuracyPercent}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Props in assigned racks</p>
        </div>
      </div>

      {/* Filter Controls & Export Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              <span>Chronological Inspection Log &amp; Audit Reports</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredLogs.length} entries)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Weekly Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search prop code, title, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Condition Filter */}
          <div>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="all">All Conditions</option>
              <option value="PERFECT">Perfect / Good</option>
              <option value="MINOR_DAMAGE">Minor Wear</option>
              <option value="MAJOR_DAMAGE">Damaged (Needs Repair)</option>
              <option value="MISSING">Missing / Lost</option>
            </select>
          </div>

          {/* Floor / Zone Filter */}
          <div>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="all">All Floors &amp; Racks</option>
              <option value="Floor 1">Floor 1</option>
              <option value="Floor 2">Floor 2</option>
              <option value="Floor 3">Floor 3</option>
            </select>
          </div>

          {/* Misplaced Toggle */}
          <div className="flex items-center">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={misplacedOnly}
                onChange={(e) => setMisplacedOnly(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span>Misplaced Props Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Filterable Audit Log Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Property Item</th>
                <th className="py-3 px-4">Audited Health Status</th>
                <th className="py-3 px-4">Rack Location</th>
                <th className="py-3 px-4">Inspected By</th>
                <th className="py-3 px-4">Evidence &amp; Notes</th>
                <th className="py-3 px-4 text-right">Health Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No audit records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateStr = log.timestamp || log.inspected_at || new Date().toISOString();
                  const logDate = new Date(dateStr);
                  const conditionVal = (log.status || log.condition || 'PERFECT').toString();
                  const photos = log.photo_urls && log.photo_urls.length > 0 ? log.photo_urls : log.photo_url ? [log.photo_url] : [];

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Date */}
                      <td className="py-3.5 px-4 text-xs font-mono">
                        <div className="text-slate-900 font-semibold">
                          {logDate.toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {logDate.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* 2. Property Item */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {log.prop_image && (
                            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                              <Image
                                src={log.prop_image}
                                alt={log.prop_title || 'Prop'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {log.prop_code || 'PROP-SKU'}
                            </span>
                            <h4 className="font-bold text-xs text-slate-900 truncate mt-0.5">
                              {log.prop_title || 'Cinematic Prop Unit'}
                            </h4>
                          </div>
                        </div>
                      </td>

                      {/* 3. Condition */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border uppercase tracking-wider ${getConditionBadge(
                              conditionVal
                            )}`}
                          >
                            {conditionVal.replace(/_/g, ' ')}
                          </span>
                          {log.is_functional !== undefined && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                log.is_functional
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {log.is_functional ? '⚡ Operational' : '⚠️ Defective'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Rack Location */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px] text-slate-700">
                            {log.rack_location || log.rack_verified || 'Verified'}
                          </span>
                          {log.is_misplaced && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">
                              MISPLACED
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Inspected By */}
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-medium text-slate-800">
                          {log.inspected_by_name || 'Inspector'}
                        </span>
                      </td>

                      {/* 6. Evidence & Notes */}
                      <td className="py-3.5 px-4 text-xs max-w-xs">
                        <div className="space-y-1">
                          {log.notes ? (
                            <p className="text-slate-600 truncate text-[11px]" title={log.notes}>
                              {log.notes}
                            </p>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Normal verification</span>
                          )}
                          {photos.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700">
                              <span>📷 {photos.length} Photo{photos.length > 1 ? 's' : ''} Attached</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setHistoryPropId(log.prop_id);
                            setHistoryPropTitle(log.prop_title);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          title="View Complete Health History for this Prop"
                        >
                          <span>Full History</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Property Audit History Modal */}
      {historyPropId && (
        <PropAuditHistoryView
          propId={historyPropId}
          propTitle={historyPropTitle}
          isOpen={Boolean(historyPropId)}
          onClose={() => setHistoryPropId(null)}
        />
      )}
    </div>
  );
}
