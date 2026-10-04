'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Bell,
  ScanLine,
  User as UserIcon,
  LogOut,
  HardHat,
  Sparkles,
  Layers,
  ChevronDown,
  Building2,
  Phone,
  ShieldCheck,
} from 'lucide-react';

interface SalesHeaderProps {
  onOpenScanner?: () => void;
}

export function SalesHeader({ onOpenScanner }: SalesHeaderProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const executiveName = profile?.full_name || 'Ravi Kumar';
  const roleName = 'Senior Rental Sales Executive';
  const floor = profile?.floor_assigned || 1;

  const handleSignOut = async () => {
    await signOut();
    router.replace('/portal/my-rentals');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Active Workspace Badge */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-xs">
          <HardHat className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 tracking-tight">ASHWA SALES & OPS</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Floor {floor} Execution
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            On-Set & Warehouse Floor Executive Terminal
          </p>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Scan Action */}
        <Link
          href="/sales/orders"
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Active Orders</span>
        </Link>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center">
              {executiveName.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-slate-900 block leading-none">{executiveName}</span>
              <span className="text-[10px] text-slate-400 leading-none mt-0.5 block">{roleName}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in">
              <div className="p-3 border-b border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-900 block">{executiveName}</span>
                <span className="text-[11px] text-slate-500 block">sales@aswamovies.com</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block mt-1">
                  Floor {floor} Assigned Executive
                </span>
              </div>
              <div className="p-1 space-y-1">
                <Link
                  href="/sales/profile"
                  onClick={() => setProfileOpen(false)}
                  className="w-full p-2 text-left text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-900 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-amber-600" />
                  <span>Executive Profile & Security</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full p-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default SalesHeader;
