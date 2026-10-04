'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  AlertTriangle,
  RefreshCw,
  QrCode,
  Sparkles,
  Zap,
  CheckCircle2,
  Keyboard,
  SwitchCamera,
} from 'lucide-react';

// Robust QR Code Sanitization & Payload Parser
export const extractItemCode = (rawScannedText) => {
  if (!rawScannedText) return null;
  let cleaned = String(rawScannedText).trim();

  // Case 1: If scanned text is a JSON payload (e.g. {"itemCode":"ASH-ELEC-MOU-0005"})
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) {
      const code =
        parsed.itemCode ||
        parsed.item_code ||
        parsed.serial ||
        parsed.serialNumber ||
        parsed.serial_number ||
        parsed.propId ||
        parsed.prop_id ||
        parsed.code ||
        parsed.sku ||
        cleaned;
      if (code) return String(code).trim();
    }
  } catch (e) {
    // Not a JSON payload, proceed
  }

  // Case 2: If it's a URL or URI (e.g., https://ashwa.app/props/ASH-ELEC-MOU-0005)
  if (cleaned.includes('/')) {
    cleaned = cleaned.split('?')[0].split('#')[0];
    const parts = cleaned.split('/').filter(Boolean);
    if (parts.length > 0) {
      cleaned = parts[parts.length - 1] || cleaned;
    }
  }

  // Strip wrapping quotes and excessive punctuation
  return cleaned.replace(/^["']|["']$/g, '').trim();
};

export function LiveCameraScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  onManualFallback,
}) {
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [scannedCode, setScannedCode] = useState(null);

  const html5QrCodeRef = useRef(null);
  const isStoppingRef = useRef(false);

  // Initialize html5-qrcode camera stream
  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      setCameraError(null);
      setIsInitializing(true);
      setScannedCode(null);
      isStoppingRef.current = false;

      const startScanner = async () => {
        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          if (!isMounted) return;

          const scannerId = 'live-camera-scanner-viewport';
          const scannerInstance = new Html5Qrcode(scannerId);
          html5QrCodeRef.current = scannerInstance;

          // Get cameras if available
          try {
            const devices = await Html5Qrcode.getCameras();
            if (isMounted && devices && devices.length > 0) {
              setAvailableCameras(devices);
            }
          } catch {
            // ignore getCameras error
          }

          // Start scanning with environment camera preference
          await scannerInstance.start(
            { facingMode: 'environment' },
            {
              fps: 15,
              qrbox: { width: 260, height: 260 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (isStoppingRef.current) return;
              isStoppingRef.current = true;

              const cleanCode = extractItemCode(decodedText);
              setScannedCode(cleanCode || decodedText.trim());

              // Audio beep feedback if supported
              try {
                if (typeof window !== 'undefined') {
                  const AudioCtx = window.AudioContext || window.webkitAudioContext;
                  if (AudioCtx) {
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.value = 880;
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.12);
                  }
                }
              } catch {}

              // Clean shutdown and notify parent with cleanCode
              setTimeout(async () => {
                await cleanStopScanner();
                if (onScanSuccess) {
                  onScanSuccess(cleanCode || decodedText.trim());
                }
              }, 400);
            },
            () => {
              // Ignore frame parse misses
            }
          );

          if (isMounted) {
            setIsInitializing(false);
          }
        } catch (err) {
          console.warn('Live Camera Scanner initialization error:', err);
          if (isMounted) {
            setIsInitializing(false);
            setCameraError(
              'Camera stream is blocked or unavailable on this device. You can click any quick-scan code below or use the manual input field.'
            );
          }
        }
      };

      const timer = setTimeout(() => {
        startScanner();
      }, 150);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        cleanStopScanner();
      };
    }
  }, [isOpen]);

  const cleanStopScanner = async () => {
    if (html5QrCodeRef.current) {
      const instance = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
        await instance.clear();
      } catch (err) {
        console.warn('Error clearing scanner instance:', err);
      }
    }
  };

  const handleClose = async () => {
    await cleanStopScanner();
    onClose();
  };

  const handleSimulateScan = async (code) => {
    isStoppingRef.current = true;
    const cleanCode = extractItemCode(code);
    setScannedCode(cleanCode || code);
    await cleanStopScanner();
    if (onScanSuccess) {
      onScanSuccess(cleanCode || code);
    }
  };

  const handleFallbackClick = async () => {
    await cleanStopScanner();
    onClose();
    if (onManualFallback) {
      onManualFallback();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-fade-in">
      <div className="fixed inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Scan Prop Barcode / QR Tag
                </h3>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hold prop serial sticker within the targeting frame
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Body */}
        <div className="p-5 sm:p-6 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-full aspect-square max-w-[340px] rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-inner">
            {/* HTML5 QR Code Mount Node */}
            <div
              id="live-camera-scanner-viewport"
              className="w-full h-full object-cover"
            />

            {/* Glowing Targeting Reticle Overlay */}
            {!cameraError && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64 border border-sky-400/30 rounded-2xl">
                  {/* Glowing Corner Accents */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-xl shadow-[0_0_12px_rgba(56,189,248,0.8)]" />

                  {/* Laser Sweeping Line */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_15px_rgba(56,189,248,1)] animate-bounce" />

                  {/* Success detection state */}
                  {scannedCode && (
                    <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-300 animate-fade-in p-4 text-center rounded-2xl">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-scale-in" />
                      <span className="font-mono text-sm font-bold text-white bg-emerald-900/90 px-3 py-1 rounded-lg border border-emerald-500">
                        {scannedCode}
                      </span>
                      <span className="text-[11px] text-emerald-300 mt-1">
                        Decoded! Fetching property details...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Initializing Spinner */}
            {isInitializing && !cameraError && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-slate-300 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
                <span className="text-xs font-semibold">Accessing optical camera...</span>
              </div>
            )}

            {/* Error or Blocked State */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Camera Unavailable</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs">
                    {cameraError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFallbackClick}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Use Manual Barcode Input</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick-Scan Simulation Barcodes */}
          <div className="w-full space-y-2 pt-1 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Test Asset Codes
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
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
                  onClick={() => handleSimulateScan(item.code)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <QrCode className="w-3 h-3 text-sky-400" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Auto-detects QR codes &amp; 1D Barcodes</span>
          </div>

          <button
            type="button"
            onClick={handleFallbackClick}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Manual Input</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveCameraScannerModal;
