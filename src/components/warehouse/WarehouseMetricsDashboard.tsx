'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GodownWithChildren,
  FloorWithChildren,
  RackWithChildren,
  WarehouseRow,
  WarehouseCapacitySummary,
  HierarchyViewMode,
  CreateGodownInput,
  UpdateGodownInput,
  CreateFloorInput,
  UpdateFloorInput,
  CreateRackInput,
  UpdateRackInput,
  CreateRowInput,
  UpdateRowInput,
  BulkRackGeneratorInput,
} from '@/types/warehouse';
import { warehouseService } from '@/lib/services/warehouse';
import { WarehouseTreeView } from './views/WarehouseTreeView';
import { WarehouseGridView } from './views/WarehouseGridView';
import { WarehouseAccordionTableView } from './views/WarehouseAccordionTableView';
import { GodownModal } from './modals/GodownModal';
import { FloorModal } from './modals/FloorModal';
import { RackModal } from './modals/RackModal';
import { RowModal } from './modals/RowModal';
import { BulkGeneratorModal } from './modals/BulkGeneratorModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import {
  Building2,
  Layers,
  Grid,
  Box,
  Wand2,
  Plus,
  RefreshCw,
  FolderTree,
  LayoutGrid,
  Table,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export function WarehouseMetricsDashboard() {
  const [godowns, setGodowns] = useState<GodownWithChildren[]>([]);
  const [summary, setSummary] = useState<WarehouseCapacitySummary>({
    total_godowns: 0,
    total_floors: 0,
    total_racks: 0,
    total_rows: 0,
    total_capacity: 0,
    total_occupied: 0,
    overall_utilization_pct: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<HierarchyViewMode>('tree');

  // Modal States
  const [godownModalOpen, setGodownModalOpen] = useState(false);
  const [editingGodown, setEditingGodown] = useState<GodownWithChildren | null>(null);

  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [targetGodownIdForFloor, setTargetGodownIdForFloor] = useState<string | undefined>(undefined);
  const [editingFloor, setEditingFloor] = useState<FloorWithChildren | null>(null);

  const [rackModalOpen, setRackModalOpen] = useState(false);
  const [targetFloorIdForRack, setTargetFloorIdForRack] = useState<string | undefined>(undefined);
  const [editingRack, setEditingRack] = useState<RackWithChildren | null>(null);

  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [targetRackIdForRow, setTargetRackIdForRow] = useState<string | undefined>(undefined);
  const [editingRow, setEditingRow] = useState<WarehouseRow | null>(null);

  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Delete Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{
    title: string;
    itemType: 'Godown' | 'Floor' | 'Rack' | 'Row / Shelf';
    childSummary?: string;
    action: () => Promise<void>;
  }>({
    title: '',
    itemType: 'Godown',
    action: async () => {},
  });

  // Load hierarchy
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await warehouseService.getWarehouseHierarchy();
      setGodowns(data.godowns);
      setSummary(data.summary);
    } catch (e) {
      console.error('Failed to load warehouse data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for Godown
  const handleOpenAddGodown = () => {
    setEditingGodown(null);
    setGodownModalOpen(true);
  };

  const handleEditGodown = (g: GodownWithChildren) => {
    setEditingGodown(g);
    setGodownModalOpen(true);
  };

  const handleSubmitGodown = async (input: CreateGodownInput | UpdateGodownInput) => {
    if ('id' in input && input.id) {
      await warehouseService.updateGodown(input as UpdateGodownInput);
    } else {
      await warehouseService.createGodown(input as CreateGodownInput);
    }
    await loadData();
  };

  const handleDeleteGodown = (g: GodownWithChildren) => {
    setDeleteConfig({
      title: `${g.name} (${g.code})`,
      itemType: 'Godown',
      childSummary: `Deleting this Godown will permanently remove ${(g.floors || []).length} Floors, ${g.total_racks} Racks, and ${g.total_capacity} item capacity.`,
      action: async () => {
        await warehouseService.deleteGodown(g.id);
        await loadData();
      },
    });
    setDeleteModalOpen(true);
  };

  // Handlers for Floor
  const handleOpenAddFloor = (godownId?: string) => {
    setEditingFloor(null);
    setTargetGodownIdForFloor(godownId || godowns[0]?.id);
    setFloorModalOpen(true);
  };

  const handleEditFloor = (f: FloorWithChildren) => {
    setEditingFloor(f);
    setTargetGodownIdForFloor(f.godown_id);
    setFloorModalOpen(true);
  };

  const handleSubmitFloor = async (input: CreateFloorInput | UpdateFloorInput) => {
    if ('id' in input && input.id) {
      await warehouseService.updateFloor(input as UpdateFloorInput);
    } else {
      await warehouseService.createFloor(input as CreateFloorInput);
    }
    await loadData();
  };

  const handleDeleteFloor = (f: FloorWithChildren) => {
    setDeleteConfig({
      title: `${f.name} [F${f.floor_number}]`,
      itemType: 'Floor',
      childSummary: `Will permanently delete ${(f.racks || []).length} Racks and all shelf allocations on this floor.`,
      action: async () => {
        await warehouseService.deleteFloor(f.id);
        await loadData();
      },
    });
    setDeleteModalOpen(true);
  };

  // Handlers for Rack
  const handleOpenAddRack = (floorId?: string) => {
    setEditingRack(null);
    setTargetFloorIdForRack(floorId || godowns[0]?.floors[0]?.id);
    setRackModalOpen(true);
  };

  const handleEditRack = (r: RackWithChildren) => {
    setEditingRack(r);
    setTargetFloorIdForRack(r.floor_id);
    setRackModalOpen(true);
  };

  const handleSubmitRack = async (input: CreateRackInput | UpdateRackInput) => {
    if ('id' in input && input.id) {
      await warehouseService.updateRack(input as UpdateRackInput);
    } else {
      await warehouseService.createRack(input as CreateRackInput);
    }
    await loadData();
  };

  const handleDeleteRack = (r: RackWithChildren) => {
    setDeleteConfig({
      title: `${r.name} (${r.rack_code})`,
      itemType: 'Rack',
      childSummary: `Contains ${(r.rows || []).length} active shelf slots and ${r.occupied_items} stored props.`,
      action: async () => {
        await warehouseService.deleteRack(r.id);
        await loadData();
      },
    });
    setDeleteModalOpen(true);
  };

  // Handlers for Row
  const handleOpenAddRow = (rackId?: string) => {
    setEditingRow(null);
    setTargetRackIdForRow(rackId || godowns[0]?.floors[0]?.racks[0]?.id);
    setRowModalOpen(true);
  };

  const handleEditRow = (row: WarehouseRow) => {
    setEditingRow(row);
    setTargetRackIdForRow(row.rack_id);
    setRowModalOpen(true);
  };

  const handleSubmitRow = async (
    input: CreateRowInput | UpdateRowInput,
    context?: { godownCode: string; floorNumber: number; rackCode: string }
  ) => {
    if ('id' in input && input.id) {
      await warehouseService.updateRow(input as UpdateRowInput);
    } else {
      await warehouseService.createRow(input as CreateRowInput, context);
    }
    await loadData();
  };

  const handleDeleteRow = (row: WarehouseRow) => {
    setDeleteConfig({
      title: `${row.name} (${row.location_code})`,
      itemType: 'Row / Shelf',
      childSummary: `Current occupancy: ${row.current_occupied_count} props placed on this shelf.`,
      action: async () => {
        await warehouseService.deleteRow(row.id);
        await loadData();
      },
    });
    setDeleteModalOpen(true);
  };

  // Bulk Generator
  const handleBulkGenerate = async (input: BulkRackGeneratorInput) => {
    const created = await warehouseService.bulkCreateRacks(input);
    await loadData();
    return created;
  };

  // Reset to default
  const handleResetDefaults = async () => {
    if (confirm('Reset warehouse space hierarchy to official Hyderabad 2-Godown facility default?')) {
      warehouseService.resetToDefaults();
      await loadData();
    }
  };

  const getCapacityColor = (pct: number) => {
    if (pct >= 85) return 'from-rose-500 to-rose-600 text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (pct >= 60) return 'from-amber-500 to-amber-600 text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'from-emerald-500 to-emerald-600 text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="space-y-6">
      {/* 1. MODULE TITLE & TOP ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Warehouse Space &amp; Capacity Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
              Live Topology
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic 4-tier spatial hierarchy: Godowns (Blocks) ➔ Floors ➔ Storage Racks ➔ Shelf Slots &amp; QR Codes
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleResetDefaults}
            title="Reset to facility blueprint"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setBulkModalOpen(true)}
            className="px-4 py-2 rounded-xl font-semibold text-xs bg-white border border-slate-200 hover:border-slate-300 text-slate-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-sky-600" />
            <span>Quick Bulk Generator</span>
          </button>

          <button
            onClick={handleOpenAddGodown}
            className="px-4 py-2 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Godown</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Godowns */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Godowns</span>
            <Building2 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{summary.total_godowns}</div>
          <p className="text-[11px] text-slate-400">
            {godowns.reduce((acc, g) => acc + (g.total_area_sqft || 0), 0).toLocaleString()} sq.ft covered space
          </p>
        </div>

        {/* Card 2: Floors */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Floors</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{summary.total_floors}</div>
          <p className="text-[11px] text-slate-400">Mezzanines &amp; ground sectors</p>
        </div>

        {/* Card 3: Racks & Rows */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Racks / Shelves</span>
            <Grid className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {summary.total_racks} <span className="text-sm font-normal text-slate-400">/ {summary.total_rows}</span>
          </div>
          <p className="text-[11px] text-slate-400">Barcode-mapped storage bays</p>
        </div>

        {/* Card 4: Overall Capacity */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Occupancy Density</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {summary.overall_utilization_pct}%
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              ({summary.total_occupied}/{summary.total_capacity})
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getCapacityColor(summary.overall_utilization_pct)}`}
              style={{ width: `${Math.min(summary.overall_utilization_pct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. LIVE GODOWN CAPACITY DISTRIBUTION BARS */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Facility Space Utilization Progress
            </span>
            <span className="text-[10px] text-slate-400 font-mono">• Live Telemetry</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt;60% Normal
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 60-85% Optimal
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> &gt;85% Warning
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {godowns.map((g) => (
            <div key={g.id} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">
                  [{g.code}] {g.name}
                </span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                    g.utilization_pct >= 85
                      ? 'text-rose-700 bg-rose-50 border-rose-200'
                      : g.utilization_pct >= 60
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}
                >
                  {g.utilization_pct}% Filled
                </span>
              </div>

              <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getCapacityColor(g.utilization_pct)} transition-all duration-500`}
                  style={{ width: `${Math.min(g.utilization_pct, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>{g.occupied_items} Props Stored</span>
                <span>Max Capacity: {g.total_capacity} Slots</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. VIEW MODE SWITCHER */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'tree'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Interactive Tree View</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Drill-Down Kanban Grid</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Nested Accordion Table</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>Hierarchy:</span>
          <span className="font-mono text-sky-600 font-bold">Godown ➔ Floor ➔ Rack ➔ Shelf</span>
        </div>
      </div>

      {/* 5. ACTIVE VIEW CONTAINER */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading warehouse hierarchy &amp; spatial layout...
        </div>
      ) : viewMode === 'tree' ? (
        <WarehouseTreeView
          godowns={godowns}
          onAddFloor={handleOpenAddFloor}
          onAddRack={handleOpenAddRack}
          onAddRow={handleOpenAddRow}
          onEditGodown={handleEditGodown}
          onEditFloor={handleEditFloor}
          onEditRack={handleEditRack}
          onEditRow={handleEditRow}
          onDeleteGodown={handleDeleteGodown}
          onDeleteFloor={handleDeleteFloor}
          onDeleteRack={handleDeleteRack}
          onDeleteRow={handleDeleteRow}
        />
      ) : viewMode === 'grid' ? (
        <WarehouseGridView
          godowns={godowns}
          onAddGodown={handleOpenAddGodown}
          onAddFloor={handleOpenAddFloor}
          onAddRack={handleOpenAddRack}
          onAddRow={handleOpenAddRow}
          onEditGodown={handleEditGodown}
          onEditFloor={handleEditFloor}
          onEditRack={handleEditRack}
          onEditRow={handleEditRow}
          onDeleteGodown={handleDeleteGodown}
          onDeleteFloor={handleDeleteFloor}
          onDeleteRack={handleDeleteRack}
          onDeleteRow={handleDeleteRow}
        />
      ) : (
        <WarehouseAccordionTableView
          godowns={godowns}
          onAddFloor={handleOpenAddFloor}
          onAddRack={handleOpenAddRack}
          onAddRow={handleOpenAddRow}
          onEditGodown={handleEditGodown}
          onEditFloor={handleEditFloor}
          onEditRack={handleEditRack}
          onEditRow={handleEditRow}
          onDeleteGodown={handleDeleteGodown}
          onDeleteFloor={handleDeleteFloor}
          onDeleteRack={handleDeleteRack}
          onDeleteRow={handleDeleteRow}
        />
      )}

      {/* 6. MODALS */}
      <GodownModal
        isOpen={godownModalOpen}
        onClose={() => setGodownModalOpen(false)}
        onSubmit={handleSubmitGodown}
        initialData={editingGodown}
      />

      <FloorModal
        isOpen={floorModalOpen}
        onClose={() => setFloorModalOpen(false)}
        onSubmit={handleSubmitFloor}
        godowns={godowns}
        targetGodownId={targetGodownIdForFloor}
        initialData={editingFloor}
      />

      <RackModal
        isOpen={rackModalOpen}
        onClose={() => setRackModalOpen(false)}
        onSubmit={handleSubmitRack}
        godowns={godowns}
        targetFloorId={targetFloorIdForRack}
        initialData={editingRack}
      />

      <RowModal
        isOpen={rowModalOpen}
        onClose={() => setRowModalOpen(false)}
        onSubmit={handleSubmitRow}
        godowns={godowns}
        targetRackId={targetRackIdForRow}
        initialData={editingRow}
      />

      <BulkGeneratorModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSubmit={handleBulkGenerate}
        godowns={godowns}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={deleteConfig.action}
        title={deleteConfig.title}
        itemType={deleteConfig.itemType}
        childSummary={deleteConfig.childSummary}
      />
    </div>
  );
}
