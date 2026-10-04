'use client';

import React from 'react';
import Image from 'next/image';
import { Prop } from '@/types/database';
import { useRole } from '@/context/RoleContext';
import { formatINR } from '@/lib/utils';
import { formatHumanLocation } from '@/lib/services/inventory';
import {
  X,
  MapPin,
  Scale,
  Maximize2,
  Tag,
  Film,
  CheckCircle2,
  AlertCircle,
  Plus,
  ShieldAlert,
  Percent
} from 'lucide-react';

interface PropDetailModalProps {
  prop: Prop | null;
  onClose: () => void;
}

export function PropDetailModal({ prop, onClose }: PropDetailModalProps) {
  const { addToCart } = useRole();

  if (!prop) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#0f111a] border border-amber-500/40 shadow-2xl overflow-hidden my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/70 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image Gallery */}
          <div className="relative bg-black flex flex-col justify-center items-center min-h-[340px] md:min-h-[480px] p-6 border-b md:border-b-0 md:border-r border-amber-500/20">
            <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-inner">
              <Image
                src={prop.images[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'}
                alt={prop.title}
                fill
                className="object-cover"
              />
            </div>
            {prop.images.length > 1 && (
              <div className="flex items-center gap-2 mt-4">
                {prop.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-14 h-14 rounded-lg overflow-hidden border border-amber-500/40 opacity-80 hover:opacity-100 cursor-pointer"
                  >
                    <Image src={img} alt={`Thumbnail ${i}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Prop Specifications & Rental Rates */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {prop.category}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                  {prop.era}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span>{formatHumanLocation(undefined, `G1-F${prop.floor}-R${prop.rack}`)}</span>
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-white font-serif leading-tight">
                {prop.title}
              </h2>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {prop.description}
              </p>

              {/* Film Credits */}
              {prop.film_credits && prop.film_credits.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Notable Film Productions:</span>
                  </div>
                  <div className="text-slate-300">
                    {prop.film_credits.join(' • ')}
                  </div>
                </div>
              )}

              {/* Physical Warehouse Specs */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Dimensions</div>
                    <div className="font-semibold text-slate-200">{prop.dimensions}</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Unit Weight</div>
                    <div className="font-semibold text-slate-200">{prop.weight_kg} kg</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Warehouse Location</div>
                    <div className="font-semibold text-slate-200">Floor {prop.floor}, {prop.rack} ({prop.bin || 'Bay 1'})</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400">Availability</div>
                    <div className="font-semibold text-emerald-400">
                      {prop.available_units} of {prop.total_units} units available
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing breakdown: 20% standard rate */}
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-[#181c28] to-[#10131d] border border-amber-500/30">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-slate-400">Full Replacement Value:</span>
                  <span className="text-sm font-semibold text-slate-300">{formatINR(prop.replacement_value)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-slate-800 pt-2">
                  <div>
                    <span className="text-sm font-bold text-amber-300">Daily Rental Rate:</span>
                    <span className="text-[10px] text-amber-400/80 block">(20% Standard Calculation)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold gold-gradient-text font-serif">
                      {formatINR(prop.daily_rental_rate)}
                    </span>
                    <span className="text-xs text-slate-400"> / day</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
              <button
                onClick={() => {
                  addToCart(prop);
                  onClose();
                }}
                disabled={prop.available_units <= 0}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  prop.available_units > 0
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{prop.available_units > 0 ? 'Add to RFQ Quotation Cart' : 'All Units Out on Shoot'}</span>
              </button>

              <button
                onClick={onClose}
                className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
