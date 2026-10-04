'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ClipboardCheck,
  Search,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Camera,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X,
  Upload,
  FileText,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { inspectionService } from '@/lib/services/inspectionService';
import { WarehouseAudit, AuditItemChecklistEntry } from '@/types/audits';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

export function InspectionsList() {
  const { user, profile } = useAuth();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Single-Asset Inspection Modal State
  const [targetCode, setTargetCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedProp, setScannedProp] = useState(null);
  const [physicalCondition, setPhysicalCondition] = useState('EXCELLENT');
  const [remarks, setRemarks] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const executiveName = profile?.full_name || 'Ravi Kumar (Sales Executive)';

  const loadAudits = async () => {
    try {
      setLoading(true);
      const metrics = await inspectionService.getAuditOverviewMetrics();
      const allAudits = metrics.activeAudits || [];
      setAudits(allAudits);
    } catch (err) {
      console.error('Failed to load audits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudits();
  }, []);

  const handleScanCode = async (codeToLookup) => {
    const raw = (codeToLookup || targetCode).trim();
    if (!raw) return;

    setScanning(true);
    setErrorMessage(null);
    setScannedProp(null);

    try {
      const result = await inspectionService.scanPropByCode(raw);
      if (!result) {
        setErrorMessage(`Asset '${raw}' was not found in warehouse property registry.`);
        return;
      }
      setScannedProp(result);
      setPhysicalCondition(result.currentCondition || 'EXCELLENT');
    } catch (err) {
      console.error('Scan error:', err);
      setErrorMessage('Failed to query prop health records.');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmitInspection = async () => {
    if (!scannedProp || !selectedAudit) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await inspectionService.logInspectionEntry({
        auditId: selectedAudit.id,
        propId: scannedProp.propId,
        itemCode: scannedProp.itemCode,
        healthStatus:
          physicalCondition === 'EXCELLENT'
            ? 'EXCELLENT'
            : physicalCondition === 'GOOD'
            ? 'GOOD'
            : 'DAMAGED',
        inspectionNotes: remarks || `Routine bay verification by ${executiveName}`,
        evidencePhotoUrl: photoUrl || undefined,
        inspectorUserId: user?.id,
        inspectorName: executiveName,
      });

      setToastMessage(`Logged inspection for ${scannedProp.itemCode} successfully!`);
      setTimeout(() => setToastMessage(null), 4000);

      // Close modal and reset state
      setScannerOpen(false);
      setScannedProp(null);
      setTargetCode('');
      setRemarks('');
      setPhotoUrl('');

      // Reload audits overview
      await loadAudits();
    } catch (err) {
      console.error('Failed to submit inspection:', err);
      setErrorMessage('Failed to persist inspection record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered audits
  const filteredAudits = audits.filter((audit) => {
    if (statusFilter === 'IN_PROGRESS' && audit.status !== 'IN_PROGRESS') return false;
    if (statusFilter === 'COMPLETED' && audit.status !== 'COMPLETED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (audit.audit_code || '').toLowerCase().includes(q);
      const matchTitle = (audit.title || '').toLowerCase().includes(q);
      const matchRack = (audit.rack_range || '').toLowerCase().includes(q);
      const matchFloor = (audit.floor_level || '').toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchRack && !matchFloor) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    const st = (status || '').toUpperCase();
    if (st === 'IN_PROGRESS') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          In Progress
        </span>
      );
    }
    if (st === 'COMPLETED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1 shrink-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-300 shrink-0">
        {status || 'Scheduled'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6">
      {/* 1. TOP HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
              Warehouse Quality & Health
            </span>
            <span className="text-xs text-slate-400 font-mono">Floor 1 & 2 Audits</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Assigned Health Audits & Bay Spot-Checks
          </h1>
          <p className="text-xs text-slate-500">
            Execute scheduled warehouse bay prop verifications, log physical structural conditions, and submit photographic damage reports.
          </p>
        </div>

        <button
          onClick={loadAudits}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audits</span>
        </button>
      </div>

      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. SEARCH & STATUS FILTERS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Audits' },
            { id: 'IN_PROGRESS', label: 'Active / In Progress' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit #, bay, floor..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900"
          />
        </div>
      </div>

      {/* 3. CONTENT AREA: RESPONSIVE ADAPTIVE LAYOUT */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading Assigned Audit Schedules...</span>
        </div>
      ) : filteredAudits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Active Audits Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All warehouse inventory bays are currently up to date. You will be alerted when new spot audits are generated.
          </p>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* DESKTOP WEB VIEWPORT (md: and above): SLEEK HORIZONTAL TABLE */}
          {/* ======================================================== */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 font-mono">Audit ID</th>
                    <th className="py-3.5 px-4">Production / Audit Title</th>
                    <th className="py-3.5 px-4">Warehouse Location</th>
                    <th className="py-3.5 px-4">Item Count & Progress</th>
                    <th className="py-3.5 px-4">Timestamps</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action CTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredAudits.map((audit) => {
                    const total = audit.total_items_count || 10;
                    const audited = audit.audited_items_count || 0;
                    const progress = Math.min(100, Math.round((audited / total) * 100));

                    return (
                      <tr
                        key={audit.id}
                        className="hover:bg-sky-50/40 transition-colors group"
                      >
                        {/* 1. Audit ID */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                          <span className="text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {audit.audit_code}
                          </span>
                        </td>

                        {/* 2. Production / Audit Title */}
                        <td className="py-4 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-1">
                            {audit.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {audit.notes || 'Weekly routine property condition assessment'}
                          </div>
                        </td>

                        {/* 3. Warehouse Location */}
                        <td className="py-4 px-4 max-w-xs whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span><strong>{audit.floor_level}</strong> • {audit.rack_range}</span>
                          </div>
                        </td>

                        {/* 4. Item Count & Progress */}
                        <td className="py-4 px-4 min-w-[160px]">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Scanned</span>
                              <span className="text-slate-900 font-bold">{audited}/{total} ({progress}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 5. Timestamps */}
                        <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-sky-500" />
                            <span>{audit.scheduled_date || 'Today'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Type: {audit.audit_type || 'WEEKLY'}
                          </div>
                        </td>

                        {/* 6. Status Badge */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(audit.status)}
                        </td>

                        {/* 7. Action CTA */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedAudit(audit);
                              setScannerOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <ScanLine className="w-3.5 h-3.5" />
                            <span>Resume Inspection</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MOBILE VIEWPORT (< md): HIGH-DENSITY TOUCH-FRIENDLY BOX CARDS */}
          {/* ======================================================== */}
          <div className="md:hidden space-y-4">
            {filteredAudits.map((audit) => {
              const total = audit.total_items_count || 10;
              const audited = audit.audited_items_count || 0;
              const progress = Math.min(100, Math.round((audited / total) * 100));

              return (
                <div
                  key={audit.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 relative transition-all hover:shadow-md"
                >
                  {/* Status Pill Pinned to Top Right */}
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(audit.status)}
                  </div>

                  {/* Header: Audit Code & Bold Title */}
                  <div className="pr-24 space-y-1">
                    <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block">
                      {audit.audit_code}
                    </span>
                    <h3 className="text-base font-black text-slate-950 leading-tight">
                      {audit.title}
                    </h3>
                  </div>

                  {/* Meta Details with Icons */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="font-semibold">{audit.floor_level} • {audit.rack_range}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-sky-500" />
                        <span>Scheduled: {audit.scheduled_date || 'Today'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {audit.audit_type || 'WEEKLY'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar in Card */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Inspection Progress</span>
                      <span className="text-slate-900 font-bold">{audited} of {total} props scanned ({progress}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Full-Width Touch Action Button at Bottom of Card */}
                  <button
                    onClick={() => {
                      setSelectedAudit(audit);
                      setScannerOpen(true);
                    }}
                    className="w-full min-h-[44px] py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 touch-manipulation cursor-pointer select-none"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Resume Inspection</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 4. SINGLE-ASSET INSPECTION SCANNER MODAL */}
      {/* ======================================================== */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto pointer-events-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-amber-400 block">
                  {selectedAudit?.audit_code} • {selectedAudit?.floor_level}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Warehouse Property Health Scanner
                </h3>
              </div>
              <button
                onClick={() => setScannerOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
                aria-label="Close Inspection Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Scan Barcode / Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Scan Physical Prop Barcode / Enter Asset Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanLine className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={targetCode}
                      onChange={(e) => setTargetCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleScanCode();
                      }}
                      placeholder="e.g. ASH-PROP-0001 or ASH-FURN-CHR-0001"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
                    />
                  </div>
                  <button
                    onClick={() => handleScanCode()}
                    disabled={scanning || !targetCode.trim()}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {scanning ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    <span>Lookup</span>
                  </button>
                </div>

                {/* Quick Test Prop Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Quick Test Tags:</span>
                  {['ASH-PROP-0001', 'ASH-PROP-0002', 'ASH-ELEC-MOU-0005', 'ASH-CAM-RED-0001'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setTargetCode(tag);
                        handleScanCode(tag);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 rounded border border-slate-200 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Scanned Prop Card */}
              {scannedProp && (
                <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      <Image
                        src={scannedProp.imageUrl || '/assets/logo.png'}
                        alt={scannedProp.title || 'Prop'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {scannedProp.itemCode}
                      </span>
                      <h4 className="font-black text-sm text-slate-900 leading-tight">
                        {scannedProp.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {scannedProp.category} • Rack {scannedProp.warehouseLocation || 'Floor 1, Bay A'}
                      </p>
                    </div>
                  </div>

                  {/* Physical Condition Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Physical Inspection Verdict
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'EXCELLENT', label: 'Pristine / Mint', color: 'emerald' },
                        { id: 'GOOD', label: 'Minor Wear', color: 'amber' },
                        { id: 'DAMAGED', label: 'Damaged / Rep.', color: 'rose' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPhysicalCondition(item.id)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            physicalCondition === item.id
                              ? item.color === 'emerald'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : item.color === 'amber'
                                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                                : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Remarks input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Inspection Notes / Damage Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="e.g. Minor scratches on side panel; structure is 100% solid."
                      className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitInspection}
                disabled={!scannedProp || submitting}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Submit Health Audit Entry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InspectionsList;
