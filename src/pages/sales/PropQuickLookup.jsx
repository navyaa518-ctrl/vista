'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Search,
  ScanLine,
  QrCode,
  Tag,
  MapPin,
  DollarSign,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { ordersService } from '@/lib/services/orders';
import { inventoryService } from '@/lib/services/inventory';

const DEMO_LOOKUP_TAGS = [
  'ASH-ELEC-MOU-0005',
  'ASH-PROP-0001',
  'ASH-FUR-001',
  'ASH-OPT-1942-01',
  'ASH-WEAP-GUN-0023',
];

export function PropQuickLookup() {
  const [queryCode, setQueryCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLookup = async (codeToSearch) => {
    const raw = (codeToSearch || queryCode).trim();
    if (!raw) return;

    setSearching(true);
    setErrorMsg(null);
    setResult(null);

    try {
      let cleanCode = raw;
      if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
        try {
          const parsed = JSON.parse(cleanCode);
          cleanCode = parsed.itemCode || parsed.code || cleanCode;
        } catch {
          // ignore
        }
      }
      cleanCode = cleanCode.toUpperCase();

      // Query Supabase directly
      let dbProp = null;
      try {
        const { data } = await supabase
          .from('props')
          .select('*')
          .or(`slug.ilike.%${cleanCode}%,title.ilike.%${cleanCode}%`)
          .limit(1)
          .maybeSingle();
        if (data) dbProp = data;
      } catch (e) {
        console.warn('Direct query warning:', e);
      }

      const validation = await ordersService.validatePropQR(cleanCode);

      if (!validation.valid && !dbProp) {
        setErrorMsg(validation.error || `Prop barcode '${cleanCode}' was not found in ASHWA property catalog.`);
        return;
      }

      const prop = validation.prop || dbProp;
      const item = validation.item;

      const replacementValue = Number(prop?.replacement_value || prop?.replacement_value_inr || 25000);
      const dailyRate = Number(
        prop?.daily_rental_rate ||
        prop?.daily_rent_price ||
        Math.round(replacementValue * 0.15) ||
        1200
      );

      setResult({
        itemCode: validation.itemCode || cleanCode,
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
        status: item?.status || 'Available',
        condition: item?.condition || 'Pristine / Film Ready',
        era: prop?.era || 'Mid-Century / Vintage',
      });
    } catch (err) {
      console.error('Lookup failed:', err);
      setErrorMsg('Failed to fetch property details.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6">
      {/* 1. TOP HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Floor Assistance Tool
            </span>
            <span className="text-xs text-slate-400 font-mono">Real-Time Pricing Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Prop Barcode & Live Rate Lookup
          </h1>
          <p className="text-xs text-slate-500">
            Scan or type any prop asset code to immediately view daily rental prices, warehouse rack coordinates, and stock reservation status.
          </p>
        </div>
      </div>

      {/* 2. SEARCH INPUT CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 max-w-2xl">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Property Barcode / Serial Number
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={queryCode}
                onChange={(e) => setQueryCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="Scan or type code (e.g., ASH-ELEC-MOU-0005)"
                className="w-full pl-10 pr-3 py-3 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => handleLookup()}
              disabled={searching || !queryCode.trim()}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              Lookup
            </button>
          </div>
        </div>

        {/* Demo Fast Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400">Quick Tags:</span>
          {DEMO_LOOKUP_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setQueryCode(tag);
                handleLookup(tag);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-[11px] font-mono font-semibold text-slate-700 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 3. RESULT CARD */}
      {result && (
        <div className="bg-white rounded-2xl border-2 border-amber-400 p-6 shadow-md max-w-2xl space-y-6 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-full sm:w-36 h-36 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
              <Image src={result.imageUrl} alt={result.title} fill className="object-cover" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                  {result.category}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700">
                  {result.itemCode}
                </span>
              </div>

              <h2 className="text-lg font-black text-slate-950 leading-tight">
                {result.title}
              </h2>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>Bay Position: <strong className="text-slate-900">{result.warehouseLocation}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Condition: <strong className="text-slate-900">{result.condition}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* High-Contrast Live Pricing Banner */}
          <div className="p-4 rounded-xl bg-slate-950 text-white flex items-center justify-between border border-amber-400/40">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Live Rental Rate
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-white">
                  ₹{result.dailyRate.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ shoot day</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Replacement Value</span>
              <span className="text-sm font-bold text-amber-300">
                ₹{result.replacementValue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropQuickLookup;
