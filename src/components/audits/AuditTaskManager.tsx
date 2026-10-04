'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Users,
  MapPin,
  Tag,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  X,
  Layers,
  ChevronRight,
  Shield,
  FolderTree,
  Sparkles,
} from 'lucide-react';
import {
  WarehouseAudit,
  AuditType,
  AuditTaskStatus,
  AuditFloorLevel,
  CreateWarehouseAuditInput,
} from '@/types/audits';
import { inspectionService } from '@/lib/services/inspectionService';
import { inventoryService } from '@/lib/services/inventory';
import { PropCategory } from '@/types/inventory';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

interface AuditTaskManagerProps {
  onSelectTaskForExecution?: (task: WarehouseAudit) => void;
  onSelectTask?: (taskId: string) => void;
  onOpenExecutionConsole?: () => void;
}

export function AuditTaskManager({
  onSelectTaskForExecution,
  onSelectTask,
  onOpenExecutionConsole,
}: AuditTaskManagerProps) {
  const { user, role } = useAuth();
  const [tasks, setTasks] = useState<WarehouseAudit[]>([]);
  const [categories, setCategories] = useState<PropCategory[]>([]);
  const [inspectors, setInspectors] = useState<
    { id: string; name: string; role: string; floor?: number; email?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | AuditTaskStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [auditType, setAuditType] = useState<'WEEKLY' | 'SPOT' | 'CYCLE'>('WEEKLY');
  const [floorLevel, setFloorLevel] = useState<AuditFloorLevel>('Floor 1');
  const [rackRange, setRackRange] = useState('Rack A-01 to A-08');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedAudits, fetchedCategories, fetchedInspectors] = await Promise.all([
        inspectionService.getWarehouseAudits({
          userId: user?.id,
          userRole: role,
        }),
        inventoryService.getCategories(),
        inspectionService.getActiveInspectors(),
      ]);
      setTasks(fetchedAudits);
      setCategories(fetchedCategories);
      setInspectors(fetchedInspectors);

      // Default select current user or first inspector
      if (fetchedInspectors.length > 0 && selectedAssigneeIds.length === 0) {
        const defaultUser = user?.id && fetchedInspectors.some((i) => i.id === user.id)
          ? user.id
          : fetchedInspectors[0].id;
        setSelectedAssigneeIds([defaultUser]);
      }
    } catch (e) {
      console.error('Failed to load audit tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, role]);

  const toggleAssignee = (id: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((item) => item !== id) : prev) : [...prev, id]
    );
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide an audit title.');
      return;
    }
    if (selectedAssigneeIds.length === 0) {
      alert('Please select at least one inspector.');
      return;
    }

    setCreating(true);
    try {
      await inspectionService.createWarehouseAudit({
        title: title.trim(),
        audit_type: auditType,
        floor_level: floorLevel,
        rack_range: rackRange.trim(),
        category_id: selectedCategoryId || undefined,
        assignee_ids: selectedAssigneeIds,
        scheduled_date: scheduledDate,
        notes: notes.trim(),
        created_by: user?.id,
      });

      setCreateModalOpen(false);
      // Reset form
      setTitle('');
      setNotes('');
      await loadData();
    } catch (err) {
      console.error('Failed to create audit:', err);
      alert('Failed to schedule audit.');
    } finally {
      setCreating(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter !== 'all' && t.status !== activeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const code = (t.audit_code || t.task_number || '').toLowerCase();
    const ttl = (t.title || '').toLowerCase();
    const assignees = (t.assignees || []).map((a) => a.user_name || '').join(' ').toLowerCase();
    const rack = (t.rack_range || t.zone_or_rack || '').toLowerCase();

    return code.includes(q) || ttl.includes(q) || assignees.includes(q) || rack.includes(q);
  });

  const getStatusBadge = (s: AuditTaskStatus) => {
    switch (s) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse';
      case 'SCHEDULED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getAuditTypeBadge = (t: AuditType) => {
    switch (t) {
      case 'WEEKLY':
      case 'Weekly Audit':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SPOT':
      case 'Spot Check':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CYCLE':
      case 'Monthly Routine':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-sky-600" />
            <span>Audit Task Board &amp; Inspector Delegation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based warehouse health audits with multi-assignee delegation, rack range scoping, and live tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
            <span>Schedule New Audit</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1">
          {(['all', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as const).map((filterVal) => {
            const count =
              filterVal === 'all'
                ? tasks.length
                : tasks.filter((t) => t.status === filterVal).length;

            return (
              <button
                key={filterVal}
                onClick={() => setActiveFilter(filterVal)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === filterVal
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{filterVal === 'all' ? 'All Audits' : filterVal.replace('_', ' ')}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeFilter === filterVal
                      ? 'bg-slate-800 text-amber-300'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code, title, inspector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold">Loading audit tasks from Supabase...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No audit tasks found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || activeFilter !== 'all'
              ? 'No inspection batches match your current filters.'
              : 'Schedule your first warehouse health audit to begin systematic inspections.'}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            Schedule New Audit Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const totalItems = task.total_items_count ?? 5;
            const auditedItems = task.audited_items_count ?? 0;
            const pct = totalItems > 0 ? Math.round((auditedItems / totalItems) * 100) : 0;
            const assignees = task.assignees && task.assignees.length > 0 ? task.assignees : [];

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Code + Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {task.audit_code || task.task_number || 'AUD'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getAuditTypeBadge(
                          task.audit_type
                        )}`}
                      >
                        {task.audit_type}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(
                        task.status
                      )}`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title & Scope */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {task.floor_level} {task.rack_range ? `• ${task.rack_range}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-500">Props Verified</span>
                      <span className="font-mono font-bold text-slate-900">
                        {auditedItems} / {totalItems} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-sky-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Assigned Inspectors (Multi-Assignee display) */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>Assigned Inspectors ({assignees.length || 1})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {assignees.length > 0 ? (
                        assignees.map((asg) => (
                          <span
                            key={asg.id || asg.user_id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            <span>{asg.user_name}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-600 font-medium">
                          {task.assigned_to_name || 'Ravi Kumar'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Date & Execute Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{task.scheduled_date || task.due_date}</span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectTaskForExecution?.(task);
                      onSelectTask?.(task.id);
                      onOpenExecutionConsole?.();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors cursor-pointer"
                  >
                    <span>{task.status === 'COMPLETED' ? 'Review Audit' : 'Execute Audit'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Audit Modal (Multi-Assignee, Floors, Rack Range) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Schedule Warehouse Health Audit</h3>
                  <p className="text-[11px] text-slate-500">Multi-inspector delegation &amp; physical rack scoping</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Batch Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Routine: Period & Royal Furniture Bay"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              {/* Audit Type & Scheduled Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Audit Type</label>
                  <select
                    value={auditType}
                    onChange={(e) => setAuditType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
                  >
                    <option value="WEEKLY">Weekly Audit (Full Inspection)</option>
                    <option value="SPOT">Spot Check (High Priority)</option>
                    <option value="CYCLE">Cycle Count (Floor Specific)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
                  >
                  </input>
                </div>
              </div>

              {/* Floor Level & Rack Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Warehouse Floor</label>
                  <select
                    value={floorLevel}
                    onChange={(e) => setFloorLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Floor 1">Floor 1 (Heavy &amp; Furniture)</option>
                    <option value="Floor 2">Floor 2 (Tech, Optics, Curios)</option>
                    <option value="Floor 3">Floor 3 (Yard &amp; Vehicles)</option>
                    <option value="All Floors">All Warehouse Floors</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rack Range Filter</label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-01 to A-08, or B1-B10"
                    value={rackRange}
                    onChange={(e) => setRackRange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Prop Category (Optional Scope)
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-Inspector Assignment */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Assign Multiple Inspectors *</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {selectedAssigneeIds.length} selected
                  </span>
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1.5">
                  {inspectors.map((ins) => {
                    const isChecked = selectedAssigneeIds.includes(ins.id);
                    return (
                      <label
                        key={ins.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-sky-50 border border-sky-200 text-sky-900 font-bold' : 'hover:bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAssignee(ins.id)}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span>{ins.name}</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/80 border border-slate-200 text-slate-500">
                          {ins.role}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Instructions / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions (e.g. Inspect wood polish, structural joints, velvet backrests)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Scheduling...' : 'Confirm & Schedule Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
