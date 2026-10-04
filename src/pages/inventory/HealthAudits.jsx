'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  ClipboardCheck,
  ShieldCheck,
  Plus,
  QrCode,
  Search,
  MapPin,
  Calendar,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  Camera,
  Layers,
  Sparkles,
  Info,
  X,
  ExternalLink,
  Check,
  SlidersHorizontal,
  Clock,
  Edit3,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { inspectionService } from '@/lib/services/inspectionService';
import { inventoryService, formatHumanLocation } from '@/lib/services/inventory';
import { useAuth } from '@/context/AuthContext';
import { PropInspectionModal, CONDITION_OPTIONS } from './PropInspectionModal';
import { LiveCameraScannerModal, extractItemCode } from './LiveCameraScannerModal';

export function HealthAudits() {
  const { user, profile } = useAuth();

  // Navigation & Active Session States
  const [view, setView] = useState('list'); // 'list' | 'execution'
  const [activeAudit, setActiveAudit] = useState(null);

  // Audits & Inspector Data
  const [audits, setAudits] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(true);
  const [registeredInspectors, setRegisteredInspectors] = useState([]);
  const [loadingInspectors, setLoadingInspectors] = useState(false);

  // Workflow 1: "Create New Inspection" Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('Weekly Inspection - Godown 1');
  const [godownScope, setGodownScope] = useState('Godown 1');
  const [floorScope, setFloorScope] = useState('Floor 1');
  const [selectedInspectorIds, setSelectedInspectorIds] = useState([]);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);

  // Workflow 2: Execution & Single-Asset Scanning State
  const [scannedInput, setScannedInput] = useState('');
  const [isSearchingProp, setIsSearchingProp] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedPropForInspection, setSelectedPropForInspection] = useState(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Persistent Session Inspected Props State
  const [sessionInspectedItems, setSessionInspectedItems] = useState([]);
  const [isLoadingSessionItems, setIsLoadingSessionItems] = useState(false);
  const [displayLayout, setDisplayLayout] = useState('cards'); // 'cards' | 'table'

  // Filter state for Audits list
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'IN_PROGRESS' | 'SCHEDULED' | 'COMPLETED'

  const manualInputRef = useRef(null);

  // Floating Toast Notification state and controller
  const [toastNotification, setToastNotification] = useState(null); // { type: 'error' | 'success', message: string }
  const toastTimeoutRef = useRef(null);

  const toast = useMemo(
    () => ({
      error: (msg) => {
        console.error('[Toast Error]', msg);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastNotification({ type: 'error', message: msg });
        toastTimeoutRef.current = setTimeout(() => setToastNotification(null), 5000);
      },
      success: (msg) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastNotification({ type: 'success', message: msg });
        toastTimeoutRef.current = setTimeout(() => setToastNotification(null), 4000);
      },
    }),
    []
  );

  // Load Audits from Supabase & Service
  const loadAudits = useCallback(async () => {
    setLoadingAudits(true);
    try {
      const data = await inspectionService.getWarehouseAudits();
      setAudits(data);
    } catch (err) {
      console.warn('Error fetching warehouse audits:', err);
    } finally {
      setLoadingAudits(false);
    }
  }, []);

  // Load Registered Inspectors (Profiles with Crew Member, Rental Sales Executive, Admin)
  const loadInspectors = useCallback(async () => {
    setLoadingInspectors(true);
    try {
      const inspectors = await inspectionService.getActiveInspectors();
      setRegisteredInspectors(inspectors);
      if (inspectors.length > 0 && selectedInspectorIds.length === 0) {
        setSelectedInspectorIds([inspectors[0].id]);
      }
    } catch (err) {
      console.warn('Error fetching active inspectors:', err);
    } finally {
      setLoadingInspectors(false);
    }
  }, [selectedInspectorIds.length]);

  // Load Persistent Session Inspected Items from Supabase (Joined with properties)
  const fetchSessionInspectedProps = useCallback(async (currentAuditId) => {
    if (!currentAuditId) return;
    setIsLoadingSessionItems(true);

    try {
      // 1. Primary Query: audit_inspection_items with properties relationship
      const { data: inspectedList, error } = await supabase
        .from('audit_inspection_items')
        .select(`
          id,
          item_code,
          physical_condition,
          notes,
          evidence_photos,
          scanned_at,
          properties (
            id,
            name,
            image_url,
            storage_location,
            godown,
            floor,
            rack,
            shelf
          )
        `)
        .eq('audit_id', currentAuditId)
        .order('scanned_at', { ascending: false });

      if (!error && inspectedList && inspectedList.length > 0) {
        const formatted = inspectedList.map((row) => ({
          id: row.id,
          item_code: row.item_code,
          physical_condition: row.physical_condition || 'GOOD',
          notes: row.notes,
          evidence_photos: row.evidence_photos || [],
          scanned_at: row.scanned_at,
          prop_name: row.properties?.name || row.properties?.title || 'Cinematic Asset',
          storage_location: row.properties?.storage_location || 'Godown 1 > Floor 1 > Rack A > Shelf 01',
          image_url: row.properties?.image_url,
          existing_inspection_id: row.id,
          properties: row.properties,
        }));
        setSessionInspectedItems(formatted);
        return;
      }

      // 2. Fallback Query: Query audit_inspection_items & prop_health_history directly
      const { data: rawItems } = await supabase
        .from('audit_inspection_items')
        .select('*')
        .eq('audit_id', currentAuditId)
        .order('scanned_at', { ascending: false });

      const { data: histItems } = await supabase
        .from('prop_health_history')
        .select('*')
        .eq('audit_id', currentAuditId)
        .order('created_at', { ascending: false });

      const combinedMap = new Map();

      (rawItems || []).forEach((row) => {
        combinedMap.set(row.item_code, {
          id: row.id,
          item_code: row.item_code,
          physical_condition: row.physical_condition || (row.health_status === 'PERFECT' ? 'GOOD' : row.health_status) || 'GOOD',
          notes: row.notes,
          evidence_photos: row.evidence_photos || [],
          scanned_at: row.scanned_at || row.created_at,
          storage_location: row.rack_verified,
          existing_inspection_id: row.id,
        });
      });

      (histItems || []).forEach((row) => {
        if (!combinedMap.has(row.item_code)) {
          combinedMap.set(row.item_code, {
            id: row.id,
            item_code: row.item_code,
            physical_condition: row.physical_condition || row.condition_status || 'GOOD',
            notes: row.notes || row.damage_notes,
            evidence_photos: row.evidence_photos || row.photo_urls || [],
            scanned_at: row.created_at || row.timestamp,
            storage_location: row.new_location || row.previous_location,
            existing_inspection_id: row.id,
          });
        }
      });

      if (combinedMap.size > 0) {
        const allItemCodes = Array.from(combinedMap.keys()).filter(Boolean);
        const { data: propRows } = await supabase
          .from('properties')
          .select('*')
          .in('item_code', allItemCodes);

        const propMap = new Map((propRows || []).map((p) => [p.item_code, p]));

        const resolved = Array.from(combinedMap.values()).map((entry) => {
          const p = propMap.get(entry.item_code);
          return {
            ...entry,
            prop_name: p?.name || p?.title || 'Cinematic Asset',
            storage_location: entry.storage_location || p?.storage_location || 'Godown 1 > Floor 1 > Rack A > Shelf 01',
            image_url: p?.image_url,
            properties: p,
          };
        });
        setSessionInspectedItems(resolved);
        return;
      }

      // 3. Fallback to inspectionService cached items
      const cached = await inspectionService.getInspectionItems(currentAuditId);
      if (cached && cached.length > 0) {
        setSessionInspectedItems(
          cached.map((si) => ({
            id: si.id,
            item_code: si.item_code || si.prop_id,
            physical_condition: (si.physical_condition || si.condition || si.health_status || 'GOOD').toString(),
            notes: si.notes,
            evidence_photos: si.evidence_photos || [],
            scanned_at: si.scanned_at || new Date().toISOString(),
            prop_name: si.prop_name || 'Cinematic Prop',
            storage_location: si.rack_verified || 'Godown 1 > Floor 1 > Rack A',
            image_url: si.photo_url,
            existing_inspection_id: si.id,
          }))
        );
      } else {
        setSessionInspectedItems([]);
      }
    } catch (err) {
      console.warn('Error fetching session inspected items:', err);
    } finally {
      setIsLoadingSessionItems(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAudits();
    loadInspectors();

    // Restore active session on mount if present
    try {
      const savedAuditId = typeof window !== 'undefined' ? sessionStorage.getItem('ashwa_active_audit_id') : null;
      if (savedAuditId && !activeAudit) {
        inspectionService.getWarehouseAudits().then((list) => {
          const match = list.find((a) => a.id === savedAuditId);
          if (match) {
            setActiveAudit(match);
            setView('execution');
            fetchSessionInspectedProps(match.id);
          }
        });
      }
    } catch {}
  }, [loadAudits, loadInspectors, fetchSessionInspectedProps]);

  // Handle Workflow 1: Create New Inspection Submit
  const handleCreateInspection = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter an inspection title.');
      return;
    }
    if (selectedInspectorIds.length === 0) {
      alert('Please assign at least one inspector.');
      return;
    }

    setIsSubmittingAudit(true);
    try {
      const currentUserId = user?.id || 'staff-admin';

      const newAudit = await inspectionService.createWarehouseAudit({
        title: newTitle.trim(),
        audit_type: 'WEEKLY',
        floor_level: floorScope,
        rack_range: `${godownScope} • ${floorScope}`,
        scheduled_date: scheduledDate,
        notes: newNotes.trim(),
        created_by: currentUserId,
        assignee_ids: selectedInspectorIds,
      });

      setIsCreateModalOpen(false);
      await loadAudits();

      setNewTitle(`Routine Inspection - ${godownScope}`);
      setNewNotes('');

      if (confirm(`Inspection "${newAudit.title}" created successfully! Would you like to launch execution now?`)) {
        startExecution(newAudit);
      }
    } catch (err) {
      console.error('Failed to create inspection:', err);
      alert('Failed to create inspection. Please check database connection.');
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  // Launch Audit Execution Screen
  const startExecution = (audit) => {
    setActiveAudit(audit);
    setView('execution');
    setScannedInput('');
    setSearchError('');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ashwa_active_audit_id', audit.id);
    }
    fetchSessionInspectedProps(audit.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exit Execution Screen
  const exitExecution = () => {
    setView('list');
    setActiveAudit(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ashwa_active_audit_id');
    }
  };

  // Toggle Inspector multi-select
  const toggleInspector = (id) => {
    setSelectedInspectorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Workflow 2: Scan / Look Up Physical Asset Code with robust sanitization & multi-field matching
  const lookupProp = async (scannedCode) => {
    const cleanCode = extractItemCode(scannedCode || scannedInput);
    if (!cleanCode) {
      const emptyMsg = 'Please enter or scan a valid asset code.';
      setSearchError(emptyMsg);
      toast.error(emptyMsg);
      return;
    }

    console.log('Searching property for code:', cleanCode);
    setIsSearchingProp(true);
    setSearchError('');

    try {
      let prop = null;
      let dbError = null;

      // Check if cleanCode matches UUID pattern
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCode);

      // 1. Primary Query: Supabase properties matching item_code, serial_number, or id
      try {
        const orClause = isUuid
          ? `item_code.ilike.${cleanCode},serial_number.ilike.${cleanCode},id.eq.${cleanCode}`
          : `item_code.ilike.${cleanCode},serial_number.ilike.${cleanCode}`;

        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .or(orClause)
          .maybeSingle();

        if (data && !error) {
          prop = data;
        } else if (error && error.code !== 'PGRST205' && !error.message?.includes('does not exist')) {
          console.warn('Supabase properties query note:', error.message);
          dbError = error;
        }
      } catch (err) {
        console.warn('Properties table query exception:', err);
      }

      // 1b. Fallback on properties with ilike item_code directly
      if (!prop) {
        try {
          const { data } = await supabase
            .from('properties')
            .select('*')
            .ilike('item_code', cleanCode)
            .maybeSingle();
          if (data) prop = data;
        } catch {}
      }

      // 2. Fallback: Query Supabase prop_items joined with props
      if (!prop) {
        try {
          const { data: propItem } = await supabase
            .from('prop_items')
            .select('*, props(*)')
            .or(`serial_number.ilike.${cleanCode}`)
            .maybeSingle();

          if (propItem) {
            prop = {
              id: propItem.id,
              item_code: propItem.serial_number,
              serial_number: propItem.serial_number,
              name: propItem.props?.title || propItem.props?.name || 'Cinematic Asset',
              title: propItem.props?.title || propItem.props?.name || 'Cinematic Asset',
              physical_condition: (propItem.condition || 'GOOD').toUpperCase(),
              godown: 'Godown 1',
              floor: propItem.floor ? `Floor ${propItem.floor}` : 'Floor 1',
              rack: propItem.rack || 'Rack A',
              shelf: propItem.bin || 'Shelf 01',
              storage_location: `Godown 1 > Floor ${propItem.floor || 1} > ${propItem.rack || 'Rack A'} > ${propItem.bin || 'Shelf 01'}`,
              image_url: propItem.props?.images?.[0],
              properties: propItem,
            };
          }
        } catch {}
      }

      // 3. Fallback: Lookup in local inventoryService serialized items (e.g. ASH-ELEC-MOU-0005)
      if (!prop) {
        const localItems = await inventoryService.getSerializedItems();
        const localMatch = localItems.find(
          (i) =>
            (i.item_code && i.item_code.toUpperCase() === cleanCode.toUpperCase()) ||
            (i.serial_number && i.serial_number.toUpperCase() === cleanCode.toUpperCase()) ||
            (i.id && i.id.toUpperCase() === cleanCode.toUpperCase()) ||
            (i.prop_id && i.prop_id.toUpperCase() === cleanCode.toUpperCase())
        );

        if (localMatch) {
          prop = {
            id: localMatch.id,
            item_code: localMatch.item_code,
            serial_number: localMatch.item_code,
            name: localMatch.prop?.name || 'Cinematic Asset',
            title: localMatch.prop?.name || 'Cinematic Asset',
            physical_condition: (localMatch.physical_condition || localMatch.condition || 'GOOD').toUpperCase(),
            godown: localMatch.godown || 'Godown 1',
            floor: localMatch.floor || 'Floor 1',
            rack: localMatch.rack || 'Rack A',
            shelf: localMatch.shelf || 'Shelf 01',
            storage_location: localMatch.storage_location || 'Godown 1 > Floor 1 > Rack A > Shelf 01',
            image_url: localMatch.prop?.images?.[0],
          };
        }
      }

      if (!prop) {
        const notFoundMsg = `Asset with code "${cleanCode}" was not found in property catalog.`;
        setSearchError(notFoundMsg);
        toast.error(notFoundMsg);
        return;
      }

      // Successfully found prop -> Open inspection modal
      setSelectedPropForInspection(prop);
      setIsInspectionModalOpen(true);
      setIsCameraScannerOpen(false); // Close camera
      setScannedInput('');
      toast.success(`Asset "${prop.name || prop.title || cleanCode}" (${cleanCode}) found!`);
    } catch (err) {
      console.error('Supabase query error:', err);
      const errMsg = 'Database error while fetching asset: ' + (err.message || 'Unknown error');
      setSearchError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSearchingProp(false);
    }
  };

  // Alias for compatibility
  const handleScanProp = lookupProp;

  // Re-Inspect Action: Re-opens inspection modal pre-filled with logged condition, notes & photos
  const handleReInspect = async (item) => {
    let liveProp = null;
    try {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('item_code', item.item_code)
        .single();
      if (data) liveProp = data;
    } catch {}

    const propData = {
      ...(liveProp || item.properties || {}),
      item_code: item.item_code,
      name: liveProp?.name || liveProp?.title || item.prop_name || 'Cinematic Asset',
      title: liveProp?.name || liveProp?.title || item.prop_name || 'Cinematic Asset',
      physical_condition: item.physical_condition,
      condition: item.physical_condition,
      notes: item.notes || liveProp?.damage_notes || '',
      damage_notes: item.notes || liveProp?.damage_notes || '',
      evidence_photos: item.evidence_photos || [],
      photo_urls: item.evidence_photos || [],
      godown: liveProp?.godown || 'Godown 1',
      floor: liveProp?.floor || 'Floor 1',
      rack: liveProp?.rack || 'Rack A',
      shelf: liveProp?.shelf || 'Shelf 01',
      storage_location: item.storage_location || liveProp?.storage_location,
      existing_inspection_id: item.id || item.existing_inspection_id,
      is_reinspecting: true,
    };

    setSelectedPropForInspection(propData);
    setIsInspectionModalOpen(true);
  };

  // Camera Live QR decoded handler
  const handleCameraScanSuccess = async (decodedCode) => {
    setIsCameraScannerOpen(false);
    await handleScanProp(decodedCode);
  };

  // Fallback if camera is unavailable
  const handleCameraManualFallback = () => {
    setIsCameraScannerOpen(false);
    setTimeout(() => {
      manualInputRef.current?.focus();
    }, 150);
  };

  // When an inspection is saved in modal
  const handleInspectionSaved = (result) => {
    if (activeAudit?.id) {
      fetchSessionInspectedProps(activeAudit.id);
    }
    loadAudits();
  };

  // Filtered audits
  const filteredAudits = audits.filter((audit) => {
    if (statusFilter === 'ALL') return true;
    return (audit.status || '').toUpperCase() === statusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER                                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20 shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Property Health &amp; Warehouse Audits
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
                <ShieldCheck className="w-3 h-3 text-sky-600" /> Enterprise QC
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Serialized asset inspection, physical condition verification, and warehouse rack audit workflows.
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          {view === 'execution' ? (
            <>
              <button
                onClick={() => setIsCameraScannerOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera className="w-4 h-4 text-sky-200 animate-pulse" />
                <span>Scan Prop QR</span>
              </button>
              <button
                onClick={exitExecution}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Audits List</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Inspection</span>
            </button>
          )}

          <button
            onClick={() => {
              loadAudits();
              if (activeAudit?.id) fetchSessionInspectedProps(activeAudit.id);
            }}
            title="Refresh Audits"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAudits || isLoadingSessionItems ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VIEW MODE: AUDITS OVERVIEW LIST                                        */}
      {/* ========================================================================= */}
      {view === 'list' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Inspections
              </span>
              <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">
                {audits.length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                In Progress
              </span>
              <span className="text-xl font-bold text-sky-900 font-mono mt-1 block">
                {audits.filter((a) => a.status === 'IN_PROGRESS').length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Scheduled
              </span>
              <span className="text-xl font-bold text-amber-900 font-mono mt-1 block">
                {audits.filter((a) => a.status === 'SCHEDULED').length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Completed
              </span>
              <span className="text-xl font-bold text-emerald-900 font-mono mt-1 block">
                {audits.filter((a) => a.status === 'COMPLETED').length}
              </span>
            </div>
          </div>

          {/* Filter Segmented Control */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 border border-slate-200 w-fit">
              {['ALL', 'IN_PROGRESS', 'SCHEDULED', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL'
                    ? 'All Audits'
                    : st === 'IN_PROGRESS'
                    ? 'In Progress'
                    : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              Showing <strong className="text-slate-800">{filteredAudits.length}</strong> audits
            </div>
          </div>

          {/* Audits Grid / Cards */}
          {loadingAudits ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
              Loading warehouse audits from Supabase...
            </div>
          ) : filteredAudits.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/80 p-8 sm:p-12 text-center shadow-xs">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-inner">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">
                    No Audits Found
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    There are no warehouse audits matching your filter. Click below to initiate a new warehouse inspection session.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 inline-flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Inspection</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAudits.map((audit) => {
                const total = audit.total_items_count || 5;
                const done = audit.audited_items_count || 0;
                const progressPct = Math.min(100, Math.round((done / total) * 100));

                const assigneesList = audit.assignees && audit.assignees.length > 0
                  ? audit.assignees
                  : [{ user_name: audit.assigned_to_name || 'Inspector' }];

                return (
                  <div
                    key={audit.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    {/* Top row: Code & Status */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {audit.audit_code || audit.task_number || 'AUD-2026'}
                        </span>

                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            audit.status === 'IN_PROGRESS'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : audit.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {(audit.status || 'SCHEDULED').replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Audit Title */}
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1">
                        {audit.title}
                      </h3>

                      {/* Scope & Date */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          <span>{audit.rack_range || audit.floor_level || 'Warehouse Floor'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{audit.scheduled_date || 'Today'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Middle: Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600">Inspection Progress</span>
                        <span className="font-mono font-bold text-slate-900">
                          {done} / {total} Props ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom: Assignees & Launch Button */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px]">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-xs text-slate-600 font-medium truncate max-w-[130px]">
                          {assigneesList.map((a) => a.user_name).join(', ')}
                        </span>
                      </div>

                      <button
                        onClick={() => startExecution(audit)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                      >
                        <span>Launch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW MODE: ACTIVE AUDIT EXECUTION (WORKFLOW 2)                         */}
      {/* ========================================================================= */}
      {view === 'execution' && activeAudit && (
        <div className="space-y-6 animate-fade-in">
          {/* Active Audit Banner */}
          <div className="rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-white p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-md">
                    {activeAudit.audit_code || 'AUD-ACTIVE'}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    Active Inspection Session
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {activeAudit.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <strong>Scope:</strong> {activeAudit.rack_range || activeAudit.floor_level}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <strong>Inspectors:</strong> {activeAudit.assignees?.map((a) => a.user_name).join(', ') || 'Assigned Staff'}
                  </span>
                </div>
              </div>

              {/* Progress counter pill (Synced directly with database) */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center min-w-[150px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Session Inspected
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono block mt-0.5">
                  {sessionInspectedItems.length} Props
                </span>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Logged to Audit Trail
                </span>
              </div>
            </div>
          </div>

          {/* PROMINENT SCAN PROP QR CARD (Live Camera Trigger & Manual Input) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Scan Physical Prop Barcode / QR Tag
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Hold QR sticker in camera viewfinder, or enter unique <code className="font-mono text-sky-700 bg-sky-50 px-1 py-0.5 rounded">item_code</code> to inspect condition or relocate shelf.
                </p>
              </div>

              {/* Live Camera Scanner Trigger Button */}
              <button
                onClick={() => setIsCameraScannerOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Camera className="w-4 h-4 text-sky-200 animate-pulse" />
                <span>Scan Prop QR</span>
              </button>
            </div>

            {/* Quick Barcode Scanner / Text Input Field */}
            <div className="space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleScanProp();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={manualInputRef}
                    type="text"
                    value={scannedInput}
                    onChange={(e) => {
                      setScannedInput(e.target.value);
                      setSearchError('');
                    }}
                    placeholder="Scan barcode, enter SKU, or paste QR JSON (e.g. ASH-ELEC-MOU-0005)"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearchingProp || !scannedInput.trim()}
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSearchingProp ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  <span>Inspect Prop</span>
                </button>
              </form>

              {/* Error Message if any */}
              {searchError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Instant Test Quick-Pills for Fast Scanning */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Scan Assets:
                </span>
                {[
                  { code: 'ASH-ELEC-MOU-0005', label: 'Mouse #5' },
                  { code: '{"itemCode":"ASH-ELEC-MOU-0005"}', label: 'JSON: Mouse #5' },
                  { code: 'https://ashwa.app/props/ASH-ELEC-MOU-0005', label: 'URL: Mouse #5' },
                  { code: 'ASH-ELEC-MOU-0001', label: 'Mouse #1' },
                  { code: 'ASH-FURN-THR-0001', label: 'Royal Throne' },
                  { code: 'ASH-CAM-LEN-0001', label: 'Cinema Lens' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setScannedInput(item.code);
                      lookupProp(item.code);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3 h-3 text-sky-600" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PERSISTENT "SESSION INSPECTED PROPS" & RE-INSPECTION SECTION              */}
          {/* ========================================================================= */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Session Inspected Props ({sessionInspectedItems.length})
                  </h3>
                  {sessionInspectedItems.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Real-time Synced
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Persistent physical asset evaluations and relocations logged for this audit task.
                </p>
              </div>

              {/* View Layout Switcher (Cards vs Table) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDisplayLayout('cards')}
                    title="Card Grid View"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      displayLayout === 'cards'
                        ? 'bg-white text-sky-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayLayout('table')}
                    title="Dense Table View"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      displayLayout === 'table'
                        ? 'bg-white text-sky-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => fetchSessionInspectedProps(activeAudit.id)}
                  title="Reload Session Records from Supabase"
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessionItems ? 'animate-spin text-sky-600' : ''}`} />
                </button>
              </div>
            </div>

            {isLoadingSessionItems ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
                Querying persistent session inspection records from Supabase...
              </div>
            ) : sessionInspectedItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2 bg-slate-50/50 rounded-2xl border border-slate-200/60">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700 text-sm">No Props Inspected Yet In This Session (0 Props Logged)</p>
                <p className="text-[11px] max-w-sm mx-auto text-slate-400">
                  Scan a QR tag or type an asset code above to record condition verification, damage remarks, evidence photos, or warehouse relocations.
                </p>
              </div>
            ) : displayLayout === 'cards' ? (
              /* DYNAMIC INSPECTED CARDS GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {sessionInspectedItems.map((item, idx) => {
                  const condOpt = CONDITION_OPTIONS.find((c) => c.id === (item.physical_condition || '').toUpperCase());
                  const photoList = item.evidence_photos || [];
                  const timeVal = item.scanned_at ? new Date(item.scanned_at) : new Date();

                  return (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                    >
                      {/* Header: Thumbnail + Title + Serial */}
                      <div className="flex items-start gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-2xs">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.prop_name || 'Prop'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                              <Layers className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-700 transition-colors">
                            {item.prop_name || 'Cinematic Asset'}
                          </h4>
                          <span className="font-mono text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md inline-block mt-0.5">
                            {item.item_code}
                          </span>
                        </div>
                      </div>

                      {/* Condition & Verified Location */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-200/60 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Verdict</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              condOpt ? condOpt.badgeClass : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.physical_condition}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate font-medium text-[11px]">
                            {formatHumanLocation(item.storage_location)}
                          </span>
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-100 line-clamp-2">
                            &quot;{item.notes}&quot;
                          </p>
                        )}
                      </div>

                      {/* Footer: Timestamp, Photos & Re-Inspect Action */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {timeVal.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {photoList.length > 0 && (
                            <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              <Camera className="w-3 h-3" /> {photoList.length}
                            </span>
                          )}
                        </div>

                        {/* RE-INSPECT / EDIT VERDICT BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleReInspect(item)}
                          className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Re-Inspect</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* DENSE TABLE VIEW */
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Serial Number</th>
                      <th className="py-3 px-4">Prop Name</th>
                      <th className="py-3 px-4">Condition</th>
                      <th className="py-3 px-4">Verified Storage Location</th>
                      <th className="py-3 px-4">Damage Remarks</th>
                      <th className="py-3 px-4 text-center">Photos</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessionInspectedItems.map((item, idx) => {
                      const condOpt = CONDITION_OPTIONS.find((c) => c.id === (item.physical_condition || '').toUpperCase());
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              {item.item_code}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {item.prop_name || 'Cinematic Asset'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                condOpt ? condOpt.badgeClass : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.physical_condition}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{formatHumanLocation(item.storage_location)}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                            {item.notes || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.evidence_photos?.length > 0 ? (
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 text-[11px]">
                                <Camera className="w-3 h-3" /> {item.evidence_photos.length}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleReInspect(item)}
                              className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Re-Inspect</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. WORKFLOW 1: "CREATE NEW INSPECTION" MODAL (ADMIN VIEW)                 */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-hidden animate-fade-in">
          <div className="fixed inset-0" onClick={() => setIsCreateModalOpen(false)} />

          <div className="relative w-full max-w-xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Create New Inspection
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Warehouse Audit Configuration • Admin Console
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateInspection} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Inspection Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Inspection Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Weekly Inspection - Godown 1"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>

              {/* Warehouse Scope & Floor Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Warehouse Scope */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Warehouse Scope <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={godownScope}
                    onChange={(e) => setGodownScope(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Godown 1">Godown 1</option>
                    <option value="Godown 2">Godown 2</option>
                    <option value="Godown 3">Godown 3</option>
                    <option value="All Godowns">All Godowns</option>
                  </select>
                </div>

                {/* Floor Scope */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Floor Scope <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={floorScope}
                    onChange={(e) => setFloorScope(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Floor 1">Floor 1</option>
                    <option value="Floor 2">Floor 2</option>
                    <option value="Floor 3">Floor 3</option>
                    <option value="All Floors">All Floors</option>
                  </select>
                </div>
              </div>

              {/* Scheduled Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Scheduled Inspection Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>

              {/* Assign Inspector (Multi-Select Dropdown from registered users) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Assign Inspector(s) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {selectedInspectorIds.length} selected
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50 p-1">
                  {loadingInspectors ? (
                    <div className="py-4 text-center text-slate-400 text-xs">
                      Loading registered staff from Supabase...
                    </div>
                  ) : registeredInspectors.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 text-xs">
                      No registered inspectors found.
                    </div>
                  ) : (
                    registeredInspectors.map((inspector) => {
                      const isSelected = selectedInspectorIds.includes(inspector.id);
                      return (
                        <div
                          key={inspector.id}
                          onClick={() => toggleInspector(inspector.id)}
                          className={`p-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected ? 'bg-sky-50/80 text-sky-950 font-bold' : 'hover:bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                isSelected ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {inspector.name.charAt(0)}
                            </div>
                            <div>
                              <span className="block text-xs leading-tight">
                                {inspector.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {inspector.role || 'Inspector'} • {inspector.email || 'Staff'}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Special Instructions / Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Audit Notes &amp; Inspector Guidance
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Inspect optical sensors, structural hinges, and verify shelf QR tags..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white resize-none"
                />
              </div>

              {/* Submit Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingAudit}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingAudit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Inspection...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Schedule Inspection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WORKFLOW 2: PROP HEALTH INSPECTION MODAL (SINGLE-ASSET MUTATION)        */}
      {/* ========================================================================= */}
      <PropInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedPropForInspection(null);
        }}
        prop={selectedPropForInspection}
        activeAuditId={activeAudit?.id || 'audit-adhoc'}
        onSaved={handleInspectionSaved}
      />

      {/* ========================================================================= */}
      {/* 6. LIVE CAMERA SCANNER MODAL                                              */}
      {/* ========================================================================= */}
      <LiveCameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
        onManualFallback={handleCameraManualFallback}
      />

      {/* ========================================================================= */}
      {/* 7. FLOATING TOAST NOTIFICATION                                            */}
      {/* ========================================================================= */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-fade-in shadow-2xl">
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 backdrop-blur-md ${
              toastNotification.type === 'error'
                ? 'bg-rose-950/95 text-rose-100 border-rose-500/60 shadow-rose-950/50'
                : 'bg-emerald-950/95 text-emerald-100 border-emerald-500/60 shadow-emerald-950/50'
            }`}
          >
            {toastNotification.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toastNotification.message}
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthAudits;
