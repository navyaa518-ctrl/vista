'use client';

import React, { useState, useEffect } from 'react';
import { WarehouseFloor, WarehouseGodown, CreateFloorInput, UpdateFloorInput } from '@/types/warehouse';
import { X, Layers, Building2, Wind, Hash } from 'lucide-react';

interface FloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateFloorInput | UpdateFloorInput) => Promise<void>;
  godowns: WarehouseGodown[];
  targetGodownId?: string;
  initialData?: WarehouseFloor | null;
}

export function FloorModal({
  isOpen,
  onClose,
  onSubmit,
  godowns,
  targetGodownId,
  initialData,
}: FloorModalProps) {
  const [godownId, setGodownId] = useState(targetGodownId || godowns[0]?.id || '');
  const [floorNumber, setFloorNumber] = useState<number>(0);
  const [name, setName] = useState('');
  const [climateZone, setClimateZone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setGodownId(initialData.godown_id);
      setFloorNumber(initialData.floor_number);
      setName(initialData.name);
      setClimateZone(initialData.climate_zone || '');
    } else {
      setGodownId(targetGodownId || godowns[0]?.id || '');
      setFloorNumber(0);
      setName('');
      setClimateZone('Standard Dry Warehouse');
    }
    setError(null);
  }, [initialData, targetGodownId, godowns, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!godownId || !name.trim()) {
      setError('Please select a Godown and specify a Floor Name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && initialData) {
        await onSubmit({
          id: initialData.id,
          godown_id: godownId,
          floor_number: Number(floorNumber),
          name: name.trim(),
          climate_zone: climateZone.trim(),
        });
      } else {
        await onSubmit({
          godown_id: godownId,
          floor_number: Number(floorNumber),
          name: name.trim(),
          climate_zone: climateZone.trim(),
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
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200/60 text-sky-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Warehouse Floor Level' : 'Add Floor Level to Godown'}
              </h2>
              <p className="text-xs text-slate-500">
                Define vertical mezzanine or ground floor storage zone
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
              Parent Godown Facility *
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                disabled={isEditing}
                value={godownId}
                onChange={(e) => setGodownId(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50 shadow-2xs"
              >
                {godowns.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.code}] {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-slate-700 font-semibold block mb-1">
                Floor Index *
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={0}
                  max={10}
                  required
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(Number(e.target.value))}
                  placeholder="0 (Ground)"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">0 = Ground Floor</span>
            </div>

            <div className="col-span-2">
              <label className="text-slate-700 font-semibold block mb-1">
                Floor Name / Zone Description *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ground Floor - Heavy Armor & Sets"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Atmospheric &amp; Climate Spec
            </label>
            <div className="relative">
              <Wind className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={climateZone}
                onChange={(e) => setClimateZone(e.target.value)}
                placeholder="e.g. Dehumidified Teak Storage (23°C / 50% RH)"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
              />
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
              className="px-5 py-2 rounded-xl font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-2xs transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Floor' : 'Add Floor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
