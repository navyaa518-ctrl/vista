'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  HardHat,
  Truck,
  ClipboardCheck,
  AlertTriangle,
  QrCode,
  Shield,
  ArrowLeft,
  User,
  Radio,
  LogOut,
} from 'lucide-react';

export default function FieldPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, role, signOut, signInDemo } = useAuth();

  const workerName = profile?.full_name || 'Ramesh Babu (Senior Field Crew)';
  const badgeNo = 'ASH-FW-01';

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans">
      {/* Top Header Bar for Field Workers */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link href="/field/my-tasks" className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-xs">
                <HardHat className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight font-serif">
                    ASHWA
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200">
                    Field Ops
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  On-Site Crew &amp; Logistics Desk
                </p>
              </div>
            </Link>
          </div>

          {/* User Profile & Demo Switcher */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>Realtime Live Dispatch</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-100/80 pl-2.5 pr-1.5 py-1 rounded-xl border border-slate-200 text-xs">
              <div className="text-right">
                <strong className="block text-slate-900 font-bold leading-tight text-[11px] truncate max-w-[120px]">
                  {workerName}
                </strong>
                <span className="text-[9px] text-slate-500 font-mono block">
                  {badgeNo} • Field Crew
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-2xs">
                RB
              </div>
            </div>

            <Link
              href="/admin/dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Switch to Admin Dashboard"
            >
              <Shield className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Field Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-20 sm:pb-8">
        {children}
      </main>

      {/* Mobile Sticky Quick Action Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-6 flex items-center justify-around shadow-lg text-[10px] font-semibold text-slate-600">
        <Link
          href="/field/my-tasks"
          className="flex flex-col items-center gap-1 text-amber-600 font-bold"
        >
          <ClipboardCheck className="w-5 h-5" />
          <span>My Tasks</span>
        </Link>

        <Link
          href="/admin/orders/pipeline"
          className="flex flex-col items-center gap-1 hover:text-slate-900 transition-colors"
        >
          <Truck className="w-5 h-5" />
          <span>Pipeline</span>
        </Link>

        <Link
          href="/admin/inventory/props"
          className="flex flex-col items-center gap-1 hover:text-slate-900 transition-colors"
        >
          <QrCode className="w-5 h-5" />
          <span>Props Scan</span>
        </Link>
      </nav>
    </div>
  );
}
