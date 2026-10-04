'use client';

import React, { useState, useEffect } from 'react';
import { inventoryService } from '@/lib/services/inventory';
import { PropSerializedItem } from '@/types/inventory';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Printer, Check, Search, Filter, RefreshCw, Layers } from 'lucide-react';
import { BulkQRSheetModal } from '@/components/inventory/BulkQRSheetModal';

export default function BillingBulkQRPage() {
  const [items, setItems] = useState<PropSerializedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set<string>());
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    async function loadProps() {
      setLoading(true);
      try {
        const data = await inventoryService.getSerializedItems();
        setItems(data);
        // Default select first 12 items for instant preview
        setSelectedIds(new Set<string>(data.slice(0, 12).map((item) => item.id)));
      } finally {
        setLoading(false);
      }
    }
    loadProps();
  }, []);

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.item_code?.toLowerCase().includes(q) ||
      item.prop?.name?.toLowerCase().includes(q) ||
      item.qr_data?.toLowerCase().includes(q)
    );
  });

  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  const toggleSelect = (id: string) => {
    const next = new Set<string>(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set<string>());
    } else {
      setSelectedIds(new Set<string>(filteredItems.map((item) => item.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-5 h-5 text-sky-600" />
            <span>Bulk QR Tag Printing Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select serialized warehouse property assets to generate high-resolution A4 sticker labels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setPrintModalOpen(true)}
            disabled={selectedItems.length === 0}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print {selectedItems.length} Stickers (A4)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU code, prop name or serial..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {selectedIds.size === filteredItems.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Grid of Selectable Assets */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading serialized prop assets...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex flex-col items-center text-center ${
                  isSelected
                    ? 'bg-sky-50/60 border-sky-400 ring-2 ring-sky-400/20 shadow-xs'
                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="w-full flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-mono font-bold text-slate-500 truncate max-w-[80px]">
                    {item.item_code}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      isSelected ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl border border-slate-200/70 shadow-2xs my-1">
                  <QRCodeSVG value={item.item_code || item.id} size={64} />
                </div>

                <h4 className="text-[11px] font-bold text-slate-900 truncate w-full mt-1">
                  {item.prop?.name || item.item_code || 'Prop Asset'}
                </h4>
                <span className="text-[10px] text-slate-400">
                  Fl {item.floor || 1} • {item.rack || 'R-01'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Sheet for Printing */}
      <BulkQRSheetModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        items={selectedItems}
      />
    </div>
  );
}
