'use client';

import React, { useState, useEffect } from 'react';
import { PropCategory, CreatePropStockInput, ItemCondition } from '@/types/inventory';
import { GodownWithChildren } from '@/types/warehouse';
import { warehouseService } from '@/lib/services/warehouse';
import {
  X,
  PackagePlus,
  Layers,
  Building2,
  DollarSign,
  Tag,
  Wand2,
  CheckCircle2,
  Image as ImageIcon,
  AlertCircle,
  Hash,
  Sparkles,
} from 'lucide-react';

interface AddPropStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: PropCategory[];
  onSubmit: (input: CreatePropStockInput) => Promise<{ prop: any; itemsCount: number }>;
}

export function AddPropStockModal({
  isOpen,
  onClose,
  categories,
  onSubmit,
}: AddPropStockModalProps) {
  const [name, setName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [brand, setBrand] = useState('ASHWA Props');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [description, setDescription] = useState('');
  const [replacementValue, setReplacementValue] = useState<number>(2000);
  const [rentalRatePercent, setRentalRatePercent] = useState<number>(20);
  const [imageUrl, setImageUrl] = useState('');
  const [quantity, setQuantity] = useState<number>(25);
  const [condition, setCondition] = useState<ItemCondition>('Brand New');
  const [notes, setNotes] = useState('');

  // Warehouse Cascading Hierarchy State
  const [godowns, setGodowns] = useState<GodownWithChildren[]>([]);
  const [selectedGodownId, setSelectedGodownId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedRackId, setSelectedRackId] = useState('');
  const [selectedRowId, setSelectedRowId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ count: number; name: string } | null>(null);

  // Load warehouse hierarchy for cascading selector
  useEffect(() => {
    async function loadWarehouse() {
      try {
        const { godowns } = await warehouseService.getWarehouseHierarchy();
        setGodowns(godowns);
        if (godowns.length > 0) {
          const g = godowns[0];
          setSelectedGodownId(g.id);
          if (g.floors.length > 0) {
            const f = g.floors[0];
            setSelectedFloorId(f.id);
            if (f.racks.length > 0) {
              const r = f.racks[0];
              setSelectedRackId(r.id);
              if (r.rows.length > 0) {
                setSelectedRowId(r.rows[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.error('Warehouse load error:', err);
      }
    }
    if (isOpen) {
      loadWarehouse();
      if (categories.length > 0 && !categoryId) {
        setCategoryId(categories[0].id);
      }
    }
  }, [isOpen, categories, categoryId]);

  // Handle Cascading Selectors
  const activeGodown = godowns.find((g) => g.id === selectedGodownId) || godowns[0];
  const availableFloors = activeGodown?.floors || [];
  const activeFloor = availableFloors.find((f) => f.id === selectedFloorId) || availableFloors[0];
  const availableRacks = activeFloor?.racks || [];
  const activeRack = availableRacks.find((r) => r.id === selectedRackId) || availableRacks[0];
  const availableRows = activeRack?.rows || [];
  const activeRow = availableRows.find((row) => row.id === selectedRowId) || availableRows[0];

  if (!isOpen) return null;

  // Auto calculated daily rent price
  const calculatedRentPrice = Math.round(
    (Number(replacementValue) || 0) * ((Number(rentalRatePercent) || 20) / 100)
  );

  // Derive preview code range
  const targetCategory = categories.find((c) => c.id === categoryId);
  const catPrefix = targetCategory ? targetCategory.slug.substring(0, 4).toUpperCase() : 'PROP';
  const nameTokens = name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean);
  const propPrefix = (
    modelNumber?.replace(/[^A-Za-z0-9]/g, '').substring(0, 3) ||
    (nameTokens[0] ? nameTokens[0].substring(0, 3) : 'ITM')
  ).toUpperCase();

  const sampleStartCode = `ASH-${catPrefix}-${propPrefix}-0001`;
  const sampleEndCode = `ASH-${catPrefix}-${propPrefix}-${String(quantity).padStart(4, '0')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) {
      setError('Item name and category are required.');
      return;
    }

    if (quantity < 1) {
      setError('Quantity must be at least 1 unit.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const res = await onSubmit({
        name: name.trim(),
        model_number: modelNumber.trim() || 'N/A',
        brand: brand.trim() || 'ASHWA Props',
        category_id: categoryId,
        description: description.trim(),
        replacement_value: Number(replacementValue) || 2000,
        rental_rate_percent: Number(rentalRatePercent) || 20,
        images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
        godown_id: selectedGodownId,
        floor_id: selectedFloorId,
        rack_id: selectedRackId,
        row_id: selectedRowId,
        quantity: Number(quantity) || 1,
        initial_condition: condition,
        notes: notes.trim(),
      });

      setSuccessInfo({ count: res.itemsCount, name: name.trim() });
      setTimeout(() => {
        onClose();
        setSuccessInfo(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to add prop stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-6 my-auto space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Add Prop &amp; Serialized Stock</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  Bulk Provisioning
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register master catalog SKU and auto-generate physical item tracking barcodes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successInfo && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              Successfully created <strong>{successInfo.count} serialized units</strong> for {successInfo.name}!
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Category & Name */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Prop Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-slate-700 font-semibold block mb-1">Prop Title / Item Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Logitech Wireless Silent Mouse M331"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Row 2: Brand, Model, & Photo */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Brand / Manufacturer</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Logitech"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Model / Part Number</label>
              <input
                type="text"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                placeholder="e.g. M331-SILENT"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Photo Image URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://.../photo.jpg"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Row 3: Valuation & 20% Rental Pricing */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Replacement Value (₹) *</label>
              <input
                type="number"
                min={100}
                required
                value={replacementValue}
                onChange={(e) => setReplacementValue(Number(e.target.value))}
                placeholder="2000"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Rental Rate % *</label>
              <input
                type="number"
                min={5}
                max={100}
                required
                value={rentalRatePercent}
                onChange={(e) => setRentalRatePercent(Number(e.target.value))}
                placeholder="20"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Daily Rent Price</label>
              <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold font-mono text-sm">
                ₹{calculatedRentPrice.toLocaleString('en-IN')} / Day
              </div>
            </div>
          </div>

          {/* Row 4: Cascading Warehouse Placement Selector */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
              Warehouse Placement Coordinates (Select 4-Tier Slot):
            </span>

            <div className="grid grid-cols-4 gap-2">
              {/* Godown */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">1. Godown</label>
                <select
                  value={selectedGodownId}
                  onChange={(e) => {
                    setSelectedGodownId(e.target.value);
                    const targetG = godowns.find((g) => g.id === e.target.value);
                    if (targetG && targetG.floors.length > 0) {
                      setSelectedFloorId(targetG.floors[0].id);
                      if (targetG.floors[0].racks.length > 0) {
                        setSelectedRackId(targetG.floors[0].racks[0].id);
                        if (targetG.floors[0].racks[0].rows.length > 0) {
                          setSelectedRowId(targetG.floors[0].racks[0].rows[0].id);
                        }
                      }
                    }
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-[11px] focus:outline-none focus:border-amber-500"
                >
                  {godowns.map((g) => (
                    <option key={g.id} value={g.id}>
                      [{g.code}] {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Floor */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">2. Floor</label>
                <select
                  value={selectedFloorId}
                  onChange={(e) => {
                    setSelectedFloorId(e.target.value);
                    const targetF = availableFloors.find((f) => f.id === e.target.value);
                    if (targetF && targetF.racks.length > 0) {
                      setSelectedRackId(targetF.racks[0].id);
                      if (targetF.racks[0].rows.length > 0) {
                        setSelectedRowId(targetF.racks[0].rows[0].id);
                      }
                    }
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-[11px] focus:outline-none focus:border-amber-500"
                >
                  {availableFloors.map((f) => (
                    <option key={f.id} value={f.id}>
                      [F{f.floor_number}] {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rack */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">3. Rack</label>
                <select
                  value={selectedRackId}
                  onChange={(e) => {
                    setSelectedRackId(e.target.value);
                    const targetR = availableRacks.find((r) => r.id === e.target.value);
                    if (targetR && targetR.rows.length > 0) {
                      setSelectedRowId(targetR.rows[0].id);
                    }
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-[11px] focus:outline-none focus:border-amber-500"
                >
                  {availableRacks.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.rack_code}] {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shelf */}
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">4. Shelf Slot</label>
                <select
                  value={selectedRowId}
                  onChange={(e) => setSelectedRowId(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-[11px] focus:outline-none focus:border-amber-500"
                >
                  {availableRows.map((row) => (
                    <option key={row.id} value={row.id}>
                      [{row.row_code}] {row.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeRow && (
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-600 border-t border-slate-200">
                <span>Mapped Barcode Location:</span>
                <span className="font-bold text-amber-700">{activeRow.location_code}</span>
              </div>
            )}
          </div>

          {/* Row 5: Bulk Quantity & Serialization Preview */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <Wand2 className="w-4 h-4 text-amber-600" />
                <span>Bulk Quantity Serialization Generator:</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                {quantity > 1 ? `Batch of ${quantity} physical items` : 'Single physical unit'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Quantity of Physical Units to Provision *
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="e.g. 100"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Initial Physical Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ItemCondition)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="Brand New">Brand New</option>
                  <option value="Good">Good</option>
                  <option value="Minor Wear">Minor Wear</option>
                  <option value="Maintenance Required">Maintenance Required</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-600">Sequential Barcode Range:</span>
              <span className="font-bold text-amber-700">
                {quantity > 1 ? `${sampleStartCode} ➔ ${sampleEndCode}` : sampleStartCode}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <PackagePlus className="w-4 h-4" />
              <span>{loading ? 'Creating...' : `Provision & Generate ${quantity} Serialized Props`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
