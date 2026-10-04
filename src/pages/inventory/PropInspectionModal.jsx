'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  MapPin,
  Camera,
  Upload,
  X,
  Check,
  AlertTriangle,
  ArrowRight,
  MoveRight,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { inspectionService } from '@/lib/services/inspectionService';
import { inventoryService } from '@/lib/services/inventory';
import { useAuth } from '@/context/AuthContext';

export const CONDITION_OPTIONS = [
  {
    id: 'EXCELLENT',
    label: 'Excellent',
    description: 'Flawless condition, zero wear, camera-ready',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-500',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'GOOD',
    label: 'Good',
    description: 'Normal studio wear, fully functional',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-300 ring-sky-500',
    iconColor: 'text-sky-600',
  },
  {
    id: 'MINOR_DAMAGE',
    label: 'Minor Damage',
    description: 'Superficial blemishes, light scratches',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-500',
    iconColor: 'text-amber-600',
  },
  {
    id: 'DAMAGED',
    label: 'Damaged',
    description: 'Visible structural/functional defect, needs repair',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-500',
    iconColor: 'text-rose-600',
  },
  {
    id: 'SCRAP',
    label: 'Scrap',
    description: 'Irreparable damage, decommission candidate',
    badgeClass: 'bg-red-100 text-red-900 border-red-400 ring-red-600',
    iconColor: 'text-red-700',
  },
  {
    id: 'LOST',
    label: 'Lost',
    description: 'Missing from designated warehouse bay',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 ring-slate-500',
    iconColor: 'text-slate-600',
  },
];

export function PropInspectionModal({
  isOpen,
  onClose,
  prop,
  activeAuditId,
  onSaved,
}) {
  const { user, profile } = useAuth();

  const [selectedCondition, setSelectedCondition] = useState('GOOD');
  const [notes, setNotes] = useState('');
  const [isRelocated, setIsRelocated] = useState(false);
  const [targetGodown, setTargetGodown] = useState('Godown 1');
  const [targetFloor, setTargetFloor] = useState('Floor 1');
  const [targetRack, setTargetRack] = useState('Rack A');
  const [targetShelf, setTargetShelf] = useState('Shelf 01');
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when scanned prop changes
  useEffect(() => {
    if (prop) {
      const initialCond = (prop.physical_condition || prop.condition || 'GOOD').toUpperCase();
      const matched = CONDITION_OPTIONS.find((c) => c.id === initialCond);
      setSelectedCondition(matched ? matched.id : 'GOOD');
      setNotes(prop.damage_notes || prop.notes || '');

      setTargetGodown(prop.godown || 'Godown 1');
      setTargetFloor(prop.floor || 'Floor 1');
      setTargetRack(prop.rack || 'Rack A');
      setTargetShelf(prop.shelf || prop.shelf_bay || 'Shelf 01');
      setIsRelocated(Boolean(prop.is_relocated || false));
      setUploadedPhotoUrls(prop.evidence_photos || prop.photo_urls || []);
      setSaveSuccess(false);
    }
  }, [prop, isOpen]);

  if (!isOpen || !prop) return null;

  const scannedItemCode = prop.item_code;
  const propTitle = prop.title || prop.name || prop.prop_name || 'Cinematic Asset';
  const currentGodown = prop.godown || 'Godown 1';
  const currentFloor = prop.floor || 'Floor 1';
  const currentRack = prop.rack || 'Rack A';
  const currentBay = prop.shelf || prop.shelf_bay || prop.bay || 'Bay 1';
  const currentStorageLocation =
    prop.storage_location ||
    `${currentGodown} > ${currentFloor} > ${currentRack} > ${currentBay}`;

  // Direct Evidence Photo Upload to Supabase Storage 'audit-evidence'
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploadingPhoto(true);
    try {
      for (const file of files) {
        const url = await inspectionService.uploadAuditPhoto(file);
        setUploadedPhotoUrls((prev) => [...prev, url]);
      }
    } catch (err) {
      console.error('Error uploading audit photo:', err);
      alert('Photo upload failed. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index) => {
    setUploadedPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Inspection Record (Strict Single-Asset Isolation)
  const handleSaveInspection = async () => {
    if (!scannedItemCode) {
      alert('Error: Missing item_code for scanned prop.');
      return;
    }

    setIsSaving(true);
    const currentUserId = user?.id || 'staff-admin';

    const newLocation = isRelocated
      ? {
          godown: targetGodown,
          floor: targetFloor,
          rack: targetRack,
          shelf: targetShelf,
          storage_location: `${targetGodown} > ${targetFloor} > ${targetRack} > ${targetShelf}`,
        }
      : null;

    const updatePayload = {
      physical_condition: selectedCondition,
      damage_notes: notes || null,
      last_audit_date: new Date().toISOString(),
      last_inspected_by: currentUserId,
    };

    if (isRelocated && newLocation) {
      updatePayload.godown = newLocation.godown;
      updatePayload.floor = newLocation.floor;
      updatePayload.rack = newLocation.rack;
      updatePayload.shelf = newLocation.shelf;
      updatePayload.storage_location = `${newLocation.godown} > ${newLocation.floor} > ${newLocation.rack} > ${newLocation.shelf}`;
    }

    try {
      // 1. Strict single-row asset update in properties
      const { error: propUpdateError } = await supabase
        .from('properties')
        .update(updatePayload)
        .eq('item_code', scannedItemCode);

      if (propUpdateError && propUpdateError.code !== 'PGRST205' && !propUpdateError.message?.includes('does not exist')) {
        console.warn('Supabase properties update note:', propUpdateError.message);
      }

      // Also update inventory_assets if present
      try {
        await supabase
          .from('inventory_assets')
          .update(updatePayload)
          .eq('item_code', scannedItemCode);
      } catch {
        // optional table
      }

      // 2. Log history trail in prop_health_history
      const historyPayload = {
        item_code: scannedItemCode,
        audit_id: activeAuditId || 'audit-adhoc',
        condition_status: selectedCondition,
        physical_condition: selectedCondition,
        previous_location: prop.storage_location || currentStorageLocation,
        new_location: updatePayload.storage_location || prop.storage_location || currentStorageLocation,
        notes: notes || null,
        damage_notes: notes || null,
        evidence_photos: uploadedPhotoUrls,
        photo_urls: uploadedPhotoUrls,
        inspector_id: currentUserId,
        inspector_name: user?.user_metadata?.full_name || profile?.full_name || 'Inspector',
        created_at: new Date().toISOString(),
      };

      const { error: historyError } = await supabase
        .from('prop_health_history')
        .insert(historyPayload);

      if (historyError && historyError.code !== 'PGRST205' && !historyError.message?.includes('does not exist')) {
        console.warn('Supabase prop_health_history insert note:', historyError.message);
      }

      // 3. Upsert / update audit_inspection_items (prevent duplicates on re-inspection)
      let savedAuditItemId = prop.existing_inspection_id || null;
      try {
        const isValidUuid = (val) =>
          typeof val === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

        const auditItemPayload = {
          audit_id: activeAuditId || 'audit-adhoc',
          item_code: scannedItemCode,
          ...(isValidUuid(prop.id) ? { property_id: prop.id, prop_id: prop.id } : {}),
          physical_condition: selectedCondition,
          health_status:
            selectedCondition === 'EXCELLENT' || selectedCondition === 'GOOD'
              ? 'PERFECT'
              : selectedCondition === 'MINOR_DAMAGE'
              ? 'MINOR_DAMAGE'
              : 'MAJOR_DAMAGE',
          rack_verified: updatePayload.storage_location || currentStorageLocation,
          notes: notes || null,
          evidence_photos: uploadedPhotoUrls,
          scanned_at: new Date().toISOString(),
          scanned_by: currentUserId,
        };

        if (savedAuditItemId) {
          await supabase
            .from('audit_inspection_items')
            .update(auditItemPayload)
            .eq('id', savedAuditItemId);
        } else if (activeAuditId) {
          const { data: existingItem } = await supabase
            .from('audit_inspection_items')
            .select('id')
            .eq('audit_id', activeAuditId)
            .eq('item_code', scannedItemCode)
            .maybeSingle();

          if (existingItem?.id) {
            savedAuditItemId = existingItem.id;
            await supabase
              .from('audit_inspection_items')
              .update(auditItemPayload)
              .eq('id', existingItem.id);
          } else {
            const { data: insertedItem } = await supabase
              .from('audit_inspection_items')
              .insert(auditItemPayload)
              .select('id')
              .single();
            if (insertedItem?.id) {
              savedAuditItemId = insertedItem.id;
            }
          }
        }
      } catch (err) {
        console.warn('audit_inspection_items sync note:', err);
      }

      // 3. Synchronize local inventory service & broadcast
      try {
        inventoryService.updatePropFromAuditInspection({
          itemCode: scannedItemCode,
          condition: selectedCondition === 'EXCELLENT' ? 'Pristine' : selectedCondition === 'GOOD' ? 'Good / Normal Wear' : selectedCondition,
          physicalCondition: selectedCondition,
          locationFullPath: updatePayload.storage_location || currentStorageLocation,
          locationCode: `G${(updatePayload.godown || currentGodown).replace(/\D/g, '') || '1'}-F${String(updatePayload.floor || currentFloor).replace(/\D/g, '') || '1'}-R${(updatePayload.rack || currentRack).replace(/[^a-zA-Z0-9]/g, '') || 'A'}-S${(updatePayload.shelf || currentBay).replace(/[^a-zA-Z0-9]/g, '') || '01'}`,
          godown: updatePayload.godown || currentGodown,
          floor: updatePayload.floor || currentFloor,
          rack: updatePayload.rack || currentRack,
          shelf: updatePayload.shelf || currentBay,
          notes: notes || '',
          auditorName: user?.user_metadata?.full_name || profile?.full_name || 'Inspector',
        });
      } catch (syncErr) {
        console.warn('Local inventoryService sync note:', syncErr);
      }

      // 4. Dispatch custom event for PropsCatalog & other live listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('props-catalog-updated', {
            detail: {
              item_code: scannedItemCode,
              physical_condition: selectedCondition,
              storage_location: updatePayload.storage_location || currentStorageLocation,
            },
          })
        );
      }

      setSaveSuccess(true);
      setTimeout(() => {
        if (onSaved) {
          onSaved({
            item_code: scannedItemCode,
            physical_condition: selectedCondition,
            storage_location: updatePayload.storage_location || currentStorageLocation,
            godown: updatePayload.godown || currentGodown,
            floor: updatePayload.floor || currentFloor,
            rack: updatePayload.rack || currentRack,
            shelf: updatePayload.shelf || currentBay,
            notes,
            evidence_photos: uploadedPhotoUrls,
          });
        }
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to save inspection record:', err);
      alert('Failed to save inspection. Please check network/database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-hidden animate-fade-in">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white border border-slate-200/90 rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden">
        
        {/* 1. Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Prop Health Inspection
                </h2>
                <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                  {scannedItemCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Audit Record • Strict Single-Asset Mutation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* Asset Overview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/30 border border-slate-200/80 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Inspecting Physical Unit
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  {propTitle}
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                {scannedItemCode}
              </span>
            </div>

            {/* Current Registered Warehouse Coordinates */}
            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Godown</span>
                <span className="font-bold text-slate-800 text-[11px]">{currentGodown}</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Floor</span>
                <span className="font-bold text-slate-800 text-[11px]">{currentFloor}</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Rack</span>
                <span className="font-bold text-slate-800 text-[11px]">{currentRack}</span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="text-[9px] uppercase font-semibold text-slate-400 block">Bay / Shelf</span>
                <span className="font-bold text-slate-800 text-[11px]">{currentBay}</span>
              </div>
            </div>
          </div>

          {/* Physical Condition Selector (Radio Chips) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Physical Condition Verification <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONDITION_OPTIONS.map((opt) => {
                const isSelected = selectedCondition === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedCondition(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? `${opt.badgeClass} shadow-xs ring-2`
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs">{opt.label}</span>
                      {isSelected && <Check className={`w-3.5 h-3.5 ${opt.iconColor}`} />}
                    </div>
                    <span className="text-[10px] opacity-75 mt-1 leading-tight line-clamp-2">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inspector Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Inspector Notes &amp; Damage Remarks
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scratches on front bezel, worn rubber grip, functional test passed..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white resize-none"
            />
          </div>

          {/* Relocation Fields (Optional Toggle) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Warehouse Relocation
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Move this physical unit to a different godown, floor, or shelf
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setIsRelocated(!isRelocated)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isRelocated ? 'bg-sky-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isRelocated ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isRelocated && (
              <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-4 gap-2.5 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Target Godown
                  </label>
                  <select
                    value={targetGodown}
                    onChange={(e) => setTargetGodown(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Godown 1">Godown 1</option>
                    <option value="Godown 2">Godown 2</option>
                    <option value="Godown 3">Godown 3</option>
                    <option value="Repair Bay">Repair Bay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Target Floor
                  </label>
                  <select
                    value={targetFloor}
                    onChange={(e) => setTargetFloor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="Floor 1">Floor 1</option>
                    <option value="Floor 2">Floor 2</option>
                    <option value="Floor 3">Floor 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Target Rack
                  </label>
                  <select
                    value={targetRack}
                    onChange={(e) => setTargetRack(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Rack A">Rack A</option>
                    <option value="Rack B">Rack B</option>
                    <option value="Rack C">Rack C</option>
                    <option value="Rack D">Rack D</option>
                    <option value="Rack E">Rack E</option>
                    <option value="Quarantine Rack">Quarantine Rack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Target Shelf
                  </label>
                  <select
                    value={targetShelf}
                    onChange={(e) => setTargetShelf(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Shelf 01">Shelf 01</option>
                    <option value="Shelf 02">Shelf 02</option>
                    <option value="Shelf 03">Shelf 03</option>
                    <option value="Shelf 04">Shelf 04</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Evidence Photo Uploader (Supabase Storage: 'audit-evidence') */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Evidence Photos (Bucket: audit-evidence)
              </label>
              <span className="text-[11px] text-slate-400">
                {uploadedPhotoUrls.length} attached
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {uploadedPhotoUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group"
                >
                  <Image
                    src={url}
                    alt={`Evidence ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-sky-600 transition-colors cursor-pointer shrink-0">
                {isUploadingPhoto ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-bold uppercase">Attach</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

        {/* 3. Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveInspection}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Record...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Save Inspection Record</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default PropInspectionModal;
