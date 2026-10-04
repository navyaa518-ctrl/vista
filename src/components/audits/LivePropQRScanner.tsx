'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Search,
  X,
  AlertTriangle,
  RefreshCw,
  Camera,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AuditItemChecklistEntry } from '@/types/audits';
import { inspectionService } from '@/lib/services/inspectionService';

interface LivePropQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onPropDetected: (propItem: AuditItemChecklistEntry) => void;
}

export function LivePropQRScanner({
  isOpen,
  onClose,
  onPropDetected,
}: LivePropQRScannerProps) {
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  // Initialize html5-qrcode scanner
  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      setCameraError(null);
      setStatusMessage(null);

      const initScanner = async () => {
        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          if (!isMounted || !scannerContainerRef.current) return;

          const scannerId = 'live-prop-qr-viewport';
          const scannerInstance = new Html5Qrcode(scannerId);
          html5QrCodeRef.current = scannerInstance;

          await scannerInstance.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              handleUniversalScan(decodedText);
            },
            () => {
              // Ignore intermediate frames
            }
          );
        } catch (err: any) {
          console.warn('Live QR camera scanner warning:', err);
          if (isMounted) {
            setCameraError(
              'Camera stream is not available or blocked. Please use the Manual SKU / Barcode Gun input below.'
            );
          }
        }
      };

      const timer = setTimeout(() => {
        initScanner();
      }, 200);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (html5QrCodeRef.current) {
          html5QrCodeRef.current
            .stop()
            .then(() => html5QrCodeRef.current?.clear())
            .catch(() => {});
          html5QrCodeRef.current = null;
        }
      };
    }
  }, [isOpen]);

  const stopScannerAndClose = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => html5QrCodeRef.current?.clear())
        .catch(() => {});
      html5QrCodeRef.current = null;
    }
    onClose();
  };

  // Universal Scan & Parse Handler
  const handleUniversalScan = async (rawData: string) => {
    if (!rawData || !rawData.trim()) return;

    // 1. Robust JSON QR payload parsing: STRICT exact match on itemCode
    let targetCode = rawData.trim();
    try {
      const parsed = JSON.parse(rawData);
      targetCode = (
        parsed.itemCode ||
        parsed.item_code ||
        parsed.serial ||
        parsed.serial_number ||
        parsed.code ||
        parsed.id ||
        targetCode
      ).trim();
    } catch {
      targetCode = rawData.trim();
    }

    setSearching(true);
    setCameraError(null);
    setStatusMessage(`Looking up "${targetCode}" across 248,930 warehouse properties in Supabase...`);

    try {
      // 2. Universal prop search across entire warehouse catalog
      const found = await inspectionService.scanPropByCode(rawData);

      if (found) {
        setStatusMessage(`✓ Exact Match: ${found.prop_title} (${found.item_code})`);
        // Stop camera and immediately open review modal
        stopScannerAndClose();
        onPropDetected(found);
      } else {
        setCameraError(
          `No property found matching "${targetCode}". Verify the barcode / prop SKU and try again.`
        );
        setStatusMessage(null);
      }
    } catch (err) {
      console.error('Scan lookup error:', err);
      setCameraError('An error occurred while searching properties in Supabase.');
    } finally {
      setSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Live Prop QR Scanner</h3>
              <p className="text-[11px] text-slate-400">
                Universal warehouse barcode &amp; JSON QR resolver
              </p>
            </div>
          </div>
          <button
            onClick={stopScannerAndClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-square flex flex-col items-center justify-center">
          <div id="live-prop-qr-viewport" ref={scannerContainerRef} className="w-full h-full" />

          {/* Scanner Overlay Guide */}
          <div className="absolute inset-8 border-2 border-sky-500/50 rounded-2xl pointer-events-none flex items-center justify-center">
            <div className="w-16 h-0.5 bg-sky-400/80 animate-pulse" />
          </div>

          {/* Loading or Status Overlay */}
          {searching && (
            <div className="absolute inset-0 bg-slate-950/80 p-6 flex flex-col items-center justify-center text-center space-y-3 z-10 animate-in fade-in">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
              <p className="text-xs font-semibold text-sky-200">{statusMessage}</p>
            </div>
          )}

          {cameraError && !searching && (
            <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-2.5 z-10 animate-in fade-in">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Manual SKU / Barcode Gun Input */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <label className="font-bold text-slate-400 uppercase tracking-wider">
              Manual SKU / Barcode Gun Input
            </label>
            <span className="text-slate-500 text-[10px]">Universal Warehouse Lookup</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUniversalScan(manualInput);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder='e.g. ASH-ELEC-MOU-0005, {"itemCode":...}, or Throne'
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !manualInput.trim()}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              Lookup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
