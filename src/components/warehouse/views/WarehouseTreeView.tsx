'use client';

import React, { useState } from 'react';
import {
  GodownWithChildren,
  FloorWithChildren,
  RackWithChildren,
  WarehouseRow,
} from '@/types/warehouse';
import {
  Building2,
  Layers,
  Grid,
  QrCode,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Box,
  Percent,
} from 'lucide-react';

interface WarehouseTreeViewProps {
  godowns: GodownWithChildren[];
  onAddFloor: (godownId: string) => void;
  onAddRack: (floorId: string) => void;
  onAddRow: (rackId: string) => void;
  onEditGodown: (godown: GodownWithChildren) => void;
  onEditFloor: (floor: FloorWithChildren) => void;
  onEditRack: (rack: RackWithChildren) => void;
  onEditRow: (row: WarehouseRow) => void;
  onDeleteGodown: (godown: GodownWithChildren) => void;
  onDeleteFloor: (floor: FloorWithChildren) => void;
  onDeleteRack: (rack: RackWithChildren) => void;
  onDeleteRow: (row: WarehouseRow) => void;
}

export function WarehouseTreeView({
  godowns,
  onAddFloor,
  onAddRack,
  onAddRow,
  onEditGodown,
  onEditFloor,
  onEditRack,
  onEditRow,
  onDeleteGodown,
  onDeleteFloor,
  onDeleteRack,
  onDeleteRow,
}: WarehouseTreeViewProps) {
  // State for expanded nodes
  const [expandedGodowns, setExpandedGodowns] = useState<Record<string, boolean>>({
    [godowns[0]?.id || '']: true,
  });
  const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({
    [godowns[0]?.floors[0]?.id || '']: true,
  });
  const [expandedRacks, setExpandedRacks] = useState<Record<string, boolean>>({
    [godowns[0]?.floors[0]?.racks[0]?.id || '']: true,
  });

  const toggleGodown = (id: string) => {
    setExpandedGodowns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFloor = (id: string) => {
    setExpandedFloors((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRack = (id: string) => {
    setExpandedRacks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allG: Record<string, boolean> = {};
    const allF: Record<string, boolean> = {};
    const allR: Record<string, boolean> = {};
    godowns.forEach((g) => {
      allG[g.id] = true;
      (g.floors || []).forEach((f) => {
        allF[f.id] = true;
        (f.racks || []).forEach((r) => {
          allR[r.id] = true;
        });
      });
    });
    setExpandedGodowns(allG);
    setExpandedFloors(allF);
    setExpandedRacks(allR);
  };

  const collapseAll = () => {
    setExpandedGodowns({});
    setExpandedFloors({});
    setExpandedRacks({});
  };

  const getUtilizationColor = (pct: number) => {
    if (pct >= 85) return 'text-rose-700 bg-rose-50 border-rose-200';
    if (pct >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="space-y-4">
      {/* Tree Controls Toolbar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 text-xs">
        <span className="text-slate-500 font-medium">
          Multi-Tier Warehouse Storage Hierarchy Tree
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs font-medium"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs font-medium"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Hierarchical Tree Container */}
      <div className="space-y-3">
        {godowns.map((g) => {
          const isGExpanded = !!expandedGodowns[g.id];
          return (
            <div
              key={g.id}
              className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm"
            >
              {/* LEVEL 1: GODOWN HEADER */}
              <div className="p-4 bg-slate-50/70 flex items-center justify-between gap-3 border-b border-slate-200/80">
                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggleGodown(g.id)}>
                  <button
                    type="button"
                    className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 shadow-2xs"
                  >
                    {isGExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600">
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-700 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                        {g.code}
                      </span>
                      <h3 className="font-semibold text-sm text-slate-900 tracking-tight">{g.name}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      <span>{g.total_area_sqft?.toLocaleString()} sq.ft</span>
                      <span>•</span>
                      <span>{(g.floors || []).length} Floors</span>
                      <span>•</span>
                      <span>{g.total_racks} Racks</span>
                    </div>
                  </div>
                </div>

                {/* Right Metrics & Actions */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${getUtilizationColor(
                        g.utilization_pct
                      )}`}
                    >
                      {g.utilization_pct}% Filled ({g.occupied_items}/{g.total_capacity})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onAddFloor(g.id)}
                      title="Add Floor to this Godown"
                      className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all flex items-center gap-1 text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Add Floor</span>
                    </button>
                    <button
                      onClick={() => onEditGodown(g)}
                      title="Edit Godown"
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGodown(g)}
                      title="Delete Godown"
                      className="p-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* LEVEL 2: FLOORS CONTAINER */}
              {isGExpanded && (
                <div className="divide-y divide-slate-100">
                  {(!g.floors || g.floors.length === 0) ? (
                    <div className="p-4 text-xs text-slate-400 text-center italic">
                      No floor levels added yet. Click &quot;Add Floor&quot; above.
                    </div>
                  ) : (
                    g.floors.map((f) => {
                      const isFExpanded = !!expandedFloors[f.id];
                      return (
                        <div key={f.id} className="bg-white">
                          <div className="p-3.5 pl-8 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors border-b border-slate-100">
                            <div
                              className="flex items-center gap-2.5 cursor-pointer select-none"
                              onClick={() => toggleFloor(f.id)}
                            >
                              <button
                                type="button"
                                className="p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800"
                              >
                                {isFExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200/60 text-sky-600">
                                <Layers className="w-4 h-4" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-sky-700 px-1.5 py-0.2 rounded bg-sky-50 border border-sky-200">
                                    F{f.floor_number}
                                  </span>
                                  <h4 className="font-semibold text-xs text-slate-900">{f.name}</h4>
                                </div>
                                <span className="text-[10px] text-slate-500 font-sans block">
                                  {f.climate_zone} • {(f.racks || []).length} Racks
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${getUtilizationColor(
                                  f.utilization_pct
                                )}`}
                              >
                                {f.utilization_pct}% ({f.occupied_items}/{f.total_capacity})
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onAddRack(f.id)}
                                  className="p-1.5 px-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors text-[10px] font-semibold flex items-center gap-1 border border-sky-200"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Rack</span>
                                </button>
                                <button
                                  onClick={() => onEditFloor(f)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                  title="Edit Floor"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onDeleteFloor(f)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                                  title="Delete Floor"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* LEVEL 3: RACKS CONTAINER */}
                          {isFExpanded && (
                            <div className="bg-slate-50/30 divide-y divide-slate-100">
                              {(!f.racks || f.racks.length === 0) ? (
                                <div className="p-3 pl-16 text-xs text-slate-400 italic">
                                  No racks in this floor yet. Click &quot;Add Rack&quot;.
                                </div>
                              ) : (
                                f.racks.map((r) => {
                                  const isRExpanded = !!expandedRacks[r.id];
                                  return (
                                    <div key={r.id}>
                                      <div className="p-3 pl-14 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors">
                                        <div
                                          className="flex items-center gap-2.5 cursor-pointer select-none"
                                          onClick={() => toggleRack(r.id)}
                                        >
                                          <button
                                            type="button"
                                            className="p-1 rounded text-slate-400 hover:text-slate-700"
                                          >
                                            {isRExpanded ? (
                                              <ChevronDown className="w-3 h-3" />
                                            ) : (
                                              <ChevronRight className="w-3 h-3" />
                                            )}
                                          </button>

                                          <div className="p-1 rounded bg-amber-50 border border-amber-200 text-amber-700">
                                            <Grid className="w-3.5 h-3.5" />
                                          </div>

                                          <div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-mono text-xs font-bold text-amber-700">
                                                [{r.rack_code}]
                                              </span>
                                              <span className="font-semibold text-xs text-slate-900">
                                                {r.name}
                                              </span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-mono block">
                                              {(r.rows || []).length} Shelves • {r.dimensions}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getUtilizationColor(
                                              r.utilization_pct
                                            )}`}
                                          >
                                            {r.utilization_pct}% ({r.occupied_items}/{r.total_capacity})
                                          </span>

                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => onAddRow(r.id)}
                                              className="p-1 px-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors text-[10px] font-semibold flex items-center gap-1 shadow-2xs"
                                            >
                                              <Plus className="w-2.5 h-2.5" />
                                              <span>Add Shelf</span>
                                            </button>
                                            <button
                                              onClick={() => onEditRack(r)}
                                              className="p-1 rounded text-slate-400 hover:text-slate-700"
                                              title="Edit Rack"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => onDeleteRack(r)}
                                              className="p-1 rounded text-rose-500 hover:bg-rose-50"
                                              title="Delete Rack"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* LEVEL 4: ROWS / SHELVES OF THIS RACK */}
                                      {isRExpanded && (
                                        <div className="p-3 pl-20 bg-slate-50/70 border-t border-b border-slate-100">
                                          {(!r.rows || r.rows.length === 0) ? (
                                            <div className="text-xs text-slate-400 italic py-1">
                                              No shelves configured yet.
                                            </div>
                                          ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                              {r.rows.map((row) => {
                                                const rowPct =
                                                  row.max_items > 0
                                                    ? Math.round(
                                                        ((row.current_occupied_count || 0) /
                                                          row.max_items) *
                                                          100
                                                      )
                                                    : 0;
                                                return (
                                                  <div
                                                    key={row.id}
                                                    className="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2 text-xs"
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <div className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-600">
                                                        <QrCode className="w-3.5 h-3.5" />
                                                      </div>
                                                      <div>
                                                        <span className="font-mono text-xs font-bold text-slate-800 block">
                                                          {row.location_code}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 block">
                                                          {row.name}
                                                        </span>
                                                      </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                      <span
                                                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${getUtilizationColor(
                                                          rowPct
                                                        )}`}
                                                      >
                                                        {row.current_occupied_count}/{row.max_items}
                                                      </span>

                                                      <button
                                                        onClick={() => onEditRow(row)}
                                                        className="p-1 text-slate-400 hover:text-slate-700"
                                                        title="Edit Shelf"
                                                      >
                                                        <Edit2 className="w-3 h-3" />
                                                      </button>
                                                      <button
                                                        onClick={() => onDeleteRow(row)}
                                                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                                        title="Delete Shelf"
                                                      >
                                                        <Trash2 className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
