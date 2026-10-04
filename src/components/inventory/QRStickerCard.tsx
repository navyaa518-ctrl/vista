'use client';

import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PropSerializedItem } from '@/types/inventory';
import { formatHumanLocation } from '@/lib/services/inventory';
import { Download, Printer, QrCode, Check, ShieldCheck } from 'lucide-react';

interface QRStickerCardProps {
  item: PropSerializedItem;
  showActions?: boolean;
  size?: 'compact' | 'standard' | 'large';
  onPrint?: () => void;
}

export function QRStickerCard({
  item,
  showActions = true,
  size = 'standard',
  onPrint,
}: QRStickerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const propName = item.prop?.name || 'Ashwa Production Prop';
  const modelNumber = item.prop?.model_number || 'N/A';
  const locationCode = item.warehouse_code || (item as any)?.location_code || item.prop?.warehouse_code || 'G1-F1-RA-S01';
  const brand = item.prop?.brand || 'ASHWA';
  const formattedLocation = formatHumanLocation(
    item.storage_location || item.warehouse_location_name || item.prop?.warehouse_location_name || (item.prop as any)?.storage_location,
    locationCode
  );

  // High-Resolution PNG Label Download via Canvas
  const handleDownloadPNG = async () => {
    setDownloading(true);
    try {
      // Create high-res offscreen canvas
      const scale = 3; // 3x for ultra crisp 300dpi printing
      const width = 360 * scale;
      const height = 440 * scale;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Outer border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4 * scale;
      ctx.strokeRect(10 * scale, 10 * scale, width - 20 * scale, height - 20 * scale);

      // Header Brand Background
      ctx.fillStyle = '#0F1118';
      ctx.fillRect(10 * scale, 10 * scale, width - 20 * scale, 55 * scale);

      // Header Text: ASHWA MOVIE PROPERTY RENTALS
      ctx.fillStyle = '#F5D77F';
      ctx.font = `bold ${14 * scale}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ASHWA MOVIE PROPERTY RENTALS', width / 2, 34 * scale);

      ctx.fillStyle = '#A0AEC0';
      ctx.font = `${8 * scale}px sans-serif`;
      ctx.fillText('SECURE CINEMA ASSET TRACKING SYSTEM', width / 2, 49 * scale);

      // Prop Name & Model Number
      ctx.fillStyle = '#1A202C';
      ctx.font = `bold ${13 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      const truncatedName = propName.length > 36 ? propName.substring(0, 34) + '...' : propName;
      ctx.fillText(truncatedName, width / 2, 85 * scale);

      ctx.fillStyle = '#718096';
      ctx.font = `bold ${10 * scale}px monospace`;
      ctx.fillText(`MODEL: ${modelNumber} • BRAND: ${brand}`, width / 2, 102 * scale);

      // Convert SVG QR Code to Image
      const svg = cardRef.current?.querySelector('svg');
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          const qrSize = 190 * scale;
          const qrX = (width - qrSize) / 2;
          const qrY = 120 * scale;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          URL.revokeObjectURL(blobURL);

          // Divider
          ctx.strokeStyle = '#CBD5E0';
          ctx.lineWidth = 1 * scale;
          ctx.beginPath();
          ctx.moveTo(25 * scale, 335 * scale);
          ctx.lineTo(width - 25 * scale, 335 * scale);
          ctx.stroke();

          // Bottom Serial Code Tag
          ctx.fillStyle = '#0F1118';
          ctx.fillRect(25 * scale, 345 * scale, width - 50 * scale, 40 * scale);

          ctx.fillStyle = '#F5D77F';
          ctx.font = `bold ${16 * scale}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(item.item_code, width / 2, 371 * scale);

          // Bottom Warehouse Location
          ctx.fillStyle = '#2D3748';
          ctx.font = `bold ${9 * scale}px monospace`;
          ctx.fillText(`LOC: ${formattedLocation}`, width / 2, 405 * scale);

          ctx.fillStyle = '#718096';
          ctx.font = `${8 * scale}px sans-serif`;
          ctx.fillText('DO NOT REMOVE • SCAN VIA ASHWA OPS APP', width / 2, 420 * scale);

          // Trigger download
          const dataUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.download = `LABEL-${item.item_code}.png`;
          a.href = dataUrl;
          a.click();

          setDownloading(false);
          setDownloaded(true);
          setTimeout(() => setDownloaded(false), 2000);
        };
        img.src = blobURL;
      }
    } catch (err) {
      console.error('PNG export error:', err);
      setDownloading(false);
    }
  };

  const qrSizeMap = {
    compact: 110,
    standard: 150,
    large: 190,
  };

  return (
    <div className="flex flex-col items-center">
      {/* Visual Sticker Card Element */}
      <div
        ref={cardRef}
        className="w-full max-w-[340px] bg-white text-black rounded-2xl border-2 border-black overflow-hidden shadow-2xl flex flex-col items-center select-none print:shadow-none print:border-black"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Brand Header Banner */}
        <div className="w-full bg-[#0d1017] text-white py-2.5 px-3 flex flex-col items-center text-center border-b-2 border-black">
          <div className="text-[11px] font-black font-serif tracking-widest text-[#F5D77F] uppercase flex items-center gap-1">
            <span>ASHWA MOVIE PROPERTY RENTALS</span>
          </div>
          <span className="text-[8px] tracking-wider uppercase text-slate-400 font-semibold">
            Warehouse Asset Serialization Tag
          </span>
        </div>

        {/* Item Title & Model */}
        <div className="w-full text-center px-3 pt-2.5 pb-1 space-y-0.5">
          <h4 className="text-xs font-bold text-neutral-900 line-clamp-1 leading-tight">
            {propName}
          </h4>
          <p className="text-[10px] text-neutral-600 font-mono font-medium">
            MODEL: {modelNumber} • {brand}
          </p>
        </div>

        {/* High-Resolution QR Code */}
        <div className="p-2.5 my-1 bg-white border border-neutral-300 rounded-xl shadow-inner flex items-center justify-center">
          <QRCodeSVG
            value={item.qr_data || item.item_code}
            size={qrSizeMap[size]}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Bottom Human-Readable Serial & Location */}
        <div className="w-full px-3 pb-3 pt-1 text-center space-y-1">
          <div className="w-full bg-[#0d1017] text-[#F5D77F] py-1.5 px-2 rounded-lg font-mono text-sm font-black tracking-widest shadow-sm">
            {item.item_code}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-700 px-1 pt-0.5">
            <span className="font-bold truncate max-w-[210px]" title={formattedLocation}>📍 {formattedLocation}</span>
            <span className="text-neutral-500 uppercase shrink-0">{item.condition}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center gap-2 mt-3 w-full max-w-[340px]">
          <button
            type="button"
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-800" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? 'Exporting...' : 'Download PNG Label'}</span>
              </>
            )}
          </button>

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
