'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PropSerializedItem, ItemCondition, ItemStatus } from '@/types/inventory';
import { inventoryService } from '@/lib/services/inventory';
import { QRStickerCard } from './QRStickerCard';
import {
  X,
  QrCode,
  Calendar,
  DollarSign,
  Film,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Tag,
} from 'lucide-react';

interface SerializedItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: PropSerializedItem | null;
  onUpdateStatus: (itemId: string, status: ItemStatus, condition: ItemCondition) => Promise<void>;
}

export function SerializedItemDrawer({
  isOpen,
  onClose,
  item,
  onUpdateStatus,
}: SerializedItemDrawerProps) {
  if (!isOpen || !item) return null;

  const [currentStatus, setCurrentStatus] = useState<ItemStatus>(item.status);
  const [currentCondition, setCurrentCondition] = useState<ItemCondition>(item.condition);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'label'>('analytics');

  const prop = item.prop;
  const replacementCost = prop?.replacement_value || 2000;
  const lifetimeRevenue = item.lifetime_earnings || 0;
  const roiMultiplier = (lifetimeRevenue / replacementCost).toFixed(1);
  const history = inventoryService.getRentalHistory(item);

  const handleSaveStatus = async () => {
    setUpdating(true);
    try {
      await onUpdateStatus(item.id, currentStatus, currentCondition);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm animate-fade-in flex justify-end">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl z-10 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-slate-800 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                {item.item_code}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  item.status === 'Available'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : item.status === 'Dispatched / On Rent'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {item.status}
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 line-clamp-1 mt-1">
              {prop?.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-100 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Asset Analytics &amp; Timeline
          </button>
          <button
            onClick={() => setActiveTab('label')}
            className={`py-2 px-3.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'label'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            QR Label Sticker Card
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 space-y-5 flex-1">
          {activeTab === 'label' ? (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <QRStickerCard item={item} showActions={true} size="standard" onPrint={() => window.print()} />
            </div>
          ) : (
            <>
              {/* Prop Overview Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex gap-4 items-start">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0">
                  {prop?.images && prop.images[0] ? (
                    <Image
                      src={prop.images[0]}
                      alt={prop.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Tag className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-mono text-[11px]">
                      MODEL: {prop?.model_number || 'N/A'}
                    </span>
                    <span className="font-bold text-amber-700 font-mono text-xs">
                      ₹{prop?.calculated_rent_price?.toLocaleString('en-IN')}/day
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] line-clamp-2">
                    {prop?.description || 'Authentic movie prop item'}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-amber-600 font-mono pt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-bold">{prop?.warehouse_code || 'G1-F0-RA-S01'}</span>
                  </div>
                </div>
              </div>

              {/* Profitability & Lifecycle Metrics */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Unit Lifetime Profitability &amp; Yield:
                </span>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Times Rented</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">{item.rental_count}</span>
                    <span className="text-[9px] text-slate-500 block">Productions</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">Revenue Accrued</span>
                    <span className="text-lg font-bold text-emerald-700 font-mono">
                      ₹{lifetimeRevenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-slate-500 block">Total Earnings</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase">ROI Multiplier</span>
                    <span className="text-lg font-bold text-amber-700 font-mono">{roiMultiplier}x</span>
                    <span className="text-[9px] text-slate-500 block">vs Replacement</span>
                  </div>
                </div>
              </div>

              {/* Quick Status & Condition Updater */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                  Update Physical Status &amp; Condition:
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Rental Status</label>
                    <select
                      value={currentStatus}
                      onChange={(e) => setCurrentStatus(e.target.value as ItemStatus)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Available">Available</option>
                      <option value="In Cart">In Cart</option>
                      <option value="Dispatched / On Rent">Dispatched / On Rent</option>
                      <option value="Damaged">Damaged</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Physical Condition</label>
                    <select
                      value={currentCondition}
                      onChange={(e) => setCurrentCondition(e.target.value as ItemCondition)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="Good">Good</option>
                      <option value="Minor Wear">Minor Wear</option>
                      <option value="Maintenance Required">Maintenance Required</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveStatus}
                    disabled={updating}
                    className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </div>

              {/* Rental History Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-600" />
                    <span>Production Rental History Timeline ({history.length}):</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Verified Logs</span>
                </div>

                {history.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs">
                    This unit has not been rented out yet. It is freshly cataloged and available for checkout.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((h, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-900">{h.production_name}</span>
                            <span className="text-[11px] text-slate-500 block">{h.client_name}</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-700 text-[11px]">
                            +₹{h.revenue_amount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {h.checkout_date} ➔ {h.return_date}
                          </span>
                          <span>•</span>
                          <span>{h.days_rented} Days Rented</span>
                        </div>

                        <p className="text-[10px] text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                          &ldquo;{h.inspector_notes}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
