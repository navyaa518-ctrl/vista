'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  ArrowLeft,
  Camera,
  Flashlight,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  X,
  Volume2,
  Smartphone,
  ChevronUp,
  ChevronDown,
  Film,
  UserCheck,
  Radio,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ordersService, STAFF_EXECUTIVES } from '@/lib/services/orders';
import { WalkInOrder, WalkInOrderItem } from '@/types/orders';
import { PropSerializedItem, PropSKU } from '@/types/inventory';
import { soundEffects } from '@/lib/audio';
import { formatINR } from '@/lib/utils';
import { useRole } from '@/context/RoleContext';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function MobilePickingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;
  const router = useRouter();
  const { executiveName, setExecutiveName } = useRole();

  const [order, setOrder] = useState<WalkInOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionPickedItems, setSessionPickedItems] = useState<WalkInOrderItem[]>([]);

  // Active Executive Selector
  const [activeExec, setActiveExec] = useState(
    executiveName || 'Ravi Kumar (Floor 1 Specialist)'
  );

  // Camera & Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const scannerRef = useRef<any>(null);
  const [isScanningPaused, setIsScanningPaused] = useState(false);

  // Manual Barcode Input Fallback
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [searchingCode, setSearchingCode] = useState(false);

  // Confirmation Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeValidation, setActiveValidation] = useState<{
    itemCode: string;
    item?: PropSerializedItem;
    prop?: PropSKU;
    warehouseLocation: string;
    availableUnits: number;
  } | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [addingToOrder, setAddingToOrder] = useState(false);

  // Alerts & Feedback
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showTray, setShowTray] = useState(true);

  // Load Order & Existing Items
  useEffect(() => {
    const initData = async () => {
      try {
        const ord = await ordersService.getOrderById(orderId);
        if (ord) setOrder(ord);
        const itms = await ordersService.getOrderItems(orderId);
        setSessionPickedItems(itms);
      } catch (err) {
        console.error('Failed to init order data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [orderId]);

  // Initialize and start HTML5-QRCode Scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScannedCode(decodedText);
        },
        () => {}
      );

      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Camera unavailable or permission denied. Use the high-speed manual barcode search below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Flashlight toggle
  const toggleFlashlight = async () => {
    if (!scannerRef.current || !cameraActive) return;
    try {
      const newTorchState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setTorchOn(newTorchState);
    } catch {
      alert('Torch not supported by this camera hardware.');
    }
  };

  // Handle scanned or searched code
  const handleScannedCode = async (rawCode: string) => {
    if (isScanningPaused || drawerOpen) return;

    setErrorAlert(null);
    setSearchingCode(true);

    try {
      const validation = await ordersService.validatePropQR(rawCode, orderId);

      if (!validation.valid || !validation.item) {
        soundEffects.playErrorBuzzer();
        setErrorAlert(validation.error || 'Barcode not found in ASHWA asset catalog.');
        if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        return;
      }

      if (validation.alreadyInThisOrder) {
        soundEffects.playErrorBuzzer();
        setErrorAlert(`Prop ${validation.itemCode} is already picked into this order cart.`);
        if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        return;
      }

      // Positive Audio Feedback
      soundEffects.playSuccessChime();
      if (typeof window !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(80);

      setIsScanningPaused(true);
      setActiveValidation({
        itemCode: validation.itemCode,
        item: validation.item,
        prop: validation.prop,
        warehouseLocation: validation.warehouseLocation,
        availableUnits: validation.availableUnits,
      });
      setSelectedQuantity(1);
      setDrawerOpen(true);
    } catch (err: any) {
      console.error('Scan error:', err);
      soundEffects.playErrorBuzzer();
      setErrorAlert('Error validating barcode.');
    } finally {
      setSearchingCode(false);
    }
  };

  // Confirm and Add to Order/Cart
  const handleConfirmAddToCart = async () => {
    if (!activeValidation || !activeValidation.item) return;

    setAddingToOrder(true);
    try {
      const matchedExec = STAFF_EXECUTIVES.find((e) => e.name === activeExec) || STAFF_EXECUTIVES[0];
      const execName = matchedExec.name.split('(')[0].trim();
      const execId = matchedExec.id;

      const res = await ordersService.scanAndAddOrderItem(
        orderId,
        activeValidation.itemCode,
        execId,
        execName,
        selectedQuantity
      );

      if (res.success && res.item) {
        // Device Vibration Feedback
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        setSessionPickedItems((prev) => [res.item!, ...prev]);
        setSuccessToast(`Added ${res.item.item_code} by ${execName}!`);
        setTimeout(() => setSuccessToast(null), 3000);

        setDrawerOpen(false);
        setActiveValidation(null);
        setIsScanningPaused(false);
      } else {
        soundEffects.playErrorBuzzer();
        alert(res.message);
      }
    } catch (err) {
      console.error('Add to order error:', err);
      soundEffects.playErrorBuzzer();
      alert('Failed to commit prop to cart.');
    } finally {
      setAddingToOrder(false);
    }
  };

  const handleCancelDrawer = () => {
    setDrawerOpen(false);
    setActiveValidation(null);
    setIsScanningPaused(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm font-medium">Opening Mobile Picking Session...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
        <p className="text-base font-bold text-white mb-2">Order Not Found</p>
        <Link
          href="/ops/scanner"
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold"
        >
          Return to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
      {/* Mobile Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <Link
            href="/ops/scanner"
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-amber-400">
                {order.order_number}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                {order.duration_days || order.rental_days}d Shoot
              </span>
            </div>
            <h1 className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs">
              {order.movie_project_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cameraActive && (
            <button
              onClick={toggleFlashlight}
              className={`p-2 rounded-lg border transition-all ${
                torchOn
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Flashlight"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}

          {/* Quick link to live counter cart */}
          <Link
            href={`/admin/orders/${order.id}/billing-cart`}
            target="_blank"
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-700"
            title="Open Counter Cart"
          >
            <Film className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Executive Quick Selector Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <UserCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Picking as:</span>
        </div>
        <select
          value={activeExec}
          onChange={(e) => {
            setActiveExec(e.target.value);
            setExecutiveName(e.target.value);
          }}
          className="bg-slate-800 text-white font-semibold rounded-lg px-2.5 py-1 text-xs border border-slate-700 focus:outline-none focus:border-amber-500"
        >
          {STAFF_EXECUTIVES.map((e) => (
            <option key={e.id} value={e.name}>
              {e.name.split('(')[0].trim()} (F{e.floor})
            </option>
          ))}
        </select>
      </div>

      {/* Floating Success Toast */}
      {successToast && (
        <div className="fixed top-20 left-4 right-4 z-40 animate-bounce">
          <div className="bg-emerald-500 text-slate-950 font-bold text-xs p-3 rounded-xl shadow-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Floating Error Alert */}
      {errorAlert && (
        <div className="m-4 bg-red-500/15 border border-red-500/30 text-red-300 p-3 rounded-xl text-xs flex items-start justify-between gap-2 animate-shake">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <span>{errorAlert}</span>
          </div>
          <button onClick={() => setErrorAlert(null)} className="text-red-400 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="p-4 flex-1 flex flex-col items-center max-w-md mx-auto w-full space-y-4">
        {/* Scanner Viewfinder Box */}
        <div className="relative w-full aspect-square max-w-[340px] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center">
          {/* Target Viewfinder Overlay */}
          <div className="absolute inset-8 border-2 border-amber-500/60 rounded-2xl pointer-events-none z-10 flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <div className="w-4 h-4 border-t-2 border-l-2 border-amber-400" />
              <div className="w-4 h-4 border-t-2 border-r-2 border-amber-400" />
            </div>

            {/* Scanning Laser Beam */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse shadow-[0_0_8px_#f59e0b]" />

            <div className="flex justify-between">
              <div className="w-4 h-4 border-b-2 border-l-2 border-amber-400" />
              <div className="w-4 h-4 border-b-2 border-r-2 border-amber-400" />
            </div>
          </div>

          <div id="qr-reader" className="w-full h-full object-cover" />

          {!cameraActive && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <Camera className="w-10 h-10 text-amber-500 animate-pulse" />
              <p className="text-xs text-slate-300 font-medium">
                {cameraError || 'Camera initialising...'}
              </p>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-lg"
              >
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Manual Barcode Search Fallback */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              Manual Serial Barcode Entry
            </span>
            <span className="text-[10px] text-slate-500">Warehouse Keyboard</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCodeInput.trim()) {
                handleScannedCode(manualCodeInput.trim());
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. ASH-ELEC-MOU-0001"
              className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={searchingCode || !manualCodeInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
            >
              {searchingCode ? 'Checking...' : 'Scan'}
            </button>
          </form>

          {/* Quick Demo Pick Barcodes */}
          <div className="pt-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Test Serial Codes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['ASH-ELEC-MOU-0001', 'ASH-FURN-THR-0002', 'ASH-OPT-CAM-0003', 'ASH-ARM-SWD-0004'].map(
                (demoCode) => (
                  <button
                    key={demoCode}
                    type="button"
                    onClick={() => {
                      setManualCodeInput(demoCode);
                      handleScannedCode(demoCode);
                    }}
                    className="text-[10px] font-mono font-medium px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                  >
                    {demoCode}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mini-Tray: Recently Picked in this Session */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div
            onClick={() => setShowTray(!showTray)}
            className="flex items-center justify-between cursor-pointer py-1 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white">Live Cart Units</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {sessionPickedItems.length} Picked
              </span>
            </div>
            {showTray ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>

          {showTray && sessionPickedItems.length > 0 && (
            <div className="mt-2.5 max-h-36 overflow-y-auto space-y-1.5 divide-y divide-slate-800/60">
              {sessionPickedItems.slice(0, 5).map((item) => (
                <div key={item.id} className="pt-1.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="font-mono text-amber-400 font-bold mr-1.5">
                        {item.item_code}
                      </span>
                      <span className="text-slate-300 truncate max-w-[140px] inline-block align-bottom">
                        {item.prop_title}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-blue-400 font-medium px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                    By {item.added_by_executive_name || 'Exec'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION BOTTOM DRAWER */}
      {drawerOpen && activeValidation && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border-t border-slate-700 rounded-t-3xl shadow-2xl p-6 space-y-5 animate-slideUp">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Barcode Verified & Available
                </span>
                <h2 className="text-lg font-extrabold text-white mt-0.5">
                  {activeValidation.prop?.name || 'Verified Movie Prop'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {activeValidation.itemCode}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">
                    Condition: {activeValidation.item?.condition || 'Good'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCancelDrawer}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prop Image & Detailed Location */}
            <div className="flex gap-4 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              {activeValidation.prop?.images?.[0] ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
                  <Image
                    src={activeValidation.prop.images[0]}
                    alt={activeValidation.prop.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Layers className="w-7 h-7" />
                </div>
              )}

              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1 text-amber-400 font-semibold">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Warehouse Slot Location:</span>
                </div>
                <div className="font-mono text-slate-200 text-[11px] leading-relaxed">
                  {activeValidation.warehouseLocation}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium pt-0.5">
                  ✓ Available stock: {activeValidation.availableUnits} units in this rack
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-xs font-semibold text-slate-300">
                Confirm Pick Quantity:
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-base font-bold text-amber-400 w-6 text-center">
                  {selectedQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Added By attribution */}
            <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
              <span>Logging scan under:</span>
              <span className="text-amber-300 font-bold">{activeExec.split('(')[0].trim()}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleCancelDrawer}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel / Rescan
              </button>
              <button
                type="button"
                disabled={addingToOrder}
                onClick={handleConfirmAddToCart}
                className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                {addingToOrder ? 'Committing...' : 'Add to Order/Cart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
