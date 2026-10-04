'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PropItem, Prop } from '@/types/database';
import { formatHumanLocation } from '@/lib/services/inventory';
import { X, Printer } from 'lucide-react';

interface BulkQRPrintModalProps {
  items: { item: PropItem; prop: Prop }[];
  onClose: () => void;
}

export function BulkQRPrintModal({ items, onClose }: BulkQRPrintModalProps) {
  if (items.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-6 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0 no-print">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
              Bulk Warehouse Label Sheet
            </span>
            <h3 className="text-xl font-bold text-slate-900">
              Printing {items.length} Adhesive QR Stickers
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Formatted for standard A4 / Letter sticker sheets (2x4 label grid layout).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print All {items.length} Stickers</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print-page">
            {items.map(({ item, prop }) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white text-black border-2 border-slate-900 flex flex-col justify-between break-inside-avoid shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                  <div className="flex items-center gap-1">
                    <span className="font-serif font-black text-xs tracking-wider">ASHWA</span>
                    <span className="text-[8px] font-bold uppercase text-slate-500">PROPS</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded truncate max-w-[140px]" title={formatHumanLocation(undefined, `G1-F${item.floor}-R${item.rack}`)}>
                    📍 {formatHumanLocation(undefined, `G1-F${item.floor}-R${item.rack}`)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-1 bg-white border border-slate-200 rounded shrink-0">
                    <QRCodeSVG
                      value={item.qr_code_data || JSON.stringify({ serial: item.serial_number, propId: prop.id })}
                      size={80}
                      level="M"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black font-mono tracking-wider text-slate-900 truncate bg-slate-100 px-1 py-0.5 rounded border border-slate-300">
                      {item.serial_number}
                    </div>
                    <div className="text-[10px] font-bold text-slate-800 line-clamp-1 mt-1">
                      {prop.title}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      Repl: ₹{prop.replacement_value.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="text-[8px] text-slate-400 text-right mt-2 pt-1 border-t border-slate-100">
                  Unit Status: {item.status.toUpperCase()} • {item.condition}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
