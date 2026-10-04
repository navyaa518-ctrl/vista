'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Truck, Film } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
  const { user, role } = useAuth();

  const isOfficeRoute =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/ops') ||
    pathname?.startsWith('/warehouse') ||
    pathname?.startsWith('/billing');

  const isOfficeStaff = !!user && (role === 'super_admin' || role === 'admin' || role === 'manager' || role === 'executive');

  // Hide customer footer for office staff or on internal office routes
  if (isOfficeRoute || isOfficeStaff) {
    return null;
  }

  return (
    <footer className="w-full bg-[#06070a] border-t border-amber-500/20 text-slate-400 text-sm no-print">
      {/* Decorative Gold Divider */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Logo */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="relative w-48 h-20">
                <Image
                  src="/assets/logo.png"
                  alt="ASHWA Movie Property Rentals"
                  fill
                  sizes="192px"
                  className="object-contain object-left"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              South Asia’s premier cinematic property house managing 200,000+ movie props across 50,000 sq.ft. of rack-mapped, climate-controlled studio warehouse space.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Registered Film Vendor &amp; GST Certified</span>
            </div>
          </div>

          {/* Col 2: Warehouse Floors */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Warehouse Facility
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-200">Floor 1 (Heavy Sets):</span>
                <p className="text-slate-400 mt-0.5">
                  Racks A to D. Period furniture, royal thrones, vintage vehicles, armory &amp; bronze statues.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-slate-200">Floor 2 (Precision &amp; Tech):</span>
                <p className="text-slate-400 mt-0.5">
                  Racks E to J. Studio cameras, CRT monitors, cyberpunk props, jewelry vault &amp; wardrobe.
                </p>
              </div>
            </div>
          </div>

          {/* Col 3: Quick Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/catalog" className="hover:text-amber-300 transition-colors flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-amber-400/80" />
                  Props Catalog &amp; 20% Estimator
                </Link>
              </li>
              <li>
                <Link href="/warehouse/inventory" className="hover:text-amber-300 transition-colors flex items-center gap-2">
                  <span className="text-amber-400">#</span>
                  Bulk QR Code Sticker Generator
                </Link>
              </li>
              <li>
                <Link href="/warehouse/picking" className="hover:text-amber-300 transition-colors flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  Real-time Multi-Executive Scanner
                </Link>
              </li>
              <li>
                <Link href="/billing" className="hover:text-amber-300 transition-colors flex items-center gap-2">
                  <span className="text-amber-400">₹</span>
                  Counter Terminal, Gate Pass &amp; Invoicing
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Dispatch & Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Dispatch &amp; Contact
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Plot 42, Film City Logistics Corridor, Hyderabad, TG 501512</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91 98480 99000 / +91 40 2345 8899</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>dispatch@ashwamovieprops.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Warehouse: 24/7 Production Dispatch</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ASHWA Movie Property Rentals Ltd. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 text-[11px] text-amber-300/60">
            Standard Prop Rental: 20% Replacement Value / Day • Security Deposit Required • RLS Secured
          </p>
        </div>
      </div>
    </footer>
  );
}
