'use client';

import React, { useState, useMemo } from 'react';
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
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';

interface WarehouseAccordionTableViewProps {
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

export function WarehouseAccordionTableView({
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
}: WarehouseAccordionTableViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    [godowns[0]?.id || '']: true,
  });

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (pct: number) => {
    if (pct >= 85)
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
          High Density ({pct}%)
        </span>
      );
    if (pct >= 60)
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
          Optimal ({pct}%)
        </span>
      );
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
        Available ({pct}%)
      </span>
    );
  };

  // Filter godowns by search term
  const filteredGodowns = useMemo(() => {
    if (!searchTerm.trim()) return godowns;
    const q = searchTerm.toLowerCase();

    return godowns.filter((g) => {
      const gMatch = g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q);
      const fMatch = (g.floors || []).some(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.racks || []).some(
            (r) =>
              r.name.toLowerCase().includes(q) ||
              r.rack_code.toLowerCase().includes(q) ||
              (r.rows || []).some(
                (row) =>
                  row.name.toLowerCase().includes(q) ||
                  row.location_code.toLowerCase().includes(q)
              )
          )
      );
      return gMatch || fMatch;
    });
  }, [godowns, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by code, shelf, or rack (e.g. G1, RA, S01)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredGodowns.length} Facilities
        </span>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-4">Level &amp; Code</th>
              <th className="py-3.5 px-4">Storage Zone / Name</th>
              <th className="py-3.5 px-4">Capacity Metric</th>
              <th className="py-3.5 px-4">Occupancy Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGodowns.map((g) => {
              const isGOpen = !!expandedRows[g.id];
              return (
                <React.Fragment key={g.id}>
                  {/* GODOWN ROW */}
                  <tr className="bg-slate-50/60 hover:bg-slate-100/80 transition-colors font-medium">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <button
                        onClick={() => toggleRow(g.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700"
                      >
                        {isGOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <span className="font-mono font-bold text-amber-700">[{g.code}]</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      {g.name}
                      <span className="text-[10px] text-slate-500 font-sans block font-normal mt-0.5">
                        {(g.floors || []).length} Floors • {g.total_racks} Racks • {g.total_area_sqft?.toLocaleString()} sq.ft
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {g.occupied_items} / {g.total_capacity} Props
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(g.utilization_pct)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onAddFloor(g.id)}
                          className="p-1 px-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-[10px] font-bold flex items-center gap-1 border border-amber-200"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Floor</span>
                        </button>
                        <button
                          onClick={() => onEditGodown(g)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Edit Godown"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteGodown(g)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                          title="Delete Godown"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* FLOORS OF THIS GODOWN */}
                  {isGOpen &&
                    (g.floors || []).map((f) => {
                      const isFOpen = !!expandedRows[f.id];
                      return (
                        <React.Fragment key={f.id}>
                          <tr className="bg-white hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4 pl-10 flex items-center gap-2">
                              <button
                                onClick={() => toggleRow(f.id)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700"
                              >
                                {isFOpen ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <Layers className="w-3.5 h-3.5 text-sky-600" />
                              <span className="font-mono text-sky-700 text-xs font-semibold">
                                [F{f.floor_number}]
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-800 font-medium">
                              {f.name}
                              <span className="text-[10px] text-slate-500 block">
                                {f.climate_zone}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-700">
                              {f.occupied_items} / {f.total_capacity} Props
                            </td>
                            <td className="py-2.5 px-4">{getStatusBadge(f.utilization_pct)}</td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => onAddRack(f.id)}
                                  className="p-1 px-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors text-[10px] font-semibold flex items-center gap-1 border border-sky-200"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Rack</span>
                                </button>
                                <button
                                  onClick={() => onEditFloor(f)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                  title="Edit Floor"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onDeleteFloor(f)}
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                                  title="Delete Floor"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* RACKS OF THIS FLOOR */}
                          {isFOpen &&
                            (f.racks || []).map((r) => {
                              const isROpen = !!expandedRows[r.id];
                              return (
                                <React.Fragment key={r.id}>
                                  <tr className="bg-slate-50/40 hover:bg-slate-100/50 transition-colors">
                                    <td className="py-2 px-4 pl-16 flex items-center gap-2">
                                      <button
                                        onClick={() => toggleRow(r.id)}
                                        className="p-1 rounded text-slate-400 hover:text-slate-700"
                                      >
                                        {isROpen ? (
                                          <ChevronDown className="w-3 h-3" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3" />
                                        )}
                                      </button>
                                      <Grid className="w-3 h-3 text-amber-600" />
                                      <span className="font-mono text-amber-700 text-xs font-semibold">
                                        [{r.rack_code}]
                                      </span>
                                    </td>
                                    <td className="py-2 px-4 text-slate-800 text-xs font-semibold">
                                      {r.name}
                                      <span className="text-[10px] text-slate-500 font-mono block font-normal">
                                        {r.dimensions}
                                      </span>
                                    </td>
                                    <td className="py-2 px-4 font-mono text-slate-700">
                                      {r.occupied_items} / {r.total_capacity} Props
                                    </td>
                                    <td className="py-2 px-4">{getStatusBadge(r.utilization_pct)}</td>
                                    <td className="py-2 px-4 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => onAddRow(r.id)}
                                          className="p-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-[10px] font-semibold flex items-center gap-1 border border-slate-200"
                                        >
                                          <Plus className="w-2.5 h-2.5" />
                                          <span>Shelf</span>
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
                                    </td>
                                  </tr>

                                  {/* SHELVES/ROWS OF THIS RACK */}
                                  {isROpen &&
                                    (r.rows || []).map((row) => {
                                      const rowPct =
                                        row.max_items > 0
                                          ? Math.round(
                                              ((row.current_occupied_count || 0) / row.max_items) *
                                                100
                                            )
                                          : 0;
                                      return (
                                        <tr
                                          key={row.id}
                                          className="bg-slate-50/70 hover:bg-slate-100 transition-colors text-[11px]"
                                        >
                                          <td className="py-1.5 px-4 pl-24 flex items-center gap-2">
                                            <QrCode className="w-3 h-3 text-slate-400" />
                                            <span className="font-mono text-slate-600 font-semibold">
                                              {row.location_code}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-4 text-slate-800">
                                            {row.name}
                                          </td>
                                          <td className="py-1.5 px-4 font-mono text-slate-600">
                                            {row.current_occupied_count} / {row.max_items} Props
                                          </td>
                                          <td className="py-1.5 px-4">{getStatusBadge(rowPct)}</td>
                                          <td className="py-1.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                              <button
                                                onClick={() => onEditRow(row)}
                                                className="p-1 rounded text-slate-400 hover:text-slate-700"
                                                title="Edit Shelf"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                              <button
                                                onClick={() => onDeleteRow(row)}
                                                className="p-1 rounded text-rose-500 hover:bg-rose-50"
                                                title="Delete Shelf"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </React.Fragment>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
