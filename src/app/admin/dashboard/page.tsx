'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  MoreHorizontal,
  ShoppingCart,
  Coins,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { ordersService } from '@/lib/services/orders';
import { WalkInOrder } from '@/types/orders';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<WalkInOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const ords = await ordersService.getOrders();
        setOrders(ords);
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Live Cart Actions data matching screenshot
  const liveCartActions = [
    {
      orderNo: 'PSM02',
      orderId: 'c1000000-0000-0000-0000-000000000014',
      movieProject: 'Pushpa 2 VFX',
      production: 'SSMB23 Production',
      scannedBy: 'Ravi Kumar',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
      scannedAt: 'June 18, 2024 10:20:09 PM',
      propId: 'ASH-ELEC-0061',
      propName: 'SSMB23 Production Electronics',
      quantity: 10,
    },
    {
      orderNo: 'SSMB29',
      orderId: 'c1000000-0000-0000-0000-000000000052',
      movieProject: 'Game Changer Set',
      production: 'Game Changer Set',
      scannedBy: 'Vikram Singh',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
      scannedAt: 'June 18, 2024 10:20:09 PM',
      propId: 'ASH-FURN-0062',
      propName: 'Game Changer Set Throne Chair',
      quantity: 3,
    },
    {
      orderNo: 'SSMB33',
      orderId: 'c1000000-0000-0000-0000-000000000038',
      movieProject: 'Kalki Cinematic Unit',
      production: 'Kalki Cinematic Unit',
      scannedBy: 'Priya Sharma',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
      scannedAt: 'June 18, 2024 10:20:00 PM',
      propId: 'ASH-OPT-0063',
      propName: 'Kalki Cinematic Unit Arri 4K',
      quantity: 10,
    },
    {
      orderNo: 'CSMB03',
      orderId: 'c1000000-0000-0000-0000-000000000077',
      movieProject: 'Thandel VFX',
      production: 'Thandel VFX',
      scannedBy: 'Kiran Varma',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80',
      scannedAt: 'June 18, 2024 10:20:01 PM',
      propId: 'ASH-PROP-0064',
      propName: 'Thandel VFX Action Rig',
      quantity: 1,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in font-sans text-slate-800">
      {/* =====================================================================
          TOP SECTION: 4 COLUMNS (Prop Stock, Warehouse, Revenue, Right Stack)
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* CARD 1: Prop Stock Summary (4 cols) */}
        <div className="xl:col-span-4 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Prop Stock Summary</h3>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3">
            {/* Left Column: Categories & Specific Prop list */}
            <div className="space-y-3">
              {/* Category Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Electronics
                  </span>
                  <span className="font-bold text-slate-900 font-mono">200k+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Vintage Furniture
                  </span>
                  <span className="font-bold text-slate-900 font-mono">1.50k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Vehicles
                  </span>
                  <span className="font-bold text-slate-900 font-mono">1.50k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Costumes
                  </span>
                  <span className="font-bold text-slate-900 font-mono">200</span>
                </div>
              </div>

              {/* Specific Prop Inventory List */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Specific Prop
                </span>
                <div className="text-[11px] font-mono space-y-0.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>unique C0061</span>
                    <strong className="text-slate-900">150</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>unique C0062</span>
                    <strong className="text-slate-900">130</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>unique C0063</span>
                    <strong className="text-slate-900">5</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>unique C0064</span>
                    <strong className="text-slate-900">2</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>unique C0065</span>
                    <strong className="text-slate-900">1</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>unique C0066</span>
                    <strong className="text-slate-900">1</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Total Props Status & Donut Ring */}
            <div className="flex flex-col justify-between pl-2 border-l border-slate-100">
              {/* Total Props counts */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-800 block">Total Props</span>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      Available
                    </span>
                    <span className="font-bold text-slate-900 font-mono">155,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      On Rent
                    </span>
                    <span className="font-bold text-slate-900 font-mono">45,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Maintenance
                    </span>
                    <span className="font-bold text-slate-900 font-mono">200</span>
                  </div>
                </div>
              </div>

              {/* Condition Breakdown Donut Chart */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-600 block mb-1">
                  Condition Breakdown
                </span>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      {/* Background circle */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                      {/* Available (Blue ~65%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="4.5"
                        strokeDasharray="57 100"
                        strokeDashoffset="0"
                      />
                      {/* On Rent (Emerald ~25%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="4.5"
                        strokeDasharray="22 100"
                        strokeDashoffset="-57"
                      />
                      {/* Minor Maintenance (Amber ~10%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="4.5"
                        strokeDasharray="9 100"
                        strokeDashoffset="-79"
                      />
                    </svg>
                  </div>

                  <div className="text-[9px] text-slate-500 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span>Elect (65%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>90% Rent</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Other</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Maint</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Warehouse Capacity (3 cols) */}
        <div className="xl:col-span-3 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Warehouse Capacity</h3>
              <span className="text-[10px] text-slate-400">Multi-floor map</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900 block leading-tight font-mono">78% Filled</span>
              <button className="text-slate-400 hover:text-slate-600 p-0.5">
                <MoreHorizontal className="w-3.5 h-3.5 inline" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 items-center">
            {/* Left: Godown 1 & 2 Map Grid */}
            <div className="space-y-3">
              {/* Godown 1 */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">Godown 1</span>
                  <span>F1: 70% • F2: 70%</span>
                </div>
                {/* Visual rack bars */}
                <div className="flex items-end gap-1 h-12 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <div className="w-2.5 h-[70%] bg-sky-500 rounded-xs" />
                  <div className="w-2.5 h-[85%] bg-sky-500 rounded-xs" />
                  <div className="w-2.5 h-[60%] bg-sky-500 rounded-xs" />
                  <div className="w-2.5 h-[40%] bg-sky-300 rounded-xs" />
                  <div className="w-2.5 h-[75%] bg-sky-500 rounded-xs" />
                </div>
              </div>

              {/* Godown 2 */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">Godown 2</span>
                  <span>F1: 72% • F2: 60%</span>
                </div>
                {/* Visual rack grid */}
                <div className="grid grid-cols-4 gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-100 h-10">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        i % 3 === 0 ? 'bg-sky-500' : i % 2 === 0 ? 'bg-sky-300' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Dual Circular Radial Progress Gauges */}
            <div className="flex flex-col items-center justify-center gap-3">
              {/* Gauge 1 (78%) */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="4"
                    strokeDasharray="68 100"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-900 font-mono">78%</span>
              </div>

              {/* Gauge 2 (72%) */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="4"
                    strokeDasharray="63 100"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-900 font-mono">72%</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Revenue Pulse (YTD) (3 cols) */}
        <div className="xl:col-span-3 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Revenue Pulse (YTD)</h3>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Metrics summary row */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-left">
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block leading-tight">
                Monthly Rental
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono">2008K+</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block leading-tight">
                Total Revenue
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono">₹1.85Cr</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block leading-tight">
                Net Profit
              </span>
              <span className="text-sm font-bold text-emerald-600 font-mono">₹52L</span>
            </div>
          </div>

          {/* Smooth SVG Area Chart with Blue Gradient */}
          <div className="pt-2">
            <div className="relative h-24 w-full">
              <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal reference gridlines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />

                {/* Area fill */}
                <path
                  d="M 0 65 Q 30 75 60 55 T 120 40 T 180 30 T 240 60 T 300 25 L 300 100 L 0 100 Z"
                  fill="url(#revenueGrad)"
                />
                {/* Line stroke */}
                <path
                  d="M 0 65 Q 30 75 60 55 T 120 40 T 180 30 T 240 60 T 300 25"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* X-axis months */}
            <div className="flex justify-between text-[8px] text-slate-400 font-medium pt-1 px-1">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </div>
        </div>

        {/* CARD 4: Stacked Right KPI Widgets (2 cols) */}
        <div className="xl:col-span-2 flex flex-col justify-between gap-3">
          {/* Today's Sales */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Today's Sales</span>
              <span className="text-base font-bold text-slate-900 font-mono leading-tight">₹1,24,000</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>

          {/* Today's Collection */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Today's Collection</span>
              <span className="text-base font-bold text-slate-900 font-mono leading-tight">₹95,000</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Coins className="w-4 h-4" />
            </div>
          </div>

          {/* YTD Performance vs Target */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
            <span className="text-[10px] font-semibold text-slate-500 block leading-tight">
              YTD Performance vs Target
            </span>
            <div className="h-9 w-full mt-1">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                <path
                  d="M 0 24 Q 25 20 50 14 T 80 8 T 95 6"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="95" cy="6" r="3" fill="#0284c7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          BOTTOM SECTION: REALTIME LIVE CART ACTIONS & ACTIVE RENTAL PIPELINE
          ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Realtime Live Cart Actions (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Realtime Live Cart Actions</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-2">Order#</th>
                  <th className="py-2.5 px-2">Movie Project</th>
                  <th className="py-2.5 px-2">Production</th>
                  <th className="py-2.5 px-2">Scanned By</th>
                  <th className="py-2.5 px-2">Scanned At</th>
                  <th className="py-2.5 px-2">Prop ID</th>
                  <th className="py-2.5 px-2">Prop Name</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {liveCartActions.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order# */}
                    <td className="py-2.5 px-2 font-mono font-bold text-sky-600">
                      <Link
                        href={`/admin/orders/${row.orderId}/billing-cart`}
                        className="hover:underline flex items-center gap-0.5"
                      >
                        {row.orderNo}
                      </Link>
                    </td>

                    {/* Movie Project */}
                    <td className="py-2.5 px-2 font-semibold text-slate-900 whitespace-nowrap">
                      {row.movieProject}
                    </td>

                    {/* Production */}
                    <td className="py-2.5 px-2 text-slate-500 text-[11px] whitespace-nowrap">
                      {row.production}
                    </td>

                    {/* Scanned By Avatar */}
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5" title={row.scannedBy}>
                        <img
                          src={row.avatar}
                          alt={row.scannedBy}
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-[11px] text-slate-700 truncate max-w-[80px]">
                          {row.scannedBy.split(' ')[0]}
                        </span>
                      </div>
                    </td>

                    {/* Scanned At */}
                    <td className="py-2.5 px-2 text-slate-400 text-[10px] whitespace-nowrap font-mono">
                      {row.scannedAt}
                    </td>

                    {/* Prop ID with QR icon */}
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-slate-100 rounded border border-slate-200 flex items-center justify-center p-0.5">
                          <QRCodeSVG value={row.propId} size={16} />
                        </div>
                        <span className="font-mono text-[10px] text-slate-600">{row.propId}</span>
                      </div>
                    </td>

                    {/* Prop Name */}
                    <td className="py-2.5 px-2 text-slate-800 text-[11px] truncate max-w-[120px]">
                      {row.propName}
                    </td>

                    {/* Quantity */}
                    <td className="py-2.5 px-2 text-center font-bold font-mono text-slate-900">
                      {row.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Rental Pipeline (5 cols) */}
        <div className="xl:col-span-5 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Active Rental Pipeline</h3>
            <Link
              href="/admin/orders/pipeline"
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              <span>View Full</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Pipeline flow pills connected horizontally */}
          <div className="py-2">
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {/* Stage 1: In Picking */}
              <div className="p-2 rounded-xl bg-sky-50 border border-sky-200/70 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-sky-700 block">In Picking</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">12</span>
                <span className="text-[9px] text-slate-500">In Picking</span>
              </div>

              {/* Stage 2: Staged & Ready */}
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/70 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-emerald-700 block">Staged</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">6</span>
                <span className="text-[9px] text-slate-500">Staged</span>
              </div>

              {/* Stage 3: Dispatched */}
              <div className="p-2 rounded-xl bg-sky-50 border border-sky-200/70 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-sky-700 block">Dispatched</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">12</span>
                <span className="text-[9px] text-slate-500 font-mono">Lorry TS 09</span>
              </div>

              {/* Stage 4: Out on Rent */}
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/70 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-amber-700 block">On Rent</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">18</span>
                <span className="text-[9px] text-slate-500">On Set</span>
              </div>

              {/* Stage 5: Returns Audit */}
              <div className="p-2 rounded-xl bg-red-50 border border-red-200/70 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-red-700 block">Audit</span>
                <span className="text-base font-bold text-red-600 font-mono mt-0.5 block">4</span>
                <span className="text-[9px] text-slate-500">Returns</span>
              </div>
            </div>

            {/* Warning strip matching screenshot: Overdue Return Risk */}
            <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>Overdue Return Risk: 9000-SEE</span>
              </div>
              <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                32% Risk
              </span>
            </div>
          </div>

          {/* Bottom Card Summary info */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-500" />
              <span>Next Lorry Dispatch: <strong>TS 09 UA 8842</strong> (Ramoji Film City)</span>
            </div>
            <Link
              href="/admin/orders/pipeline"
              className="text-sky-600 hover:text-sky-700 font-bold text-[11px] flex items-center gap-0.5"
            >
              Manage &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
