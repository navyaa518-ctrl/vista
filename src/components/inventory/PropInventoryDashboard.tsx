'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  PropCategory,
  PropSKU,
  PropSerializedItem,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreatePropStockInput,
  ItemStatus,
  ItemCondition,
} from '@/types/inventory';
import { inventoryService, formatHumanLocation } from '@/lib/services/inventory';
import { QRStickerCard } from './QRStickerCard';
import { BulkQRSheetModal } from './BulkQRSheetModal';
import { CategoryManagementModal } from './CategoryManagementModal';
import { AddPropStockModal } from './AddPropStockModal';
import { SerializedItemDrawer } from './SerializedItemDrawer';
import { PropertyDetailsModal } from './PropertyDetailsModal';
import { PropAuditHistoryView } from '@/components/audits/PropAuditHistoryView';
import {
  Search,
  Filter,
  Plus,
  Layers,
  Printer,
  QrCode,
  CheckSquare,
  Square,
  Package,
  Eye,
  RefreshCw,
  TrendingUp,
  MapPin,
  Tag,
  Boxes,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  ClipboardCheck,
} from 'lucide-react';

export function PropInventoryDashboard() {
  const [categories, setCategories] = useState<PropCategory[]>([]);
  const [props, setProps] = useState<PropSKU[]>([]);
  const [items, setItems] = useState<PropSerializedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [displayMode, setDisplayMode] = useState<'serialized' | 'skus'>('serialized');

  // Selected items for bulk label printing
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Modals & Drawer States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [bulkSheetModalOpen, setBulkSheetModalOpen] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<PropSerializedItem | null>(null);
  const [inspectDrawerOpen, setInspectDrawerOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Single QR card modal
  const [singleQRItem, setSingleQRItem] = useState<PropSerializedItem | null>(null);

  // Health & Inspection Audit history modal
  const [auditProp, setAuditProp] = useState<{ id: string; name: string; sku?: string } | null>(null);

  // Load inventory
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, propList, itemList] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getPropsWithSerializedItems(),
        inventoryService.getSerializedItems(),
      ]);
      setCategories(cats);
      setProps(propList);
      setItems(itemList);
    } catch (e) {
      console.error('Inventory load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleCatalogUpdate = () => {
      loadData();
    };

    window.addEventListener('props-catalog-updated', handleCatalogUpdate);
    window.addEventListener('storage', handleCatalogUpdate);
    return () => {
      window.removeEventListener('props-catalog-updated', handleCatalogUpdate);
      window.removeEventListener('storage', handleCatalogUpdate);
    };
  }, [loadData]);

  // Filtered Serialized Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const codeMatch = item.item_code.toLowerCase().includes(q);
        const nameMatch = item.prop?.name.toLowerCase().includes(q) || false;
        const modelMatch = item.prop?.model_number?.toLowerCase().includes(q) || false;
        const brandMatch = item.prop?.brand?.toLowerCase().includes(q) || false;
        const locMatch =
          item.warehouse_code?.toLowerCase().includes(q) ||
          item.storage_location?.toLowerCase().includes(q) ||
          item.warehouse_location_name?.toLowerCase().includes(q) ||
          item.prop?.warehouse_code?.toLowerCase().includes(q) ||
          item.prop?.warehouse_location_name?.toLowerCase().includes(q) ||
          false;
        if (!codeMatch && !nameMatch && !modelMatch && !brandMatch && !locMatch) return false;
      }
      if (selectedCategoryId !== 'All' && item.prop?.category_id !== selectedCategoryId) return false;
      if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
      if (selectedCondition !== 'All') {
        const itemCond = item.physical_condition || item.condition;
        if (itemCond !== selectedCondition && !itemCond?.toLowerCase().includes(selectedCondition.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [items, search, selectedCategoryId, selectedStatus, selectedCondition]);

  // Batch Select Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map((i) => i.id));
    }
  };

  const selectedForBulk = useMemo(() => {
    return items.filter((i) => selectedItemIds.includes(i.id));
  }, [items, selectedItemIds]);

  // Modals Actions
  const handleCreateProp = async (input: CreatePropStockInput) => {
    const res = await inventoryService.createPropWithSerializedItems(input);
    await loadData();
    return res;
  };

  const handleUpdateItemStatus = async (
    itemId: string,
    status: ItemStatus,
    condition: ItemCondition
  ) => {
    await inventoryService.updateSerializedItemStatus(itemId, status, condition);
    await loadData();
    if (inspectingItem && inspectingItem.id === itemId) {
      setInspectingItem({ ...inspectingItem, status, condition });
    }
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Dispatched / On Rent':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'In Cart':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Damaged':
      case 'Lost':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getConditionBadge = (condition?: string) => {
    const c = (condition || '').toUpperCase();
    if (c.includes('EXCELLENT') || c.includes('PRISTINE') || c.includes('BRAND NEW')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (c === 'GOOD' || c.includes('GOOD') || c.includes('NORMAL WEAR')) {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    if (c.includes('MINOR_DAMAGE') || c.includes('MINOR WEAR') || c.includes('DISTRESSED')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (c.includes('DAMAGED') || c.includes('NEEDS REPAIR') || c.includes('MAINTENANCE')) {
      return 'bg-red-50 text-red-700 border-red-300 font-bold';
    }
    if (c.includes('CRITICAL') || c.includes('SCRAP')) {
      return 'bg-red-100 text-red-900 border-red-400 font-bold';
    }
    if (c.includes('MISSING') || c.includes('MISPLACED') || c.includes('LOST')) {
      return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Top Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Serialized Inventory &amp; Asset Barcodes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 font-mono">
              {items.length} Units Tracked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Master SKU catalog with individual serialized physical barcodes, slot coordinates, and QR sticker generator
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => {
              if (selectedItemIds.length === 0) {
                // If none selected, default to all filtered items
                setSelectedItemIds(filteredItems.map((i) => i.id));
              }
              setBulkSheetModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Bulk Print QR Sheet {selectedItemIds.length > 0 ? `(${selectedItemIds.length})` : ''}</span>
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 rounded-xl font-semibold text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prop &amp; Stock</span>
          </button>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Master Prop SKUs</span>
            <Boxes className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{props.length}</div>
          <p className="text-[11px] text-slate-400">{categories.length} Categories active</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Serialized Items</span>
            <QrCode className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{items.length}</div>
          <p className="text-[11px] text-slate-400">100% Barcode mapped</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">In Warehouse Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {items.filter((i) => i.status === 'Available').length}
          </div>
          <p className="text-[11px] text-slate-400">Ready for studio checkout</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Out on Active Shoot</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {items.filter((i) => i.status === 'Dispatched / On Rent').length}
          </div>
          <p className="text-[11px] text-slate-400">On active movie sets</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, Model, Serial Barcode (e.g. ASH-ELEC-MOU-0001)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
            >
              <option value="All">All Rental Statuses</option>
              <option value="Available">Available</option>
              <option value="Dispatched / On Rent">Dispatched / On Rent</option>
              <option value="In Cart">In Cart</option>
              <option value="Damaged">Damaged</option>
              <option value="Lost">Lost</option>
            </select>

            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
            >
              <option value="All">All Conditions</option>
              <option value="Brand New">Brand New</option>
              <option value="Good">Good</option>
              <option value="Minor Wear">Minor Wear</option>
              <option value="Maintenance Required">Maintenance Required</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setSelectedCategoryId('All');
                setSelectedStatus('All');
                setSelectedCondition('All');
              }}
              title="Reset Filters"
              className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Batch Selection Banner */}
        {selectedItemIds.length > 0 && (
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs text-sky-800 animate-fade-in">
            <span className="font-semibold flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-sky-600" />
              <span>{selectedItemIds.length} Serialized Units Selected</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBulkSheetModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-sky-600 text-white font-semibold flex items-center gap-1 hover:bg-sky-500 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker Sheet</span>
              </button>
              <button
                onClick={() => setSelectedItemIds([])}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Interactive Serialized Items DataTable */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-3 w-10 text-center">
                <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  {selectedItemIds.length === filteredItems.length && filteredItems.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-sky-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3.5 px-4">Item Code &amp; QR</th>
              <th className="py-3.5 px-4">Prop / SKU Details</th>
              <th className="py-3.5 px-4">Warehouse Slot</th>
              <th className="py-3.5 px-4">Condition</th>
              <th className="py-3.5 px-4">Rental Status</th>
              <th className="py-3.5 px-4 text-center">Rented</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                  Loading serialized inventory catalog...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                  No serialized props match your filter criteria. Click &quot;Add Prop &amp; Stock&quot; to provision units.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);
                const prop = item.prop;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-sky-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleSelect(item.id)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Serial Code & QR thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSingleQRItem(item)}
                          title="Click to view & download sticker card"
                          className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 transition-colors shrink-0 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900 block">
                            {item.item_code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Earnings: ₹{item.lifetime_earnings.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Prop Name & Category */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {prop?.images && prop.images[0] ? (
                            <Image
                              src={prop.images[0]}
                              alt={prop.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Tag className="w-5 h-5 text-slate-400 m-auto mt-2.5" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 text-xs block line-clamp-1">
                            {prop?.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {prop?.model_number} • {prop?.brand}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Warehouse Slot */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-950 border border-amber-200/90 max-w-[220px] truncate shadow-2xs"
                          title={formatHumanLocation(
                            item.storage_location || item.warehouse_location_name || prop?.warehouse_location_name || (prop as any)?.storage_location,
                            item.warehouse_code || (item as any)?.location_code || prop?.warehouse_code || (prop as any)?.location_code
                          )}
                        >
                          <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">
                            {formatHumanLocation(
                              item.storage_location || item.warehouse_location_name || prop?.warehouse_location_name || (prop as any)?.storage_location,
                              item.warehouse_code || (item as any)?.location_code || prop?.warehouse_code || (prop as any)?.location_code
                            )}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block pl-1">
                          SLOT: {item.warehouse_code || (item as any)?.location_code || prop?.warehouse_code || (prop as any)?.location_code || 'G1-F1-RA-S01'}
                        </span>
                      </div>
                    </td>

                    {/* Physical Condition Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getConditionBadge(
                          item.physical_condition || item.condition
                        )}`}
                      >
                        {item.physical_condition || item.condition}
                      </span>
                    </td>

                    {/* Rental Availability Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status === 'Available' ? 'Available in Warehouse' : item.status}
                      </span>
                    </td>

                    {/* Times Rented */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 text-xs">
                      {item.rental_count}x
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setInspectingItem(item);
                            setDetailsModalOpen(true);
                          }}
                          title="View Comprehensive Property Overview (Rentals, Audits, QR Tag)"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSingleQRItem(item)}
                          title="Export Individual QR Sticker"
                          className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setAuditProp({
                              id: item.prop_id,
                              name: item.prop?.name || item.item_code,
                              sku: item.prop?.model_number || item.item_code,
                            });
                          }}
                          title="View Warehouse Inspection & Health History"
                          className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors cursor-pointer"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Modals & Drawers */}
      <AddPropStockModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        categories={categories}
        onSubmit={handleCreateProp}
      />

      <CategoryManagementModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onCreateCategory={async (input) => {
          await inventoryService.createCategory(input);
          await loadData();
        }}
        onUpdateCategory={async (input) => {
          await inventoryService.updateCategory(input);
          await loadData();
        }}
        onDeleteCategory={async (id) => {
          await inventoryService.deleteCategory(id);
          await loadData();
        }}
      />

      <BulkQRSheetModal
        isOpen={bulkSheetModalOpen}
        onClose={() => setBulkSheetModalOpen(false)}
        items={selectedForBulk.length > 0 ? selectedForBulk : filteredItems}
      />

      <PropertyDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        item={inspectingItem}
        prop={inspectingItem?.prop}
        onUpdateStatus={handleUpdateItemStatus}
      />

      <SerializedItemDrawer
        isOpen={inspectDrawerOpen}
        onClose={() => setInspectDrawerOpen(false)}
        item={inspectingItem}
        onUpdateStatus={handleUpdateItemStatus}
      />

      {/* Single Item QR Sticker Modal */}
      {singleQRItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">
                Sticker Asset Barcode
              </span>
              <button
                onClick={() => setSingleQRItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <QRStickerCard
              item={singleQRItem}
              showActions={true}
              size="standard"
              onPrint={() => window.print()}
            />
          </div>
        </div>
      )}

      {/* Property Health & Audit History Modal */}
      {auditProp && (
        <PropAuditHistoryView
          propId={auditProp.id}
          propName={auditProp.name}
          propSku={auditProp.sku}
          isOpen={!!auditProp}
          onClose={() => setAuditProp(null)}
        />
      )}
    </div>
  );
}
