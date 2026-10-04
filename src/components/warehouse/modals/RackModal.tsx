'use client';

import React, { useState, useEffect } from 'react';
import {
  WarehouseRack,
  GodownWithChildren,
  CreateRackInput,
  UpdateRackInput,
} from '@/types/warehouse';
import { X, Grid, Hash, Maximize, Layers } from 'lucide-react';

interface RackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateRackInput | UpdateRackInput) => Promise<void>;
  godowns: GodownWithChildren[];
  targetFloorId?: string;
  initialData?: WarehouseRack | null;
}

export function RackModal({
  isOpen,
  onClose,
  onSubmit,
  godowns,
  targetFloorId,
  initialData,
}: RackModalProps) {
  // Find all floors across godowns for dropdown selection
  const allFloors = godowns.flatMap((g) =>
    (g.floors || []).map((f) => ({
      floorId: f.id,
      label: `[${g.code}] ${g.name} ➔ [F${f.floor_number}] ${f.name}`,
    }))
  );

  const [floorId, setFloorId] = useState(targetFloorId || allFloors[0]?.floorId || '');
  const [rackCode, setRackCode] = useState('');
  const [name, setName] = useState('');
  const [maxCapacity, setMaxCapacity] = useState<number>(100);
  const [dimensions, setDimensions] = useState('5m x 1.5m x 4m Heavy Duty');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFloorId(initialData.floor_id);
      setRackCode(initialData.rack_code);
      setName(initialData.name);
      setMaxCapacity(initialData.max_capacity);
      setDimensions(initialData.dimensions || '5m x 1.5m x 4m Heavy Duty');
    } else {
      setFloorId(targetFloorId || allFloors[0]?.floorId || '');
      setRackCode('');
      setName('');
      setMaxCapacity(100);
      setDimensions('5m x 1.5m x 4m Heavy Duty Steel');
    }
    setError(null);
  }, [initialData, targetFloorId, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!floorId || !rackCode.trim() || !name.trim()) {
      setError('Please select a Floor, and specify Rack Code and Name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && initialData) {
        await onSubmit({
          id: initialData.id,
          floor_id: floorId,
          rack_code: rackCode.trim().toUpperCase(),
          name: name.trim(),
          max_capacity: Number(maxCapacity) || 100,
          dimensions: dimensions.trim(),
        });
      } else {
        await onSubmit({
          floor_id: floorId,
          rack_code: rackCode.trim().toUpperCase(),
          name: name.trim(),
          max_capacity: Number(maxCapacity) || 100,
          dimensions: dimensions.trim(),
        });
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
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Warehouse Rack' : 'Add New Storage Rack'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure physical rack bays and weight ratings
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
              Target Godown &amp; Floor *
            </label>
            <div className="relative">
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                disabled={isEditing}
                value={floorId}
                onChange={(e) => setFloorId(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 shadow-2xs"
              >
                {allFloors.map((f) => (
                  <option key={f.floorId} value={f.floorId}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-slate-700 font-semibold block mb-1">
                Rack Code *
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={rackCode}
                  onChange={(e) => setRackCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RA"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-slate-700 font-semibold block mb-1">
                Rack Label / Description *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rack A - Period Thrones"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Max Capacity (Units) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                placeholder="100"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Rack Dimensions / Steel Gauge
              </label>
              <div className="relative">
                <Maximize className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  placeholder="5m x 1.5m x 4m"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                />
              </div>
            </div>
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
              {loading ? 'Saving...' : isEditing ? 'Update Rack' : 'Add Rack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
