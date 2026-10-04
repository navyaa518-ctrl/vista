'use client';

import React, { useState } from 'react';
import { GodownWithChildren, BulkRackGeneratorInput } from '@/types/warehouse';
import { X, Sparkles, Wand2, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface BulkGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: BulkRackGeneratorInput) => Promise<number>;
  godowns: GodownWithChildren[];
  defaultGodownId?: string;
  defaultFloorId?: string;
}

export function BulkGeneratorModal({
  isOpen,
  onClose,
  onSubmit,
  godowns,
  defaultGodownId,
  defaultFloorId,
}: BulkGeneratorModalProps) {
  const [selectedGodownId, setSelectedGodownId] = useState<string>(
    defaultGodownId || godowns[0]?.id || ''
  );

  const selectedGodown = godowns.find((g) => g.id === selectedGodownId) || godowns[0];
  const availableFloors = selectedGodown?.floors || [];

  const [selectedFloorId, setSelectedFloorId] = useState<string>(
    defaultFloorId || availableFloors[0]?.id || ''
  );

  const [rackPrefix, setRackPrefix] = useState('R');
  const [rackStartNum, setRackStartNum] = useState<number>(1);
  const [rackCount, setRackCount] = useState<number>(5);
  const [rowsPerRack, setRowsPerRack] = useState<number>(4);
  const [itemsPerRow, setItemsPerRow] = useState<number>(40);
  const [dimensions, setDimensions] = useState('5m x 1.5m x 4m Heavy Duty Steel');
  const [namePattern, setNamePattern] = useState('Rack {code} - Staged Inventory');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // Selected floor context
  const selectedFloor = availableFloors.find((f) => f.id === selectedFloorId) || availableFloors[0];

  // Calculated totals
  const totalRacks = Number(rackCount) || 0;
  const totalRows = totalRacks * (Number(rowsPerRack) || 0);
  const totalAddedCapacity = totalRows * (Number(itemsPerRow) || 0);

  // Sample code preview
  const sampleStartRack = `${rackPrefix}${rackStartNum < 10 ? '0' + rackStartNum : rackStartNum}`;
  const sampleEndRack = `${rackPrefix}${
    rackStartNum + totalRacks - 1 < 10 ? '0' + (rackStartNum + totalRacks - 1) : rackStartNum + totalRacks - 1
  }`;
  const sampleStartLocation = `${selectedGodown?.code || 'G1'}-F${
    selectedFloor?.floor_number ?? 0
  }-${sampleStartRack}-S01`;
  const sampleEndLocation = `${selectedGodown?.code || 'G1'}-F${
    selectedFloor?.floor_number ?? 0
  }-${sampleEndRack}-S0${rowsPerRack}`;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedGodownId || !selectedFloorId) {
      setError('Please select a valid Godown and Floor.');
      return;
    }

    if (totalRacks <= 0 || totalRows <= 0) {
      setError('Please enter positive numbers for racks and rows.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessCount(null);

    try {
      const generated = await onSubmit({
        godown_id: selectedGodownId,
        floor_id: selectedFloorId,
        rack_prefix: rackPrefix.trim().toUpperCase() || 'R',
        rack_start_num: Number(rackStartNum) || 1,
        rack_count: Number(rackCount) || 5,
        rows_per_rack: Number(rowsPerRack) || 4,
        items_per_row: Number(itemsPerRow) || 40,
        rack_name_pattern: namePattern.trim(),
        dimensions: dimensions.trim(),
      });
      setSuccessCount(generated);
      setTimeout(() => {
        onClose();
        setSuccessCount(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Bulk generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Quick Bulk Rack &amp; Row Generator</span>
                <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                  Batch Action
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Instantly provision entire warehouse aisles, multi-bay racks, and shelf slots
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
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successCount !== null && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              Successfully created {successCount} Racks and {totalRows} Rows!
            </span>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4 text-xs">
          {/* Target Location Selectors */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Target Godown</label>
              <select
                value={selectedGodownId}
                onChange={(e) => {
                  setSelectedGodownId(e.target.value);
                  const targetG = godowns.find((g) => g.id === e.target.value);
                  if (targetG && targetG.floors.length > 0) {
                    setSelectedFloorId(targetG.floors[0].id);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                {godowns.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.code}] {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Target Floor Level</label>
              <select
                value={selectedFloorId}
                onChange={(e) => setSelectedFloorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                {availableFloors.map((f) => (
                  <option key={f.id} value={f.id}>
                    [F{f.floor_number}] {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Configuration Matrix */}
          <div className="grid grid-cols-4 gap-2.5">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Rack Prefix</label>
              <input
                type="text"
                required
                value={rackPrefix}
                onChange={(e) => setRackPrefix(e.target.value.toUpperCase())}
                placeholder="R"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Start Index</label>
              <input
                type="number"
                min={1}
                required
                value={rackStartNum}
                onChange={(e) => setRackStartNum(Number(e.target.value))}
                placeholder="1"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Rack Count</label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={rackCount}
                onChange={(e) => setRackCount(Number(e.target.value))}
                placeholder="5"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Rows / Rack</label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={rowsPerRack}
                onChange={(e) => setRowsPerRack(Number(e.target.value))}
                placeholder="4"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">
                Max Items per Row/Shelf
              </label>
              <input
                type="number"
                min={5}
                required
                value={itemsPerRow}
                onChange={(e) => setItemsPerRow(Number(e.target.value))}
                placeholder="40"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Rack Dimensions</label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="5m x 1.5m x 4m Steel"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Naming Template (use {'{code}'} for dynamic code)
            </label>
            <input
              type="text"
              value={namePattern}
              onChange={(e) => setNamePattern(e.target.value)}
              placeholder="Rack {code} - Heavy Steel Bay"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
            />
          </div>

          {/* Real-time Summary Card */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Batch Generation Summary</span>
              </span>
              <span className="font-mono text-emerald-700 font-bold">+{totalAddedCapacity.toLocaleString()} Units Capacity</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white border border-amber-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-medium">Racks Created</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{totalRacks}</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-amber-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-medium">Shelves / Rows</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{totalRows}</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-amber-200/60 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-medium">New Capacity</span>
                <span className="text-sm font-bold text-amber-800 font-mono">{totalAddedCapacity}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-700 border-t border-amber-200/60 pt-2 flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Generated Code Range:</span>
                <span className="font-mono text-slate-900 font-bold">
                  {sampleStartLocation} ➔ {sampleEndLocation}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
              className="px-6 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              <span>{loading ? 'Generating...' : `Batch Generate ${totalRacks} Racks`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
