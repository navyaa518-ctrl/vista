'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  PropSKU,
  PropSerializedItem,
  ItemCondition,
  ItemStatus,
  SerializedItemRentalHistory,
} from '@/types/inventory';
import { PropHealthHistoryEntry } from '@/types/audits';
import { inventoryService, formatHumanLocation } from '@/lib/services/inventory';
import { inspectionService } from '@/lib/services/inspectionService';
import { QRStickerCard } from './QRStickerCard';
import {
  X,
  MapPin,
  Calendar,
  Film,
  Building,
  User,
  Clock,
  DollarSign,
  TrendingUp,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Layers,
  Camera,
  RefreshCw,
  Printer,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Maximize2,
  Edit3,
  Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prop?: PropSKU | null;
  item?: PropSerializedItem | null;
  propId?: string;
  onUpdateStatus?: (itemId: string, status: ItemStatus, condition: ItemCondition) => Promise<void>;
}

export function PropertyDetailsModal({
  isOpen,
  onClose,
  prop: initialProp,
  item: initialItem,
  propId: initialPropId,
  onUpdateStatus,
}: PropertyDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'rental-history' | 'audit-history' | 'qr-label'>('rental-history');
  const [rentalHistory, setRentalHistory] = useState<SerializedItemRentalHistory[]>([]);
  const [auditHistory, setAuditHistory] = useState<PropHealthHistoryEntry[]>([]);
  const [loadingRentals, setLoadingRentals] = useState(true);
  const [loadingAudits, setLoadingAudits] = useState(true);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Derive target prop and item details
  const prop = initialProp || initialItem?.prop;
  const item = initialItem;
  const targetPropId = prop?.id || item?.prop_id || initialPropId || '';
  const propName = prop?.name || item?.prop?.name || 'Cinematic Prop';
  const itemCode = item?.item_code || prop?.model_number || 'PROP-SKU';
  const modelNumber = prop?.model_number || 'N/A';
  const brand = prop?.brand || 'ASHWA';
  const categoryName = prop?.category?.name || 'Props & Sets';
  const replacementValue = prop?.replacement_value || 5000;
  const dailyRent = prop?.calculated_rent_price || Math.round((replacementValue * (prop?.rental_rate_percent || 20)) / 100);
  const lifetimeRevenue = item?.lifetime_earnings || rentalHistory.reduce((acc, curr) => acc + (curr.revenue_amount || 0), 0);
  const rentalCount = item?.rental_count || rentalHistory.length;

  const currentCondition = item?.physical_condition || item?.condition || prop?.current_condition || 'Good / Normal Wear';
  const currentStatus = item?.status || 'Available';

  // Formatted Human Readable Location
  const rawLocName = item?.storage_location || item?.warehouse_location_name || prop?.warehouse_location_name || (prop as any)?.storage_location || '';
  const rawLocCode = item?.warehouse_code || (item as any)?.location_code || prop?.warehouse_code || (prop as any)?.location_code || '';
  const formattedLocation = formatHumanLocation(rawLocName, rawLocCode);

  const images = prop?.images && prop.images.length > 0
    ? prop.images
    : ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'];

  // Load Data
  const loadModalData = useCallback(async () => {
    if (!targetPropId && !item) return;

    setLoadingRentals(true);
    setLoadingAudits(true);

    try {
      // 1. Fetch Rental History
      const rentals = await inventoryService.getPropRentalHistory(targetPropId, item || undefined);
      setRentalHistory(rentals);
    } catch (e) {
      console.warn('Error loading rental history in modal:', e);
    } finally {
      setLoadingRentals(false);
    }

    try {
      // 2. Fetch Health & Audit History (filtered strictly by item_code if viewing a serialized asset)
      const assetCode = item?.item_code || (prop as any)?.item_code || undefined;
      const audits = await inspectionService.getPropHealthHistory(targetPropId, assetCode);
      setAuditHistory(audits);
    } catch (e) {
      console.warn('Error loading audit history in modal:', e);
    } finally {
      setLoadingAudits(false);
    }
  }, [targetPropId, item]);

  useEffect(() => {
    if (isOpen) {
      loadModalData();
    }
  }, [isOpen, loadModalData]);

  // Listen for catalog or audit updates
  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => {
      loadModalData();
    };
    window.addEventListener('props-catalog-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('props-catalog-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [isOpen, loadModalData]);

  const { user, profile } = useAuth();

  // Direct Quick-Edit State (Workflow 3)
  const [editCondition, setEditCondition] = useState<string>('GOOD');
  const [editGodown, setEditGodown] = useState<string>('Godown 1');
  const [editFloor, setEditFloor] = useState<string>('Floor 1');
  const [editRack, setEditRack] = useState<string>('Rack A');
  const [editShelf, setEditShelf] = useState<string>('Shelf 01');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isUpdatingAsset, setIsUpdatingAsset] = useState<boolean>(false);
  const [quickEditSuccess, setQuickEditSuccess] = useState<boolean>(false);

  // Initialize Quick Edit fields from item or prop
  useEffect(() => {
    if (isOpen) {
      const c = (item?.physical_condition || item?.condition || prop?.current_condition || 'GOOD').toUpperCase();
      if (c.includes('EXCELLENT')) setEditCondition('EXCELLENT');
      else if (c.includes('MINOR_DAMAGE') || c.includes('MINOR WEAR')) setEditCondition('MINOR_DAMAGE');
      else if (c.includes('DAMAGED')) setEditCondition('DAMAGED');
      else if (c.includes('SCRAP')) setEditCondition('SCRAP');
      else if (c.includes('LOST') || c.includes('MISSING')) setEditCondition('LOST');
      else setEditCondition('GOOD');

      setEditGodown((item as any)?.godown || (prop as any)?.godown || 'Godown 1');
      setEditFloor((item as any)?.floor || (prop as any)?.floor || 'Floor 1');
      setEditRack((item as any)?.rack || (prop as any)?.rack || 'Rack A');
      setEditShelf((item as any)?.shelf || (prop as any)?.shelf || 'Shelf 01');
      setEditNotes('');
      setQuickEditSuccess(false);
    }
  }, [isOpen, item, prop]);

  // Handle Direct Quick-Edit Update
  const handleUpdateAsset = async () => {
    const targetAssetCode = item?.item_code || prop?.model_number || (prop as any)?.item_code;
    if (!targetAssetCode) {
      alert('Unable to identify unique asset code.');
      return;
    }

    setIsUpdatingAsset(true);
    setQuickEditSuccess(false);

    try {
      const currentUserId = user?.id || 'staff-admin';
      const currentUserName = user?.user_metadata?.full_name || profile?.full_name || 'Admin / QC Staff';
      const newStorageLocation = `${editGodown} > ${editFloor} > ${editRack} > ${editShelf}`;

      // 1. Strict single-row asset update in properties
      const { error: propErr } = await supabase
        .from('properties')
        .update({
          physical_condition: editCondition,
          godown: editGodown,
          floor: editFloor,
          rack: editRack,
          shelf: editShelf,
          storage_location: newStorageLocation,
          damage_notes: editNotes || null,
          last_audit_date: new Date().toISOString(),
          last_inspected_by: currentUserId,
        })
        .eq('item_code', targetAssetCode);

      if (propErr && propErr.code !== 'PGRST205' && !propErr.message?.includes('does not exist')) {
        console.warn('properties update note:', propErr.message);
      }

      // Also update inventory_assets if table exists
      try {
        await supabase
          .from('inventory_assets')
          .update({
            physical_condition: editCondition,
            godown: editGodown,
            floor: editFloor,
            rack: editRack,
            shelf: editShelf,
            storage_location: newStorageLocation,
            damage_notes: editNotes || null,
            last_audit_date: new Date().toISOString(),
          })
          .eq('item_code', targetAssetCode);
      } catch {
        // optional table
      }

      // 2. Write manual edit entry to prop_health_history
      const { error: histErr } = await supabase
        .from('prop_health_history')
        .insert({
          item_code: targetAssetCode,
          audit_id: 'manual-quick-edit',
          condition_status: editCondition,
          physical_condition: editCondition,
          previous_location: formattedLocation,
          new_location: newStorageLocation,
          notes: editNotes ? `Quick-Edit: ${editNotes}` : 'Manual quick-edit from Props Catalog modal',
          damage_notes: editNotes || null,
          inspector_id: currentUserId,
          inspector_name: currentUserName,
          created_at: new Date().toISOString(),
        });

      if (histErr && histErr.code !== 'PGRST205' && !histErr.message?.includes('does not exist')) {
        console.warn('prop_health_history insert note:', histErr.message);
      }

      // 3. Update local inventory service & broadcast
      try {
        inventoryService.updatePropFromAuditInspection({
          propId: targetPropId,
          itemCode: targetAssetCode,
          propSerializedItemId: item?.id,
          condition: editCondition === 'EXCELLENT' ? 'Pristine' : editCondition === 'GOOD' ? 'Good / Normal Wear' : editCondition,
          physicalCondition: editCondition,
          locationFullPath: newStorageLocation,
          godown: editGodown,
          floor: editFloor,
          rack: editRack,
          shelf: editShelf,
          notes: editNotes || 'Quick-edit update',
          auditorName: currentUserName,
        });
      } catch (err) {
        console.warn('Local inventoryService update error:', err);
      }

      // 4. Dispatch event for real-time catalog sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('props-catalog-updated', {
            detail: {
              item_code: targetAssetCode,
              physical_condition: editCondition,
              storage_location: newStorageLocation,
            },
          })
        );
      }

      // 5. Reload modal audit history & trigger status callback if provided
      await loadModalData();
      if (onUpdateStatus && item?.id) {
        try {
          await onUpdateStatus(item.id, (item.status as any) || 'Available', (editCondition as any));
        } catch {
          // optional callback
        }
      }

      setQuickEditSuccess(true);
      setTimeout(() => setQuickEditSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to quick-edit asset:', e);
      alert('Error updating asset. Please check network/database.');
    } finally {
      setIsUpdatingAsset(false);
    }
  };

  if (!isOpen) return null;

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
    if (c.includes('DAMAGED') || c.includes('REPAIR') || c.includes('MAINTENANCE') || c.includes('MAJOR_DAMAGE')) {
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

  const getRentalStatusBadge = (status?: string) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Dispatched / On Rent':
      case 'on_rent':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'In Cart':
      case 'in_cart':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Damaged':
      case 'Lost':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md overflow-hidden animate-fade-in">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Expansive Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white border border-slate-200/90 rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden">
        
        {/* 1. Modal Top Bar with Close Button */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-800 px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              {itemCode}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px] sm:max-w-md">
              {categoryName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadModalData}
              title="Refresh Property Data"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRentals || loadingAudits ? 'animate-spin text-sky-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1 font-semibold text-xs text-slate-600"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* 2. Expansive Hero Header with Thumbnails & Key Metrics */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex flex-col lg:flex-row gap-5 items-start justify-between">
            
            {/* Left: Prop Visual Gallery & Metadata */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Thumbnail with Gallery indicator */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm">
                <Image
                  src={images[selectedImageIndex] || images[0]}
                  alt={propName}
                  fill
                  className="object-cover"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-md font-mono">
                    {selectedImageIndex + 1}/{images.length}
                  </div>
                )}
              </div>

              {/* Title, SKU, Chips & Human-Readable Location */}
              <div className="space-y-2 flex-1 min-w-0">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight line-clamp-1">
                    {propName}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    MODEL: <span className="font-semibold text-slate-700">{modelNumber}</span> • BRAND: <span className="font-semibold text-slate-700">{brand}</span>
                  </p>
                </div>

                {/* Status, Condition & Location Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {/* Condition chip */}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getConditionBadge(
                      currentCondition
                    )}`}
                  >
                    {currentCondition}
                  </span>

                  {/* Rental status chip */}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getRentalStatusBadge(
                      currentStatus
                    )}`}
                  >
                    {currentStatus === 'Available' ? 'Available in Warehouse' : currentStatus}
                  </span>

                  {/* Formatted Human-Readable Location Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{formattedLocation}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Key Performance Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
              {/* Daily Rate */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center min-w-[100px] sm:min-w-[115px]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">
                  Daily Rate
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono block mt-0.5">
                  ₹{dailyRent.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">per shoot day</span>
              </div>

              {/* Lifetime Revenue */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center min-w-[100px] sm:min-w-[115px]">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold block tracking-wider">
                  Lifetime Rev
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-800 font-mono block mt-0.5">
                  ₹{lifetimeRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">earned</span>
              </div>

              {/* Rental Count / Shoots */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 text-center min-w-[100px] sm:min-w-[115px]">
                <span className="text-[10px] text-sky-700 uppercase font-semibold block tracking-wider">
                  Productions
                </span>
                <span className="text-sm sm:text-base font-bold text-sky-800 font-mono block mt-0.5">
                  {rentalCount} Shoots
                </span>
                <span className="text-[10px] text-sky-600 font-medium">rented out</span>
              </div>
            </div>

          </div>
        </div>

        {/* 3. Segmented Tab Switcher */}
        <div className="px-5 sm:px-6 pt-3 pb-0 border-b border-slate-200/80 bg-slate-50/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('rental-history')}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'rental-history'
                  ? 'border-sky-600 text-sky-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Rental History ({rentalHistory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit-history')}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'audit-history'
                  ? 'border-sky-600 text-sky-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit History &amp; Relocations ({auditHistory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('qr-label')}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'qr-label'
                  ? 'border-sky-600 text-sky-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Asset Barcode &amp; Sticker</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            Repl. Value: <strong className="text-slate-700 font-mono">₹{replacementValue.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* 4. Scrollable Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: RENTAL HISTORY */}
          {activeTab === 'rental-history' && (
            <div className="space-y-4">
              {loadingRentals ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
                  Loading production rental history...
                </div>
              ) : rentalHistory.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs space-y-2 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                  <Film className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700 text-sm">No Production Rentals Logged Yet</p>
                  <p className="text-[11px] max-w-sm mx-auto text-slate-400">
                    When this prop is rented for film, TV, or commercial shoots through Ashwa ERP orders, its dispatch and return ledger will populate here.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Order ID &amp; Production</th>
                        <th className="py-3 px-4">Client / Studio</th>
                        <th className="py-3 px-4">Rental Dates</th>
                        <th className="py-3 px-4 text-center">Duration</th>
                        <th className="py-3 px-4 text-right">Revenue</th>
                        <th className="py-3 px-4">Return Condition &amp; Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rentalHistory.map((rec, idx) => (
                        <tr key={rec.order_id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-sky-700 block">
                              {rec.order_number}
                            </span>
                            <span className="font-semibold text-slate-900 text-xs block">
                              {rec.production_name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span>{rec.client_name}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{rec.checkout_date} → {rec.return_date}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                              {rec.days_rented} Days
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            ₹{rec.revenue_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="space-y-0.5 max-w-[200px]">
                              <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200">
                                {rec.condition_after}
                              </span>
                              {rec.inspector_notes && (
                                <p className="text-[11px] text-slate-500 italic truncate" title={rec.inspector_notes}>
                                  &quot;{rec.inspector_notes}&quot;
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HEALTH AUDIT & INSPECTION HISTORY */}
          {activeTab === 'audit-history' && (
            <div className="space-y-5">
              {/* DIRECT QUICK-EDIT CARD (Workflow 3 Requirement) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50/90 via-indigo-50/40 to-slate-50 border border-sky-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                      <Edit3 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Direct Asset Quick-Edit
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Immediate condition override and warehouse relocation with audit trail logging
                      </p>
                    </div>
                  </div>
                  {quickEditSuccess && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Asset Updated!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
                  {/* Physical Condition Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Physical Condition
                    </label>
                    <select
                      value={editCondition}
                      onChange={(e) => setEditCondition(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                    >
                      <option value="EXCELLENT">EXCELLENT</option>
                      <option value="GOOD">GOOD</option>
                      <option value="MINOR_DAMAGE">MINOR_DAMAGE</option>
                      <option value="DAMAGED">DAMAGED</option>
                      <option value="SCRAP">SCRAP</option>
                      <option value="LOST">LOST</option>
                    </select>
                  </div>

                  {/* Godown Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Godown
                    </label>
                    <select
                      value={editGodown}
                      onChange={(e) => setEditGodown(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                    >
                      <option value="Godown 1">Godown 1</option>
                      <option value="Godown 2">Godown 2</option>
                      <option value="Godown 3">Godown 3</option>
                      <option value="Repair Bay">Repair Bay</option>
                    </select>
                  </div>

                  {/* Floor Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Floor
                    </label>
                    <select
                      value={editFloor}
                      onChange={(e) => setEditFloor(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                    >
                      <option value="Ground Floor">Ground Floor</option>
                      <option value="Floor 1">Floor 1</option>
                      <option value="Floor 2">Floor 2</option>
                      <option value="Floor 3">Floor 3</option>
                    </select>
                  </div>

                  {/* Rack Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Rack
                    </label>
                    <select
                      value={editRack}
                      onChange={(e) => setEditRack(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
                    >
                      <option value="Rack A">Rack A</option>
                      <option value="Rack B">Rack B</option>
                      <option value="Rack C">Rack C</option>
                      <option value="Rack D">Rack D</option>
                      <option value="Rack E">Rack E</option>
                      <option value="Quarantine Rack">Quarantine Rack</option>
                    </select>
                  </div>
                </div>

                {/* Optional Notes & Update Button */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Optional remarks (e.g. Scratched during shoot, relocated to Bay B)..."
                    className="flex-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleUpdateAsset}
                    disabled={isUpdatingAsset}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {isUpdatingAsset ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating Asset...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Update Asset</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {loadingAudits ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
                  Loading warehouse inspection audit history...
                </div>
              ) : auditHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                  <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700 text-sm">No Prior Inspections Recorded</p>
                  <p className="text-[11px] max-w-sm mx-auto text-slate-400">
                    Use the Direct Quick-Edit form above or submit a warehouse audit to log verified condition and relocation movements here.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {auditHistory.map((log) => {
                    const dateVal = log.created_at || log.timestamp || log.inspected_at || new Date().toISOString();
                    const logDate = new Date(dateVal);
                    const displayCondition = (log.physical_condition || log.condition_status || log.status || log.condition || 'GOOD').toString();
                    const notesText = log.damage_notes || log.notes;
                    const photos = log.photo_urls && log.photo_urls.length > 0 ? log.photo_urls : log.photo_url ? [log.photo_url] : [];
                    
                    const hasRelocated = Boolean(
                      log.previous_location &&
                      log.new_location &&
                      log.previous_location.trim().toLowerCase() !== log.new_location.trim().toLowerCase()
                    );

                    return (
                      <div key={log.id} className="relative group">
                        {/* Timeline Pin */}
                        <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white shadow-xs group-hover:scale-125 transition-transform" />

                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all space-y-3">
                          {/* Header of Audit Log */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-mono text-slate-600 font-semibold flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{logDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-slate-400 text-[11px]">
                                {logDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getConditionBadge(
                                  displayCondition
                                )}`}
                              >
                                {displayCondition.replace(/_/g, ' ')}
                              </span>

                              {log.is_functional !== undefined && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    log.is_functional
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {log.is_functional ? '⚡ Operational' : '⚠️ Defective'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Inspector & Location Trail */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>Inspector: <strong className="text-slate-900">{log.inspected_by_name || 'Inspector'}</strong></span>
                            </div>

                            <div className="flex items-center gap-1.5 text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="text-slate-900 font-medium">
                                {formatHumanLocation(log.new_location || log.rack_location || formattedLocation)}
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Movement Trail Banner */}
                          {hasRelocated && (
                            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center gap-2">
                              <span className="font-bold text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-200/80 text-sky-900 shrink-0">
                                Relocated
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap font-medium text-[11px]">
                                <span className="line-through text-slate-500">
                                  {formatHumanLocation(log.previous_location)}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
                                <strong className="text-sky-950 font-bold">
                                  {formatHumanLocation(log.new_location)}
                                </strong>
                              </div>
                            </div>
                          )}

                          {log.is_misplaced && !hasRelocated && (
                            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              <span>Flagged as Misplaced during warehouse walk-through</span>
                            </div>
                          )}

                          {/* Notes */}
                          {notesText && (
                            <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                              <span className="font-semibold text-slate-900 block text-[11px] mb-0.5">Auditor Remarks:</span>
                              &quot;{notesText}&quot;
                            </div>
                          )}

                          {/* Clickable Evidence Photos */}
                          {photos.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Camera className="w-3.5 h-3.5 text-slate-400" />
                                <span>Evidence Photos ({photos.length})</span>
                              </span>
                              <div className="flex flex-wrap gap-2.5">
                                {photos.map((photoUrl, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setEnlargedPhoto(photoUrl)}
                                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-sky-500 shadow-2xs group/img transition-all cursor-pointer"
                                  >
                                    <Image
                                      src={photoUrl}
                                      alt={`Inspection evidence ${pIdx + 1}`}
                                      fill
                                      className="object-cover group-hover/img:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Maximize2 className="w-4 h-4" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QR CODE & STICKER LABEL */}
          {activeTab === 'qr-label' && (
            <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
              {item ? (
                <QRStickerCard
                  item={item}
                  showActions={true}
                  size="standard"
                  onPrint={() => window.print()}
                />
              ) : (
                <div className="text-center p-8 space-y-2">
                  <QrCode className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Serialized Item Required</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Sticker asset barcodes are generated for specific serialized units. View an individual serialized item from the inventory table to print its QR label.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* 5. Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            <span className="font-mono text-slate-700 font-semibold">{itemCode}</span>
            <span className="mx-2">•</span>
            <span>📍 {formattedLocation}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Close Overview
          </button>
        </div>

      </div>

      {/* Lightbox Photo Enlarge Modal */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center">
            <button
              onClick={() => setEnlargedPhoto(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full h-full max-h-[80vh]">
              <Image
                src={enlargedPhoto}
                alt="Enlarged inspection evidence"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetailsModal;
