'use client';

import React, { useState, useEffect } from 'react';
import { WarehouseGodown, CreateGodownInput, UpdateGodownInput } from '@/types/warehouse';
import { X, Building2, MapPin, FileText, Maximize2, Hash } from 'lucide-react';

interface GodownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateGodownInput | UpdateGodownInput) => Promise<void>;
  initialData?: WarehouseGodown | null;
}

export function GodownModal({ isOpen, onClose, onSubmit, initialData }: GodownModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [areaSqft, setAreaSqft] = useState<number>(25000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setAddress(initialData.address || '');
      setNotes(initialData.notes || '');
      setAreaSqft(initialData.total_area_sqft || 25000);
    } else {
      setCode('');
      setName('');
      setAddress('Plot 42, Film City Logistics Corridor');
      setNotes('');
      setAreaSqft(25000);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Godown Code and Name are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && initialData) {
        await onSubmit({
          id: initialData.id,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          address: address.trim(),
          notes: notes.trim(),
          total_area_sqft: Number(areaSqft) || 25000,
        });
      } else {
        await onSubmit({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          address: address.trim(),
          notes: notes.trim(),
          total_area_sqft: Number(areaSqft) || 25000,
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Godown / Facility Block' : 'Add New Warehouse Godown'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure primary building perimeter and capacity metrics
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
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-slate-700 font-semibold block mb-1">
                Godown Code *
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. G1"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-slate-700 font-semibold block mb-1">
                Facility Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Godown 1 - Main Yard & Armory"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Floor Area (Square Feet)
            </label>
            <div className="relative">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                value={areaSqft}
                onChange={(e) => setAreaSqft(Number(e.target.value))}
                placeholder="28000"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Physical Location / Address
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot 42, Film City Logistics Corridor, Hyderabad"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">
              Operational Notes &amp; Logistics Specs
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 14m ceiling clearance, 20-ton overhead gantry hoist, vehicle loading ramp"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none shadow-2xs"
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
              className="px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Godown' : 'Create Godown'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
