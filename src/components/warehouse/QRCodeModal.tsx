'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PropItem, Prop } from '@/types/database';
import { X, Printer } from 'lucide-react';

interface QRCodeModalProps {
  item: PropItem | null;
  prop: Prop | null;
  onClose: () => void;
}

export function QRCodeModal({ item, prop, onClose }: QRCodeModalProps) {
  if (!item || !prop) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Physical Asset Tag &amp; Barcode
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            {item.serial_number}
          </h3>
          <p className="text-xs text-slate-500">{prop.title}</p>
        </div>

        {/* The Printed Sticker Card Preview */}
        <div className="p-6 rounded-xl bg-white text-black border-2 border-slate-900 flex flex-col items-center justify-center shadow-md print-page">
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-4">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black text-sm tracking-wider">ASHWA</span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">
                • PROPS
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
              FLOOR {item.floor}
            </span>
          </div>

          {/* QR Code SVG */}
          <div className="p-2 border border-slate-200 rounded-lg bg-white shadow-xs">
            <QRCodeSVG
              value={item.qr_code_data || JSON.stringify({ serial: item.serial_number, propId: prop.id })}
              size={160}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Serial Number & Info */}
          <div className="text-center mt-3 space-y-1 w-full">
            <div className="text-base font-black font-mono tracking-widest text-slate-900 bg-slate-100 py-1 rounded border border-slate-300">
              {item.serial_number}
            </div>
            <div className="text-[11px] font-bold text-slate-800 line-clamp-1">
              {prop.title}
            </div>
            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600 pt-1 border-t border-slate-200">
              <span>{item.rack} ({item.bin || 'Bay 1'})</span>
              <span>Repl: ₹{prop.replacement_value.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Thermal Sticker</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
