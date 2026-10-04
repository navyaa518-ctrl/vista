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
  ArrowRight,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Box,
  MapPin,
  Wind,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';

interface WarehouseGridViewProps {
  godowns: GodownWithChildren[];
  onAddGodown: () => void;
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

export function WarehouseGridView({
  godowns,
  onAddGodown,
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
}: WarehouseGridViewProps) {
  // Navigation drill-down state
  const [activeGodownId, setActiveGodownId] = useState<string | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [activeRackId, setActiveRackId] = useState<string | null>(null);

  const currentGodown = godowns.find((g) => g.id === activeGodownId);
  const currentFloor = currentGodown?.floors.find((f) => f.id === activeFloorId);
  const currentRack = currentFloor?.racks.find((r) => r.id === activeRackId);

  const getCapacityColor = (pct: number) => {
    if (pct >= 85) return 'from-rose-500 to-rose-600 text-rose-600 bg-rose-50 border-rose-200';
    if (pct >= 60) return 'from-amber-500 to-amber-600 text-amber-700 bg-amber-50 border-amber-200';
    return 'from-emerald-500 to-emerald-600 text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveGodownId(null);
              setActiveFloorId(null);
              setActiveRackId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
              !activeGodownId
                ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>All Godowns ({godowns.length})</span>
          </button>

          {currentGodown && (
            <>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => {
                  setActiveFloorId(null);
                  setActiveRackId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                  activeGodownId && !activeFloorId
                    ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  [{currentGodown.code}] {currentGodown.name}
                </span>
              </button>
            </>
          )}

          {currentFloor && (
            <>
              <span className="text-slate-300">/</span>
              <button
                onClick={() => setActiveRackId(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors ${
                  activeFloorId && !activeRackId
                    ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>
                  [F{currentFloor.floor_number}] {currentFloor.name}
                </span>
              </button>
            </>
          )}

          {currentRack && (
            <>
              <span className="text-slate-300">/</span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200 shadow-2xs">
                <QrCode className="w-3.5 h-3.5" />
                <span>
                  [{currentRack.rack_code}] {currentRack.name}
                </span>
              </span>
            </>
          )}
        </div>

        {/* Back navigation button */}
        {(activeGodownId || activeFloorId || activeRackId) && (
          <button
            onClick={() => {
              if (activeRackId) setActiveRackId(null);
              else if (activeFloorId) setActiveFloorId(null);
              else if (activeGodownId) setActiveGodownId(null);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Up One Level</span>
          </button>
        )}
      </div>

      {/* VIEW LEVEL 1: ALL GODOWNS GRID */}
      {!activeGodownId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {godowns.map((g) => (
            <div
              key={g.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400/50 hover:shadow-md transition-all shadow-2xs space-y-4 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 group-hover:scale-105 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-700 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                          {g.code}
                        </span>
                        <h3 className="font-semibold text-base text-slate-900 tracking-tight">{g.name}</h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{g.address || 'Plot 42 Logistics Hub'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditGodown(g)}
                      title="Edit Godown"
                      className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteGodown(g)}
                      title="Delete Godown"
                      className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Capacity Meter */}
                <div className="mt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-500">Total Storage Density:</span>
                    <span className="font-bold text-slate-900">
                      {g.utilization_pct}% ({g.occupied_items}/{g.total_capacity} Units)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getCapacityColor(g.utilization_pct)}`}
                      style={{ width: `${Math.min(g.utilization_pct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-xs text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Area</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {g.total_area_sqft?.toLocaleString()} sq.ft
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Floors</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {(g.floors || []).length} Levels
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Active Racks</span>
                    <span className="font-mono font-bold text-amber-700 text-xs">{g.total_racks}</span>
                  </div>
                </div>

                {g.notes && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-3 line-clamp-2">
                    {g.notes}
                  </p>
                )}
              </div>

              {/* Action Button: Drill down to Floors */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onAddFloor(g.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Floor</span>
                </button>

                <button
                  onClick={() => setActiveGodownId(g.id)}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <span>Explore Floors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW LEVEL 2: FLOORS IN SELECTED GODOWN */}
      {activeGodownId && !activeFloorId && currentGodown && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Floors in {currentGodown.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono font-semibold">
                  {currentGodown.code}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Select a floor level to inspect physical storage racks and bays
              </p>
            </div>

            <button
              onClick={() => onAddFloor(currentGodown.id)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Floor Level</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(currentGodown.floors || []).map((f) => (
              <div
                key={f.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-400/50 hover:shadow-md transition-all shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-sky-50 border border-sky-200/60 text-sky-600">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-700 px-2 py-0.5 rounded bg-sky-50 border border-sky-200">
                            F{f.floor_number}
                          </span>
                          <h3 className="font-semibold text-base text-slate-900 tracking-tight">{f.name}</h3>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Wind className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{f.climate_zone || 'Standard Dry Storage'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditFloor(f)}
                        title="Edit Floor"
                        className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteFloor(f)}
                        title="Delete Floor"
                        className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Floor Capacity Meter */}
                  <div className="mt-4 space-y-1.5 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-500">Floor Rack Occupancy:</span>
                      <span className="font-bold text-slate-900">
                        {f.utilization_pct}% ({f.occupied_items}/{f.total_capacity} Props)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getCapacityColor(f.utilization_pct)}`}
                        style={{ width: `${Math.min(f.utilization_pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Rack Count</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {(f.racks || []).length} Racks
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Occupied Props</span>
                      <span className="font-mono font-bold text-sky-700 text-xs">
                        {f.occupied_items} Props
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onAddRack(f.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rack</span>
                  </button>

                  <button
                    onClick={() => setActiveFloorId(f.id)}
                    className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all"
                  >
                    <span>View Racks Grid</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW LEVEL 3: RACKS IN SELECTED FLOOR */}
      {activeFloorId && !activeRackId && currentFloor && currentGodown && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Racks in [F{currentFloor.floor_number}] {currentFloor.name}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Select a rack bay to inspect individual shelves and mapped QR codes
              </p>
            </div>

            <button
              onClick={() => onAddRack(currentFloor.id)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Storage Rack</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(currentFloor.racks || []).map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400/50 hover:shadow-md transition-all shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600">
                        <Grid className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-amber-700 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                            {r.rack_code}
                          </span>
                          <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">
                            {r.name}
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          {r.dimensions || '5m x 1.5m x 4m'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditRack(r)}
                        className="p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Edit Rack"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDeleteRack(r)}
                        className="p-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Delete Rack"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Rack Utilization */}
                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-500">Occupancy:</span>
                      <span className="font-bold text-slate-900">
                        {r.utilization_pct}% ({r.occupied_items}/{r.total_capacity})
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getCapacityColor(r.utilization_pct)}`}
                        style={{ width: `${Math.min(r.utilization_pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center text-xs">
                    <span className="text-slate-500 text-[10px] block font-medium">Rows / Shelves:</span>
                    <span className="font-mono font-bold text-slate-900">{(r.rows || []).length} Shelves Configured</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onAddRow(r.id)}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-[11px] flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Shelf</span>
                  </button>

                  <button
                    onClick={() => setActiveRackId(r.id)}
                    className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                  >
                    <span>View Shelves</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW LEVEL 4: ROWS/SHELVES IN SELECTED RACK */}
      {activeRackId && currentRack && currentFloor && currentGodown && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Shelves in [{currentRack.rack_code}] {currentRack.name}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Individual shelf slots with barcode location mapping
              </p>
            </div>

            <button
              onClick={() => onAddRow(currentRack.id)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shelf Slot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(!currentRack.rows || currentRack.rows.length === 0) ? (
              <div className="col-span-full p-8 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-slate-500 text-xs">
                No shelves configured in this rack yet. Click &quot;Add Shelf Slot&quot; to begin.
              </div>
            ) : (
              currentRack.rows.map((row) => {
                const occupancyPct =
                  row.max_items > 0
                    ? Math.round(((row.current_occupied_count || 0) / row.max_items) * 100)
                    : 0;
                const isFull = occupancyPct >= 85;
                const isAvailable = occupancyPct < 60;

                return (
                  <div
                    key={row.id}
                    className={`p-4 rounded-2xl border transition-all shadow-2xs space-y-3 ${
                      isFull
                        ? 'bg-amber-50/70 border-amber-200/90 text-amber-900'
                        : isAvailable
                        ? 'bg-slate-50/80 border-slate-200 text-slate-800'
                        : 'bg-white border-slate-200/90 text-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl border ${
                          isFull
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}>
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                          <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                            isFull
                              ? 'bg-amber-200/80 text-amber-900'
                              : 'bg-slate-200/80 text-slate-700'
                          }`}>
                            {row.location_code}
                          </span>
                          <h4 className="font-semibold text-xs text-slate-900 line-clamp-1 mt-1">{row.name}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditRow(row)}
                          className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
                          title="Edit Shelf"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteRow(row)}
                          className="p-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100"
                          title="Delete Shelf"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Shelf Progress */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Occupancy:</span>
                        <span className="font-bold text-slate-900">
                          {row.current_occupied_count} / {row.max_items} Props ({occupancyPct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200/60 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getCapacityColor(occupancyPct)}`}
                          style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
