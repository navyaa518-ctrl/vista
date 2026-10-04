'use client';

import React, { useState, useEffect } from 'react';
import {
  WarehouseRow,
  GodownWithChildren,
  CreateRowInput,
  UpdateRowInput,
} from '@/types/warehouse';
import { generateLocationCode } from '@/lib/services/warehouse';
import { X, QrCode, Hash, Tag, Box, Layers } from 'lucide-react';

interface RowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    input: CreateRowInput | UpdateRowInput,
    context?: { godownCode: string; floorNumber: number; rackCode: string }
  ) => Promise<void>;
  godowns: GodownWithChildren[];
  targetRackId?: string;
  initialData?: WarehouseRow | null;
}

export function RowModal({
  isOpen,
  onClose,
  onSubmit,
  godowns,
  targetRackId,
  initialData,
}: RowModalProps) {
  // Collect all racks with their path context
  const allRacks = godowns.flatMap((g) =>
    (g.floors || []).flatMap((f) =>
      (f.racks || []).map((r) => ({
        rackId: r.id,
        rackCode: r.rack_code,
        godownCode: g.code,
        floorNumber: f.floor_number,
        label: `[${g.code}] ➔ [F${f.floor_number}] ➔ [${r.rack_code}] ${r.name}`,
      }))
    )
  );

  const [rackId, setRackId] = useState(targetRackId || allRacks[0]?.rackId || '');
  const [rowCode, setRowCode] = useState('');
  const [name, setName] = useState('');
  const [maxItems, setMaxItems] = useState<number>(40);
  const [occupiedCount, setOccupiedCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  const currentRackContext = allRacks.find((r) => r.rackId === rackId);

  // Compute live location preview
  const liveLocationCode = currentRackContext
    ? generateLocationCode(
        currentRackContext.godownCode,
        currentRackContext.floorNumber,
        currentRackContext.rackCode,
        rowCode || 'S01'
      )
    : 'G1-F0-RA-S01';

  useEffect(() => {
    if (initialData) {
      setRackId(initialData.rack_id);
      setRowCode(initialData.row_code);
      setName(initialData.name);
      setMaxItems(initialData.max_items);
      setOccupiedCount(initialData.current_occupied_count || 0);
    } else {
      setRackId(targetRackId || allRacks[0]?.rackId || '');
      setRowCode('');
      setName('');
      setMaxItems(40);
      setOccupiedCount(0);
    }
    setError(null);
  }, [initialData, targetRackId, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rackId || !rowCode.trim() || !name.trim()) {
      setError('Please select a Rack, and specify Row/Shelf Code and Name.');
      return;
    }

    if (occupiedCount > maxItems) {
      setError('Occupied items count cannot exceed maximum row capacity.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const context = currentRackContext
        ? {
            godownCode: currentRackContext.godownCode,
            floorNumber: currentRackContext.floorNumber,
            rackCode: currentRackContext.rackCode,
          }
        : undefined;

      if (isEditing && initialData) {
        await onSubmit(
          {
            id: initialData.id,
            rack_id: rackId,
            row_code: rowCode.trim().toUpperCase(),
            name: name.trim(),
            max_items: Number(maxItems) || 40,
            current_occupied_count: Number(occupiedCount) || 0,
            location_code: liveLocationCode,
          },
          context
        );
      } else {
        await onSubmit(
          {
            rack_id: rackId,
            row_code: rowCode.trim().toUpperCase(),
            name: name.trim(),
            max_items: Number(maxItems) || 40,
            current_occupied_count: Number(occupiedCount) || 0,
            location_code: liveLocationCode,
          },
          context
        );
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Shelf / Pallet Slot' : 'Add New Shelf / Row'}
              </h2>
              <p className="text-xs text-slate-500">
                Maps directly to individual prop location QR barcodes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Parent Storage Rack *
            </label>
            <div className="relative">
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                disabled={isEditing}
                value={rackId}
                onChange={(e) => setRackId(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 shadow-2xs"
              >
                {allRacks.map((r) => (
                  <option key={r.rackId} value={r.rackId}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-slate-700 font-semibold block mb-1">
                Row/Shelf Code *
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={rowCode}
                  onChange={(e) => setRowCode(e.target.value.toUpperCase())}
                  placeholder="e.g. S01"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-slate-700 font-semibold block mb-1">
                Shelf Label / Description *
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shelf 01 - Heavy Base Units"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Max Prop Capacity *
              </label>
              <div className="relative">
                <Box className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  required
                  value={maxItems}
                  onChange={(e) => setMaxItems(Number(e.target.value))}
                  placeholder="40"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Current Occupied Props
              </label>
              <input
                type="number"
                min={0}
                max={maxItems}
                value={occupiedCount}
                onChange={(e) => setOccupiedCount(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>
          </div>

          {/* Generated QR / Location Code Badge */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-slate-900">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-Generated Location Code:</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono font-bold border border-amber-200">
                Barcode Mapping
              </span>
            </div>
            <div className="text-lg font-black font-mono tracking-widest text-slate-900">
              {liveLocationCode}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Formatted for 2D DataMatrix / QR scanning in the Field Executive App
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Row' : 'Add Shelf Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
