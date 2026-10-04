'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Camera,
  MapPin,
  Check,
  X,
  ShieldCheck,
  Trash2,
  RefreshCw,
  Zap,
  PowerOff,
  Warehouse,
  ArrowRight,
  MoveRight,
  Navigation,
  Info,
} from 'lucide-react';
import {
  AuditItemChecklistEntry,
  AuditHealthStatus,
} from '@/types/audits';
import { inspectionService } from '@/lib/services/inspectionService';
import { inventoryService } from '@/lib/services/inventory';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface PropInspectionReviewModalProps {
  propItem: AuditItemChecklistEntry | null;
  auditId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedItem: AuditItemChecklistEntry) => void;
}

export function PropInspectionReviewModal({
  propItem,
  auditId,
  isOpen,
  onClose,
  onSaved,
}: PropInspectionReviewModalProps) {
  const { user, profile } = useAuth();

  // Helper to normalize condition to chip IDs
  const normalizeCondition = (raw?: string | null): string => {
    if (!raw) return 'GOOD';
    const s = String(raw).toUpperCase().trim();
    if (
      s === 'DAMAGED' ||
      s.includes('DAMAGED') ||
      s.includes('REPAIR') ||
      s === 'NEEDS_REPAIR' ||
      s.includes('MAINTENANCE')
    ) {
      return 'DAMAGED_NEEDS_REPAIR';
    }
    if (s === 'CRITICAL' || s.includes('CRITICAL') || s.includes('SCRAP') || s.includes('CRITICAL_SCRAP')) {
      return 'CRITICAL';
    }
    if (s === 'MISSING' || s.includes('MISSING') || s.includes('MISPLACED') || s === 'LOST') {
      return 'MISSING';
    }
    if (
      s === 'EXCELLENT' ||
      s === 'PERFECT' ||
      s.includes('PRISTINE') ||
      s.includes('BRAND NEW')
    ) {
      return 'EXCELLENT';
    }
    if (s === 'GOOD' || s.includes('NORMAL WEAR') || s.includes('MINOR WEAR')) {
      return 'GOOD';
    }
    return 'GOOD';
  };

  // 1. Health Condition State (initialized with prop's actual saved condition)
  const [selectedStatus, setSelectedStatus] = useState<string>(
    normalizeCondition(propItem?.physical_condition || propItem?.condition || propItem?.health_status)
  );

  // 2. Working Condition State (Operational vs Non-Functional)
  const [isFunctional, setIsFunctional] = useState<boolean>(
    propItem?.is_functional !== undefined ? propItem.is_functional : true
  );

  // 3. Location & Relocation States
  const [verifiedRack, setVerifiedRack] = useState(
    propItem?.current_rack || propItem?.expected_rack || 'Floor 1 > Rack A-01 > Bay 1'
  );
  const [isMisplaced, setIsMisplaced] = useState(propItem?.is_misplaced || false);
  const [isRelocating, setIsRelocating] = useState(false);
  const [selectedGodown, setSelectedGodown] = useState('Godown 1');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedRack, setSelectedRack] = useState('Rack A-01');
  const [selectedBay, setSelectedBay] = useState('Bay 1');

  // 4. Notes & Photo Evidence
  const [notes, setNotes] = useState(propItem?.damage_notes || propItem?.notes || '');
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    propItem?.photo_url ? [propItem.photo_url] : propItem?.evidence_photos || []
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  // Asynchronous modal state initialization:
  // 1. Fetch from audit_inspection_items if already evaluated in active audit
  // 2. Otherwise fetch live physical_condition directly from database / catalog without resetting to "PERFECT"
  useEffect(() => {
    if (!propItem || !isOpen) return;
    const currentItem = propItem;

    let isMounted = true;

    async function initializeModalState() {
      // 1. Pull existing recorded verdict from active audit if already evaluated
      const existingAuditItem = await inspectionService.getAuditInspectionItem(
        auditId,
        currentItem.prop_id
      );

      if (existingAuditItem && isMounted) {
        const savedCondition =
          existingAuditItem.physical_condition ||
          existingAuditItem.condition ||
          existingAuditItem.condition_status ||
          existingAuditItem.health_status;

        setSelectedStatus(normalizeCondition(savedCondition));
        setNotes(existingAuditItem.notes || existingAuditItem.damage_notes || '');
        setPhotoUrls(
          existingAuditItem.evidence_photos && existingAuditItem.evidence_photos.length > 0
            ? existingAuditItem.evidence_photos
            : existingAuditItem.photo_url
            ? [existingAuditItem.photo_url]
            : []
        );
        setIsFunctional(
          existingAuditItem.is_functional !== undefined ? existingAuditItem.is_functional : true
        );
        const loc = existingAuditItem.rack_verified || currentItem.current_rack || currentItem.expected_rack || 'Floor 1 > Rack A-01 > Bay 1';
        setVerifiedRack(loc);
        setIsMisplaced(existingAuditItem.is_misplaced || false);
        return;
      }

      // 2. Fetch live physical_condition and location directly for the exact physical unit
      let liveCondition = currentItem.physical_condition || currentItem.condition || currentItem.health_status;
      let liveNotes = currentItem.damage_notes || currentItem.notes || '';
      let liveLocation = currentItem.storage_location || currentItem.current_rack || currentItem.expected_rack || 'Godown 1 > Floor 1 > Rack A-01 > Shelf 01';

      try {
        const uniqueAssetCode = currentItem.item_code;
        if (uniqueAssetCode) {
          // Query properties table strictly by item_code
          const { data: propRow } = await supabase
            .from('properties')
            .select('physical_condition, condition, damage_notes, notes, storage_location, godown, floor, rack, shelf')
            .eq('item_code', uniqueAssetCode)
            .maybeSingle();

          if (propRow) {
            liveCondition = propRow.physical_condition || propRow.condition || liveCondition;
            if (propRow.damage_notes || propRow.notes) {
              liveNotes = propRow.damage_notes || propRow.notes;
            }
            if (propRow.storage_location) {
              liveLocation = propRow.storage_location;
            }
          } else {
            // Also check inventory_assets
            const { data: assetRow } = await supabase
              .from('inventory_assets')
              .select('physical_condition, damage_notes, storage_location')
              .eq('item_code', uniqueAssetCode)
              .maybeSingle();

            if (assetRow) {
              liveCondition = assetRow.physical_condition || liveCondition;
              if (assetRow.damage_notes) liveNotes = assetRow.damage_notes;
              if (assetRow.storage_location) liveLocation = assetRow.storage_location;
            } else {
              // Fallback query to prop_items by serial_number
              const { data: itemRow } = await supabase
                .from('prop_items')
                .select('condition, notes')
                .eq('serial_number', uniqueAssetCode)
                .maybeSingle();
              if (itemRow) {
                liveCondition = itemRow.condition || liveCondition;
                if (itemRow.notes && !liveNotes) liveNotes = itemRow.notes;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Live condition lookup note:', err);
      }

      if (isMounted) {
        const initialCondition = liveCondition || 'GOOD';
        setSelectedStatus(normalizeCondition(initialCondition));
        setNotes(liveNotes);
        setPhotoUrls(
          currentItem.photo_url
            ? [currentItem.photo_url]
            : currentItem.evidence_photos || []
        );
        setIsFunctional(
          currentItem.is_functional !== undefined ? currentItem.is_functional : true
        );
        const loc = liveLocation;
        setVerifiedRack(loc);
        setIsMisplaced(currentItem.is_misplaced || false);
        setIsRelocating(false);

        if (loc.includes('Floor 2')) setSelectedFloor(2);
        else if (loc.includes('Floor 3')) setSelectedFloor(3);
        else setSelectedFloor(1);

        if (loc.includes('Godown 2')) setSelectedGodown('Godown 2');
        else if (loc.includes('Godown 3')) setSelectedGodown('Godown 3');
        else setSelectedGodown('Godown 1');

        const parts = (loc || '').split('>').map((s: string) => s.trim());
        const rackPart = parts.find((p: string) => p.toUpperCase().includes('RACK'));
        if (rackPart) setSelectedRack(rackPart);
        const bayPart = parts.find((p: string) => p.toUpperCase().includes('BAY') || p.toUpperCase().includes('SHELF'));
        if (bayPart) setSelectedBay(bayPart);
      }
    }

    initializeModalState();

    return () => {
      isMounted = false;
    };
  }, [propItem, isOpen, auditId]);

  if (!isOpen || !propItem) return null;

  const healthChips: {
    id: string;
    label: string;
    badgeColor: string;
    chipActive: string;
    desc: string;
  }[] = [
    {
      id: 'EXCELLENT',
      label: 'EXCELLENT',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      chipActive: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20',
      desc: 'Pristine, ready for cinema set',
    },
    {
      id: 'GOOD',
      label: 'GOOD / NORMAL WEAR',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      chipActive: 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20',
      desc: 'Minor patina, structurally 100%',
    },
    {
      id: 'DAMAGED_NEEDS_REPAIR',
      label: 'DAMAGED / NEEDS REPAIR',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      chipActive: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20',
      desc: 'Requires maintenance flag & armorer',
    },
    {
      id: 'CRITICAL',
      label: 'CRITICAL / SCRAP',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      chipActive: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20',
      desc: 'Severely damaged, unsafe for rent',
    },
    {
      id: 'MISSING',
      label: 'MISSING / MISPLACED',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      chipActive: 'bg-red-700 text-white border-red-700 shadow-md shadow-red-700/20',
      desc: 'Not present in registered rack',
    },
  ];

  // Quick Action: Set Scanned Location as Permanent
  const handleSetScannedAsPermanent = () => {
    const scannedLoc = propItem.current_rack || propItem.expected_rack;
    setIsRelocating(true);
    setIsMisplaced(false);
    setVerifiedRack(scannedLoc);

    if (scannedLoc.includes('Floor 2')) setSelectedFloor(2);
    else if (scannedLoc.includes('Floor 3')) setSelectedFloor(3);
    else setSelectedFloor(1);

    const parts = scannedLoc.split('>').map((s) => s.trim());
    const rackPart = parts.find((p) => p.toUpperCase().includes('RACK'));
    if (rackPart) setSelectedRack(rackPart);
    const bayPart = parts.find((p) => p.toUpperCase().includes('BAY') || p.toUpperCase().includes('SHELF'));
    if (bayPart) setSelectedBay(bayPart);
  };

  // Direct Photo Capture / File Upload to 'audit-evidence' Bucket
  const handlePhotoCapture = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const publicUrl = await inspectionService.uploadAuditPhoto(file);
      setPhotoUrls((prev) => [...prev, publicUrl]);
    } catch (err) {
      console.error('Photo upload error:', err);
      alert('Photo upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Review & Execute Master Sync
  const handleSaveInspection = async () => {
    if (!propItem) return;
    setSaving(true);

    try {
      // 1. Identify the target prop ID & codes
      const propId = propItem.prop_id;
      const serializedItemId = propItem.prop_serialized_item_id;
      const itemCode = propItem.item_code;
      const currentUserId = user?.id || 'staff-admin';

      const godownStr = selectedGodown;
      const floorStr = typeof selectedFloor === 'number' ? `Floor ${selectedFloor}` : selectedFloor;
      const rackStr = selectedRack;
      const shelfStr = selectedBay;
      const previousLocation = propItem.expected_rack || propItem.current_rack || 'Godown 1 > Floor 1 > Rack A-01 > Bay 1';

      // 1. Construct granular and human-readable location structures
      const locationPayload = {
        godown: godownStr,
        floor: floorStr,
        rack: rackStr,
        shelf: shelfStr,
        row_bay: selectedBay || null,
        storage_location: isRelocating
          ? `${godownStr} > ${floorStr} > ${rackStr} > ${shelfStr}`
          : (verifiedRack || previousLocation),
        location_code: `G${godownStr.replace(/\D/g, '') || '1'}-F${String(selectedFloor).replace(/\D/g, '') || '1'}-R${rackStr.replace(/[^a-zA-Z0-9]/g, '') || 'A'}-S${shelfStr.replace(/[^a-zA-Z0-9]/g, '') || '01'}`
      };

      const finalLocation = locationPayload.storage_location;

      // 2. Prepare payload to update the master catalog (properties table)
      // Rule: rental_status MUST strictly track inventory availability. It must NEVER be altered here.
      // Master properties table update strictly updates physical_condition, condition, and location.
      const propertyUpdatePayload: Record<string, any> = {
        godown: locationPayload.godown,
        floor: locationPayload.floor,
        rack: locationPayload.rack,
        shelf: locationPayload.shelf,
        storage_location: locationPayload.storage_location,
        physical_condition: selectedStatus, // e.g., 'DAMAGED'
        condition: selectedStatus,           // sync fallback if both exist
        last_audit_date: new Date().toISOString(),
        last_inspected_by: currentUserId,
        damage_notes: notes.trim() || null,
        notes: notes.trim() || propItem.notes,
        is_functional: isFunctional,
        updated_at: new Date().toISOString(),
      };

      if (isRelocating) {
        propertyUpdatePayload.shelf_bay = locationPayload.shelf;
        propertyUpdatePayload.bin = locationPayload.shelf;
      }

      // 4. Strict Single-Asset Mutation Logic (No Mass Updates)
      // Identify the EXACT scanned physical asset code: targetSerialCode = currentScannedProp.item_code
      // NEVER run updates using model_id, name, category_id, or prop_id.
      const currentScannedProp = propItem;
      const targetSerialCode = currentScannedProp.item_code; // e.g. "ASH-ELEC-MOU-0001"
      const selectedCondition = selectedStatus; // Only updates this unit (e.g. DAMAGED)
      const inspectorNotes = notes.trim() || null;
      const targetItemCode = targetSerialCode;
      const currentUserName = user?.user_metadata?.full_name || profile?.full_name || 'Inspector';

      const newLocation = {
        godown: godownStr,
        floor: floorStr,
        rack: rackStr,
        shelf: shelfStr,
        storage_location: `${godownStr} > ${floorStr} > ${rackStr} > ${shelfStr}`,
      };

      // Step 1: Update ONLY the specific scanned physical unit
      if (targetSerialCode) {
        try {
          const { error } = await supabase
            .from('properties') // physical items table
            .update({
              physical_condition: selectedCondition, // Only updates this unit (e.g. DAMAGED)
              godown: newLocation.godown,
              floor: newLocation.floor,
              rack: newLocation.rack,
              shelf: newLocation.shelf,
              storage_location: `${newLocation.godown} > ${newLocation.floor} > ${newLocation.rack} > ${newLocation.shelf}`,
              last_audit_date: new Date().toISOString(),
              damage_notes: inspectorNotes
            })
            .eq('item_code', targetSerialCode); // MUST TARGET ONLY THIS UNIQUE SERIAL CODE!

          if (error && error.code !== 'PGRST205' && !error.message?.includes('does not exist')) {
            console.warn('properties update by item_code note:', error.message);
          }
        } catch (err) {
          console.warn('properties update note:', err);
        }

        // Also update inventory_assets table if present
        try {
          await supabase
            .from('inventory_assets')
            .update({
              physical_condition: selectedCondition,
              damage_notes: inspectorNotes,
              godown: newLocation.godown,
              floor: newLocation.floor,
              rack: newLocation.rack,
              shelf: newLocation.shelf,
              storage_location: `${newLocation.godown} > ${newLocation.floor} > ${newLocation.rack} > ${newLocation.shelf}`,
              last_audit_date: new Date().toISOString(),
            })
            .eq('item_code', targetSerialCode);
        } catch {
          // optional table
        }

        // Also update prop_items table strictly for this unique serial
        try {
          let itemCond: 'pristine' | 'good' | 'cinematic_distressed' | 'needs_repair' = 'good';
          const condUpper = selectedStatus.toUpperCase();
          if (condUpper.includes('EXCELLENT') || condUpper === 'PERFECT' || condUpper.includes('PRISTINE') || condUpper.includes('BRAND NEW')) {
            itemCond = 'pristine';
          } else if (condUpper.includes('GOOD') || condUpper.includes('NORMAL WEAR')) {
            itemCond = 'good';
          } else if (condUpper.includes('DAMAGED') || condUpper.includes('REPAIR') || condUpper.includes('CRITICAL') || condUpper.includes('SCRAP')) {
            itemCond = 'needs_repair';
          }

          const propItemsPayload: Record<string, any> = {
            condition: itemCond,
            notes: notes.trim() || propItem.notes,
            updated_at: new Date().toISOString(),
          };

          if (isRelocating) {
            propItemsPayload.floor = selectedFloor === 2 ? 2 : 1;
            propItemsPayload.rack = selectedRack;
            propItemsPayload.bin = selectedBay;
          }

          await supabase
            .from('prop_items')
            .update(propItemsPayload)
            .eq('serial_number', targetItemCode);
        } catch (itemErr) {
          console.warn('prop_items update error:', itemErr);
        }
      } else if (serializedItemId) {
        // Fallback strictly to unique serialized item PK
        try {
          await supabase
            .from('properties')
            .update(propertyUpdatePayload)
            .eq('id', serializedItemId);
        } catch (err) {
          console.warn('properties update by id note:', err);
        }
      }

      // 5. Dual-Table writes in Supabase:
      // A) Upsert into audit_inspection_items
      try {
        await supabase.from('audit_inspection_items').upsert(
          {
            audit_id: auditId,
            prop_id: propId,
            item_code: targetItemCode || null,
            prop_serialized_item_id: serializedItemId || null,
            physical_condition: selectedStatus,
            condition: selectedStatus,
            notes: notes.trim() || null,
            evidence_photos: photoUrls,
            inspected_by: currentUserId,
            inspected_at: new Date().toISOString(),
            rack_verified: finalLocation,
            is_functional: isFunctional,
            is_misplaced: isMisplaced && !isRelocating,
          },
          { onConflict: 'audit_id, prop_id' }
        );
      } catch (e) {
        console.warn('audit_inspection_items upsert note:', e);
      }

      // B) Insert into prop_health_history with previous_location and new_location
      const auditHealth: AuditHealthStatus =
        selectedStatus === 'EXCELLENT' || selectedStatus === 'PERFECT'
          ? 'PERFECT'
          : selectedStatus === 'GOOD'
          ? 'PERFECT'
          : selectedStatus === 'DAMAGED_NEEDS_REPAIR' || selectedStatus === 'CRITICAL'
          ? 'MAJOR_DAMAGE'
          : selectedStatus === 'MISSING'
          ? 'MISSING'
          : 'MINOR_DAMAGE';

      try {
        await supabase.from('prop_health_history').insert({
          item_code: targetItemCode || null,
          prop_id: propId,
          audit_id: auditId,
          condition_status: selectedStatus,
          physical_condition: selectedStatus,
          status: auditHealth,
          inspector_id: currentUserId,
          inspected_by: currentUserId,
          inspector_name: currentUserName,
          inspected_by_name: currentUserName,
          notes: notes.trim() || null,
          damage_notes: notes.trim() || null,
          photo_urls: photoUrls,
          evidence_photos: photoUrls,
          previous_location: previousLocation,
          new_location: finalLocation,
          rack_location: finalLocation,
          is_misplaced: isMisplaced && !isRelocating,
          created_at: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('prop_health_history insert note:', e);
      }

      // C) Insert into confirmed live inventory_logs in Supabase
      try {
        await supabase.from('inventory_logs').insert([
          {
            prop_id: propId,
            prop_item_id: serializedItemId || null,
            action: `HEALTH_AUDIT_${selectedStatus.toUpperCase()}`,
            quantity: 1,
            notes: `Condition verified: ${selectedStatus}. Location: ${finalLocation}. ${isRelocating ? `(Relocated from ${previousLocation})` : ''} ${notes.trim() || ''}`.trim(),
            created_by: currentUserId,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (logErr) {
        console.warn('inventory_logs note:', logErr);
      }

      // 6. Dual Logging to Audit Ledger Service
      await inspectionService.logInspectionEntry({
        audit_id: auditId,
        prop_id: propId,
        prop_serialized_item_id: serializedItemId,
        item_code: itemCode,
        scanned_by: currentUserId,
        scanned_by_name: profile?.full_name || 'Warehouse Auditor',
        health_status: auditHealth,
        condition_status: selectedStatus,
        is_functional: isFunctional,
        rack_verified: finalLocation,
        previous_location: previousLocation,
        new_location: finalLocation,
        relocation_applied: isRelocating,
        godown: selectedGodown,
        floor: selectedFloor,
        rack: selectedRack,
        bay: selectedBay,
        is_misplaced: isMisplaced && !isRelocating,
        notes: notes.trim(),
        evidence_photos: photoUrls,
      });

      // 7. Direct Props Catalog & Local State Sync (Strictly preserves rental_status)
      inventoryService.updatePropFromAuditInspection({
        propId,
        propSerializedItemId: serializedItemId,
        itemCode,
        condition: selectedStatus,
        isFunctional,
        locationFullPath: finalLocation,
        locationCode: locationPayload.location_code,
        godown: locationPayload.godown,
        floor: locationPayload.floor,
        rack: locationPayload.rack,
        shelf: locationPayload.shelf,
        bay: selectedBay,
        notes: notes.trim(),
      });

      // 8. Global React Query / TanStack Cache Invalidation
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('props-catalog-updated', {
            detail: {
              propId,
              itemCode,
              condition: selectedStatus,
              location: finalLocation,
              locationCode: locationPayload.location_code,
            },
          })
        );
        window.dispatchEvent(
          new CustomEvent('audit-inspection-updated', {
            detail: {
              propId,
              auditId,
              condition: selectedStatus,
              location: finalLocation,
            },
          })
        );

        const qc = (window as any).queryClient || (window as any).__reactQueryClient;
        if (qc && typeof qc.invalidateQueries === 'function') {
          try {
            qc.invalidateQueries({ queryKey: ['properties'] });
            if (targetItemCode) {
              qc.invalidateQueries({ queryKey: ['prop-health-history', targetItemCode] });
            }
            qc.invalidateQueries({ queryKey: ['prop-details', propId] });
            qc.invalidateQueries({ queryKey: ['prop-health-history', propId] });
            qc.invalidateQueries({ queryKey: ['audit-details', auditId] });
            qc.invalidateQueries({ queryKey: ['props-catalog'] });
          } catch {}
        }
      }

      // 8. Visual confirmation & Audit Checklist update
      const updated: AuditItemChecklistEntry = {
        ...propItem,
        current_rack: finalLocation,
        expected_rack: isRelocating ? finalLocation : propItem.expected_rack,
        is_misplaced: isMisplaced && !isRelocating,
        is_functional: isFunctional,
        condition: selectedStatus as any,
        health_status: auditHealth as any,
        photo_url: photoUrls[0],
        evidence_photos: photoUrls,
        notes: notes.trim(),
        audited: true,
      };

      onSaved(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to save inspection entry:', err);
      alert('Failed to update Props Catalog: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Prop Health Inspection &amp; Review
              </h3>
              <p className="text-[11px] text-slate-500">
                Audit condition grading, operational testing, dynamic relocation &amp; master inventory ledger sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Prop Details Header Card with Status Badge */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden relative shrink-0">
              {propItem.image ? (
                <Image
                  src={propItem.image}
                  alt={propItem.prop_title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-mono font-bold">
                  PROP
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {propItem.item_code}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {propItem.category_name}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 leading-snug">
                {propItem.prop_title}
              </h4>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Registered Location:{' '}
                  <strong className="text-slate-800 font-mono text-[11px]">
                    {propItem.expected_rack}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Location Verification Status Pill */}
          <div className="shrink-0 self-start sm:self-center">
            {isRelocating ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                <span>Relocation Pending</span>
              </span>
            ) : isMisplaced ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Flagged Misplaced</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified at Original Location</span>
              </span>
            )}
          </div>
        </div>

        {/* 2. Health Condition Status Selector (Interactive Chips) */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Health Condition Status *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {healthChips.map((chip) => {
              const isSelected = selectedStatus === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedStatus(chip.id)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? chip.chipActive
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold">{chip.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  </div>
                  <p
                    className={`text-[10px] leading-tight ${
                      isSelected ? 'text-white/90' : 'text-slate-400'
                    }`}
                  >
                    {chip.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Working Condition Toggle (Operational vs Non-Functional) */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Operational / Working Status *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsFunctional(true)}
              className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                isFunctional
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isFunctional ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Operational / Working</span>
                  {isFunctional && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Mechanisms, power, electronics &amp; optics certified 100% active
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsFunctional(false)}
              className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                !isFunctional
                  ? 'bg-rose-50/80 border-rose-300 text-rose-950 ring-2 ring-rose-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  !isFunctional ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <PowerOff className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">
                    Non-Functional / Defective
                  </span>
                  {!isFunctional && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Power failure, mechanical jam, shattered element, or broken switch
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 4. Dynamic Location Update & Relocation Section */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-sky-600" />
              <label className="text-xs font-bold text-slate-800">
                Location Verification &amp; Relocation Management
              </label>
            </div>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={handleSetScannedAsPermanent}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-sky-500" />
              <span>Set Scanned Location as Permanent</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRelocating(!isRelocating)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer ${
                isRelocating
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>
                {isRelocating
                  ? 'Relocation Active'
                  : 'Relocate / Item Found in Different Location'}
              </span>
            </button>

            {!isRelocating && (
              <button
                type="button"
                onClick={() => setIsMisplaced(!isMisplaced)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer ${
                  isMisplaced
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {isMisplaced ? 'Flagged Misplaced from Rack' : 'Flag Misplaced Item'}
                </span>
              </button>
            )}
          </div>

          {/* Relocation Selectors Form */}
          {isRelocating ? (
            <div className="pt-2 border-t border-slate-200 space-y-3 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Godown Selector */}
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Warehouse / Godown
                  </label>
                  <select
                    value={selectedGodown}
                    onChange={(e) => setSelectedGodown(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
                  >
                    <option value="Godown 1">Godown 1 (Heavy Sets &amp; Main Yard)</option>
                    <option value="Godown 2">Godown 2 (Tech, Optics &amp; Sci-Fi)</option>
                    <option value="Godown 3">Godown 3 (Period Props &amp; Curios)</option>
                  </select>
                </div>

                {/* Floor Selector */}
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Floor Level
                  </label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => setSelectedFloor(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer shadow-2xs"
                  >
                    <option value={1}>Floor 1 (Ground Deck)</option>
                    <option value={2}>Floor 2 (Mezzanine Hub)</option>
                    <option value={3}>Floor 3 (High Vault)</option>
                  </select>
                </div>

                {/* Rack & Bay Input */}
                <div>
                  <label className="font-bold text-slate-600 block mb-1">
                    Rack / Shelf / Bay
                  </label>
                  <input
                    type="text"
                    value={selectedRack}
                    onChange={(e) => setSelectedRack(e.target.value)}
                    placeholder="e.g. Rack A-01"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Bay / Shelf specific input */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-500">Bay / Slot:</span>
                <input
                  type="text"
                  value={selectedBay}
                  onChange={(e) => setSelectedBay(e.target.value)}
                  placeholder="e.g. Bay 1, Armory Bay 3, Shelf 02"
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono font-semibold focus:outline-none focus:border-sky-500 flex-1 shadow-2xs"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  New Storage Location:{' '}
                  <strong className="font-mono text-sky-800">
                    {selectedGodown} &gt; Floor {selectedFloor} &gt; {selectedRack} &gt;{' '}
                    {selectedBay}
                  </strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="font-bold text-slate-600">Verified Location:</span>
              <input
                type="text"
                value={verifiedRack}
                onChange={(e) => setVerifiedRack(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-sky-500 shadow-2xs"
              />
            </div>
          )}
        </div>

        {/* 5. Evidence Photo Attachment (Supabase Storage 'audit-evidence') */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Evidence Photos ({photoUrls.length} attached)
            </label>
            <span className="text-[11px] text-slate-400">
              Pushed to Supabase Storage: bucket <strong>audit-evidence</strong>
            </span>
          </div>

          {/* Upload Button */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>
                {uploadingPhoto ? 'Uploading to Supabase...' : 'Capture / Attach Evidence Photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handlePhotoCapture(e.target.files[0]);
                  }
                }}
              />
            </label>

            {uploadingPhoto && (
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                <span>Storing in bucket...</span>
              </span>
            )}
          </div>

          {/* Previews with Delete Action */}
          {photoUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {photoUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square"
                >
                  <Image
                    src={url}
                    alt={`Evidence ${idx + 1}`}
                    fill
                    className="object-cover cursor-pointer"
                    onClick={() => setEnlargedPhoto(url)}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-slate-900/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.2 rounded text-[9px] text-white font-mono">
                    Photo #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Inspector Observations & Detailed Damage Remarks */}
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Inspector Damage Remarks &amp; Observations
          </label>
          <textarea
            rows={3}
            placeholder="Detail physical wear, structural integrity, optical/electrical tests performed, or reason for relocation..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveInspection}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>Save Inspection Record</span>
          </button>
        </div>
      </div>

      {/* Enlarged Photo Modal */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer animate-in fade-in"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-[70vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
            <Image
              src={enlargedPhoto}
              alt="Audit evidence enlarged"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setEnlargedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
