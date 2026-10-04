'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Prop, PropItem } from '@/types/database';
import { QRCodeModal } from '@/components/warehouse/QRCodeModal';
import { BulkQRPrintModal } from '@/components/warehouse/BulkQRPrintModal';
import { formatINR } from '@/lib/utils';
import {
  QrCode,
  Layers,
  Search,
  Printer,
  Building2,
  CheckSquare,
  Square,
  RefreshCw,
  MapPin,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface FullPropItem {
  item: PropItem;
  prop: Prop;
}

export default function InventoryPage() {
  const [itemsWithProps, setItemsWithProps] = useState<FullPropItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [singleQR, setSingleQR] = useState<{ item: PropItem; prop: Prop } | null>(null);
  const [showBulkPrint, setShowBulkPrint] = useState(false);

  // Selection
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [rackFilter, setRackFilter] = useState<string>('All');

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    try {
      // 1. Fetch props
      const { data: propsData, error: propsError } = await supabase.from('props').select('*');
      if (propsError) throw propsError;

      // 2. Fetch prop_items
      const { data: itemsData, error: itemsError } = await supabase
        .from('prop_items')
        .select('*')
        .order('serial_number', { ascending: true });
      if (itemsError) throw itemsError;

      const propMap = new Map<string, Prop>();
      (propsData as Prop[]).forEach((p) => propMap.set(p.id, p));

      const combined: FullPropItem[] = [];
      (itemsData as PropItem[]).forEach((item) => {
        const prop = propMap.get(item.prop_id);
        if (prop) {
          combined.push({ item, prop });
        }
      });

      setItemsWithProps(combined);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  // Get unique racks
  const uniqueRacks = useMemo(() => {
    const set = new Set<string>();
    itemsWithProps.forEach(({ item }) => set.add(item.rack));
    return Array.from(set).sort();
  }, [itemsWithProps]);

  // Filter items
  const filtered = useMemo(() => {
    return itemsWithProps.filter(({ item, prop }) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesSerial = item.serial_number.toLowerCase().includes(q);
        const matchesTitle = prop.title.toLowerCase().includes(q);
        const matchesRack = item.rack.toLowerCase().includes(q);
        if (!matchesSerial && !matchesTitle && !matchesRack) return false;
      }

      if (floorFilter !== 'All' && item.floor.toString() !== floorFilter) {
        return false;
      }

      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }

      if (rackFilter !== 'All' && item.rack !== rackFilter) {
        return false;
      }

      return true;
    });
  }, [itemsWithProps, search, floorFilter, statusFilter, rackFilter]);

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedItemIds.length === filtered.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filtered.map(({ item }) => item.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds((prev) => prev.filter((i) => i !== id));
    } else {
      setSelectedItemIds((prev) => [...prev, id]);
    }
  };

  const selectedForBulk = useMemo(() => {
    return itemsWithProps.filter(({ item }) => selectedItemIds.includes(item.id));
  }, [itemsWithProps, selectedItemIds]);

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-200 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#121520] via-[#0e1017] to-[#121520] border-b border-amber-500/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <QrCode className="w-4 h-4" />
              <span>Physical QR Asset Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
              Warehouse Inventory &amp; QR Labels
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Every physical prop is tagged with a unique serialized barcode (e.g. ASH-THR-001-A) mapped to Floor and Rack coordinates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedItemIds.length > 0 && (
              <button
                onClick={() => setShowBulkPrint(true)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print {selectedItemIds.length} QR Stickers</span>
              </button>
            )}

            <button
              onClick={fetchInventory}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* FILTERS BAR */}
        <div className="p-4 rounded-2xl bg-[#0e1017] border border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Serial, Prop, Rack..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Floor Filter */}
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Floors</option>
              <option value="1">Floor 1 (Heavy Sets)</option>
              <option value="2">Floor 2 (Precision &amp; Tech)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Statuses</option>
              <option value="available">Available in Warehouse</option>
              <option value="on_rent">Out on Shoot (Rented)</option>
              <option value="reserved">Reserved for Shoot</option>
              <option value="maintenance">Under Maintenance</option>
            </select>

            {/* Rack Filter */}
            <select
              value={rackFilter}
              onChange={(e) => setRackFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="All">All Racks</option>
              {uniqueRacks.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Select all toggle */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-semibold text-amber-300 hover:text-amber-200 py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-800"
          >
            {selectedItemIds.length === filtered.length && filtered.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-amber-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All Filtered ({filtered.length})</span>
          </button>
        </div>

        {/* INVENTORY TABLE / CARDS */}
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Querying physical serialized assets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0e1017] border border-slate-800 text-center space-y-2">
            <Tag className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No physical units match your filter</h3>
            <p className="text-xs text-slate-400">Try adjusting your search or floor selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(({ item, prop }) => {
              const isSelected = selectedItemIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400/60 shadow-lg shadow-amber-500/10'
                      : 'bg-[#0f1118] border-slate-800/90 hover:border-amber-500/30'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(item.id)}
                          className="text-slate-400 hover:text-amber-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                        <span className="font-mono font-bold text-sm text-white tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {item.serial_number}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'available'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : item.status === 'on_rent'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : item.status === 'reserved'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Prop Name */}
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 mt-1">
                      {prop.title}
                    </h4>

                    {/* Location & Condition */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[9px] text-slate-400 block uppercase">Location</span>
                        <span className="font-semibold text-amber-300">
                          FL {item.floor} • {item.rack}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[9px] text-slate-400 block uppercase">Condition</span>
                        <span className="font-semibold text-slate-300 capitalize">
                          {item.condition.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {item.notes && (
                      <p className="text-[10px] text-slate-400 mt-2 italic line-clamp-1">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Repl: {formatINR(prop.replacement_value)}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSingleQR({ item, prop })}
                      className="py-1 px-2.5 rounded-lg text-xs font-medium bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Tag &amp; QR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Single QR Modal */}
      {singleQR && (
        <QRCodeModal
          item={singleQR.item}
          prop={singleQR.prop}
          onClose={() => setSingleQR(null)}
        />
      )}

      {/* Bulk Print Modal */}
      {showBulkPrint && (
        <BulkQRPrintModal
          items={selectedForBulk}
          onClose={() => setShowBulkPrint(false)}
        />
      )}
    </div>
  );
}
