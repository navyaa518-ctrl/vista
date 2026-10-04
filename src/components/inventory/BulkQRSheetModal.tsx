'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PropSerializedItem } from '@/types/inventory';
import { formatHumanLocation } from '@/lib/services/inventory';
import { X, Printer, CheckSquare, Layers, FileText } from 'lucide-react';

interface BulkQRSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PropSerializedItem[];
  propTitle?: string;
}

export function BulkQRSheetModal({
  isOpen,
  onClose,
  items,
  propTitle,
}: BulkQRSheetModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-6 overflow-hidden my-auto space-y-4">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Printable A4 QR Sticker Sheet</span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  {items.length} Units Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Formatted for standard 24-up A4 adhesive sticker sheets (3 columns × 8 rows)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Sticker Sheet</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="max-h-[75vh] overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-200/80 print:max-h-none print:overflow-visible print:p-0 print:border-none print:bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2 print:p-2">
            {items.map((item, idx) => {
              const name = item.prop?.name || propTitle || 'Movie Prop';
              const model = item.prop?.model_number || 'N/A';
              const rawLocName = item.storage_location || item.warehouse_location_name || item.prop?.warehouse_location_name || (item.prop as any)?.storage_location || '';
              const rawLocCode = item.warehouse_code || (item as any)?.location_code || item.prop?.warehouse_code || (item.prop as any)?.location_code || 'G1-F1-RA-S01';
              const formattedLoc = formatHumanLocation(rawLocName, rawLocCode);

              return (
                <div
                  key={item.id || idx}
                  className="bg-white text-black p-2.5 rounded-lg border-2 border-slate-900 flex flex-col justify-between items-center text-center shadow-xs page-break-inside-avoid print:shadow-none print:border-black"
                  style={{ minHeight: '140px' }}
                >
                  {/* Mini Header */}
                  <div className="w-full border-b border-slate-900 pb-1 mb-1 flex items-center justify-between text-[9px] font-bold">
                    <span className="font-serif tracking-wider">ASHWA</span>
                    <span className="font-mono text-slate-600 truncate max-w-[110px]">{model}</span>
                  </div>

                  {/* Prop Title */}
                  <div className="text-[10px] font-bold text-slate-900 line-clamp-1 w-full leading-tight">
                    {name}
                  </div>

                  {/* QR Code */}
                  <div className="p-1 my-1 bg-white border border-slate-200 rounded">
                    <QRCodeSVG
                      value={item.qr_data || item.item_code}
                      size={68}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  {/* Serial & Location Footer */}
                  <div className="w-full pt-1 border-t border-slate-900 space-y-0.5">
                    <div className="font-mono text-[11px] font-black tracking-wider text-slate-900 bg-slate-100 rounded py-0.5">
                      {item.item_code}
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-700 font-semibold px-0.5">
                      <span className="truncate max-w-[130px]" title={formattedLoc}>📍 {formattedLoc}</span>
                      <span className="shrink-0">{item.condition}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500 print:hidden">
          <span>Tip: In printer settings, set margins to &quot;None&quot; and enable &quot;Background graphics&quot; for crisp borders.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
