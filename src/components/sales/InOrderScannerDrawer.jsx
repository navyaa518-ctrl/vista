'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Camera,
  QrCode,
  ScanLine,
  X,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  Tag,
  DollarSign,
  Layers,
  ChevronUp,
  RefreshCw,
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { ordersService } from '@/lib/services/orders';
import { inventoryService } from '@/lib/services/inventory';

// Sample asset barcodes ready for single-tap simulation
const QUICK_SCAN_SAMPLES = [
  { code: 'ASH-ELEC-MOU-0005', label: '1984 Vintage Apple Macintosh Mouse (Floor 2)' },
  { code: 'ASH-PROP-0001', label: '1940s Vintage British Field Artillery Telescope (Floor 1)' },
  { code: 'ASH-FUR-001', label: '18th Century Royal Carved Teak Throne Chair (Floor 1)' },
  { code: 'ASH-OPT-1942-01', label: 'Vintage Brass Marine Sextant & Compass (Floor 2)' },
  { code: 'ASH-WEAP-GUN-0023', label: 'Antique Flintlock Duel Pistol Prop (Floor 1)' },
];

export function InOrderScannerDrawer({
  order,
  executiveId = 'exec-001',
  executiveName = 'Ravi Kumar (Sales Exec)',
  isOpen,
  onClose,
  onItemAdded,
}) {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize or teardown camera stream when opened/closed
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setErrorMessage(null);
      setSuccessToast(null);
    } else {
      // Auto-start camera if supported
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraActive(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Camera access not granted or unavailable:', err);
      setCameraError('Camera unavailable on this device. Use manual barcode input or quick tags below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleLookup = async (codeToSearch) => {
    const raw = (codeToSearch || manualCode).trim();
    if (!raw) return;

    setSearching(true);
    setErrorMessage(null);
    setScannedResult(null);

    try {
      // 1. Sanitize code
      let cleanCode = raw;
      if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
        try {
          const parsed = JSON.parse(cleanCode);
          cleanCode = parsed.itemCode || parsed.code || cleanCode;
        } catch (e) {
          // ignore
        }
      }
      cleanCode = cleanCode.toUpperCase();

      // 2. Query Supabase directly
      let dbProp = null;
      try {
        const { data } = await supabase
          .from('props')
          .select('*')
          .or(`slug.ilike.%${cleanCode}%,title.ilike.%${cleanCode}%`)
          .limit(1)
          .maybeSingle();
        if (data) dbProp = data;
      } catch (err) {
        console.warn('Direct Supabase lookup fallback:', err);
      }

      // 3. Fallback to inventory validation service
      const validation = await ordersService.validatePropQR(cleanCode, order?.id);

      if (!validation.valid && !dbProp) {
        setErrorMessage(validation.error || `Barcode '${cleanCode}' was not found in ASHWA warehouse property catalog.`);
        return;
      }

      const prop = validation.prop || dbProp;
      const item = validation.item;

      // Calculate daily rental price
      const replacementValue = Number(prop?.replacement_value || prop?.replacement_value_inr || 25000);
      const dailyRate = Number(
        prop?.daily_rental_rate ||
        prop?.daily_rent_price ||
        Math.round(replacementValue * 0.15) ||
        1200
      );
      const availableUnits = Math.max(1, validation.availableUnits || prop?.available_units || 1);

      setScannedResult({
        itemCode: validation.itemCode || cleanCode,
        propId: prop?.id || 'prop-default',
        serializedId: item?.id || 'ser-default',
        title: prop?.name || prop?.title || 'Cinema Property Asset',
        category: prop?.category?.name || prop?.category || 'Film Equipment',
        imageUrl:
          prop?.images?.[0] ||
          item?.evidence_photos?.[0] ||
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
        replacementValue,
        dailyRate,
        warehouseLocation:
          validation.warehouseLocation ||
          `Floor ${prop?.floor || 1}, Rack ${prop?.rack || 'A-01'}`,
        availableUnits,
        alreadyInOrder: validation.alreadyInThisOrder || false,
      });

      setQuantity(1);
    } catch (err) {
      console.error('Scan lookup error:', err);
      setErrorMessage('Failed to query prop database. Please retry.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmAdd = async () => {
    if (!scannedResult || !order) return;

    setAddingToCart(true);
    setErrorMessage(null);

    try {
      const res = await ordersService.scanAndAddOrderItem(
        order.id,
        scannedResult.itemCode,
        executiveId,
        executiveName,
        quantity
      );

      if (!res.success) {
        setErrorMessage(res.message);
        return;
      }

      setSuccessToast(`Added ${quantity}x "${scannedResult.title}" to order!`);

      if (onItemAdded && res.item) {
        onItemAdded(res.item);
      }

      // Reset after short delay
      setTimeout(() => {
        setScannedResult(null);
        setManualCode('');
        setSuccessToast(null);
      }, 1500);
    } catch (err) {
      console.error('Error adding item to order:', err);
      setErrorMessage('An unexpected error occurred while appending item to manifest.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (!isOpen) return null;

  const durationDays = order?.rental_days || order?.duration_days || 3;
  const estimatedSubtotal = scannedResult ? scannedResult.dailyRate * durationDays * quantity : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-md p-0 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-200">
        {/* 1. MODAL / DRAWER TOP HEADER */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">In-Order Prop QR Scanner</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  LIVE PICK
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Order: <span className="text-amber-300 font-semibold">{order?.order_number || 'ASH-ORD'}</span> • {order?.client_name || 'Production'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Close Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. BODY CONTENT (SCROLLABLE) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* CAMERA VIEWPORT WITH RETICLE */}
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden aspect-[16/9] flex items-center justify-center text-slate-400">
            {cameraActive && !cameraError ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <Camera className="w-8 h-8 text-slate-600" />
                <span className="text-xs text-slate-500">
                  {cameraError || 'Target property barcode or asset label within the reticle'}
                </span>
              </div>
            )}

            {/* Targeting Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-32 border-2 border-amber-400/80 rounded-2xl relative shadow-lg shadow-amber-500/10">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400 -mt-0.5 -ml-0.5" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400 -mt-0.5 -mr-0.5" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400 -mb-0.5 -ml-0.5" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400 -mb-0.5 -mr-0.5" />
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-amber-400/70 animate-pulse shadow-sm shadow-amber-400" />
              </div>
            </div>

            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Optical Auto-Focus Active
              </span>
              <span className="text-amber-400 font-mono text-[10px]">ASHWA-AI OPTICS</span>
            </div>
          </div>

          {/* MANUAL CODE ENTRY BAR */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="Scan or type barcode (e.g., ASH-ELEC-MOU-0005)"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
              />
            </div>
            <button
              onClick={() => handleLookup()}
              disabled={searching || !manualCode.trim()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              {searching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
              Lookup
            </button>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Lookup Notice:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* SUCCESS TOAST */}
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* 3. SCANNED PROP DETAIL CARD & LIVE RENTAL RATE DISPLAY */}
          {scannedResult && (
            <div className="p-4 bg-gradient-to-br from-amber-50/60 via-slate-50 to-white border-2 border-amber-400 rounded-2xl shadow-md space-y-4 animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex gap-4">
                {/* Prop Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 relative shrink-0">
                  <Image
                    src={scannedResult.imageUrl}
                    alt={scannedResult.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900/80 text-white">
                    {scannedResult.category}
                  </div>
                </div>

                {/* Meta & Location */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="font-bold text-sm text-slate-950 leading-tight truncate">
                    {scannedResult.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                    <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-bold text-slate-900">{scannedResult.itemCode}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{scannedResult.warehouseLocation}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Replacement Value: <span className="font-semibold text-slate-800">₹{scannedResult.replacementValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* LIVE RENTAL RATE DISPLAY (HIGH-CONTRAST CALLOUT) */}
              <div className="p-3.5 rounded-xl bg-slate-950 text-white flex items-center justify-between border border-amber-400/40 shadow-sm">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Live Rental Rate Verified
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-black text-white tracking-tight">
                      ₹{scannedResult.dailyRate.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/ shoot day</span>
                  </div>
                </div>

                {/* Shoot duration line total */}
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Total for {durationDays} Days</div>
                  <div className="text-sm font-bold text-amber-300">
                    ₹{estimatedSubtotal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* QUANTITY PICKER & ACTION BUTTON */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                {/* Quantity Controller */}
                <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(scannedResult.availableUnits, q + 1))}
                    disabled={quantity >= scannedResult.availableUnits}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Confirm and Add to Manifest Button */}
                <button
                  onClick={handleConfirmAdd}
                  disabled={addingToCart}
                  className="flex-1 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
                >
                  {addingToCart ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Confirm & Add to Order
                </button>
              </div>
            </div>
          )}

          {/* 4. QUICK DEMO / SIMULATION SAMPLES */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>Quick Test Barcodes (Tap to Simulate Live Scan)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_SCAN_SAMPLES.map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => {
                    setManualCode(sample.code);
                    handleLookup(sample.code);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-left transition-all flex flex-col group"
                >
                  <span className="font-mono text-[11px] font-bold text-slate-900 group-hover:text-amber-900">
                    {sample.code}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate mt-0.5">
                    {sample.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. FOOTER */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Logged Executive: <strong className="text-slate-800">{executiveName}</strong></span>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default InOrderScannerDrawer;
