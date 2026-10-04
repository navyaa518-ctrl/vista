'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  Home,
  LayoutGrid,
  FileText,
  Calendar,
  Bell,
  Folder,
  BarChart2,
  HelpCircle,
  ChevronsLeft,
  Layers,
  FolderTree,
  Grid3X3,
  QrCode,
  ShoppingCart,
  Smartphone,
  ClipboardList,
  ClipboardCheck,
  ScanLine,
  Truck,
  RotateCcw,
  CreditCard,
  TrendingUp,
  Users,
  HardHat,
  AlertTriangle,
  Receipt,
  MapPin,
  Package,
  User,
} from 'lucide-react';

export function Sidebar({ currentSection = 'billing' }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(true);

  const isSalesSection = currentSection === 'sales' || pathname?.startsWith('/sales');

  // Dedicated Sales Executive Navigation Groups
  const salesNavGroups = [
    {
      title: 'DASHBOARD',
      items: [
        {
          title: 'Executive Overview',
          href: '/sales/dashboard',
          icon: <LayoutGrid className="w-3.5 h-3.5" />,
          badge: 'Active',
        },
      ],
    },
    {
      title: 'ASSIGNED ORDERS',
      items: [
        {
          title: 'Live Orders Queue',
          href: '/sales/orders',
          icon: <ScanLine className="w-3.5 h-3.5" />,
          badge: 'Pick',
        },
      ],
    },
    {
      title: 'WAREHOUSE AUDITS',
      items: [
        {
          title: 'Health Inspections',
          href: '/sales/inspections',
          icon: <ClipboardCheck className="w-3.5 h-3.5" />,
          badge: 'Audit',
        },
      ],
    },
    {
      title: 'CATALOG TOOLS',
      items: [
        {
          title: 'Prop Rate Lookup',
          href: '/sales/catalog-lookup',
          icon: <QrCode className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      title: 'EXECUTIVE ACCOUNT',
      items: [
        {
          title: 'Profile & Security',
          href: '/sales/profile',
          icon: <User className="w-3.5 h-3.5" />,
        },
      ],
    },
  ];

  // Dedicated Billing Navigation Configuration strictly matching requirements
  // 6 Allowed Sections only - STRICTLY EXCLUDED: Cloud & Team, People & Teams, Security System, System Admin
  const billingNavGroups = [
    {
      title: 'DASHBOARD',
      items: [
        {
          title: 'Overview',
          href: '/billing/dashboard',
          icon: <LayoutGrid className="w-3.5 h-3.5" />,
          badge: 'Active',
        },
      ],
    },
    {
      title: 'INVENTORY 360',
      items: [
        {
          title: 'Props Catalog',
          href: '/billing/inventory/catalog',
          icon: <Layers className="w-3.5 h-3.5" />,
        },
        {
          title: 'Categories',
          href: '/billing/inventory/categories',
          icon: <FolderTree className="w-3.5 h-3.5" />,
        },
        {
          title: 'Rack Map',
          href: '/billing/inventory/rack-map',
          icon: <Grid3X3 className="w-3.5 h-3.5" />,
        },
        {
          title: 'Bulk QR Tags',
          href: '/billing/inventory/bulk-qr',
          icon: <QrCode className="w-3.5 h-3.5" />,
        },
        {
          title: 'Property Health & Audits',
          href: '/billing/inventory/health-audits',
          icon: <ClipboardCheck className="w-3.5 h-3.5" />,
          badge: 'Audit',
        },
      ],
    },
    {
      title: 'ACTIVE ORDERS',
      items: [
        {
          title: 'Walk-in Live Cart',
          href: '/billing/orders/live-cart',
          icon: <ShoppingCart className="w-3.5 h-3.5" />,
        },
        {
          title: 'Web App Orders',
          href: '/billing/orders/web',
          icon: <Smartphone className="w-3.5 h-3.5" />,
        },
        {
          title: 'Requests',
          href: '/billing/orders/requests',
          icon: <ClipboardList className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      title: 'RENTAL PIPELINE',
      items: [
        {
          title: 'Picking Tasks',
          href: '/billing/rental/picking',
          icon: <ScanLine className="w-3.5 h-3.5" />,
        },
        {
          title: 'Dispatched Props',
          href: '/billing/rental/dispatched',
          icon: <Truck className="w-3.5 h-3.5" />,
        },
        {
          title: 'Returned & Inspect',
          href: '/billing/rental/returned',
          icon: <RotateCcw className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      title: 'CREW HUB',
      items: [
        {
          title: 'Live Deployment Board',
          href: '/billing/crew/deployment',
          icon: <HardHat className="w-3.5 h-3.5" />,
          badge: 'Live',
        },
        {
          title: 'Daily Attendance & Logs',
          href: '/billing/crew/attendance',
          icon: <MapPin className="w-3.5 h-3.5" />,
        },
        {
          title: 'Crew Directory & Profiles',
          href: '/billing/crew/directory',
          icon: <Users className="w-3.5 h-3.5" />,
        },
        {
          title: 'Damage & Incident Reports',
          href: '/billing/crew/incidents',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        },
        {
          title: 'Labor Sheet & Vouchers',
          href: '/billing/crew/vouchers',
          icon: <Receipt className="w-3.5 h-3.5" />,
          badge: 'New',
        },
      ],
    },
    {
      title: 'REVENUE & FINANCE',
      items: [
        {
          title: 'Invoices',
          href: '/billing/finance/invoices',
          icon: <FileText className="w-3.5 h-3.5" />,
        },
        {
          title: 'Operating Expenses',
          href: '/billing/finance/expenses',
          icon: <CreditCard className="w-3.5 h-3.5" />,
        },
        {
          title: 'Sales Analytics',
          href: '/billing/finance/analytics',
          icon: <TrendingUp className="w-3.5 h-3.5" />,
        },
        {
          title: 'Salaries',
          href: '/billing/finance/salaries',
          icon: <Users className="w-3.5 h-3.5" />,
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen sticky top-0 z-40 bg-white border-r border-slate-200 select-none shadow-sm">
      {/* 1. EXTREME LEFT ICON DOCK RAIL (100% Fidelity with Admin Sidebar) */}
      <div className="w-14 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col items-center justify-between py-3">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Menu Hamburger */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Toggle Menu Drawer"
            id="billing-sidebar-toggle-btn"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Icon Dock Items */}
          <div className="flex flex-col items-center gap-2 w-full px-2">
            <Link
              href="/"
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              title="Home Portal"
            >
              <Home className="w-4 h-4" />
            </Link>

            {isSalesSection ? (
              <>
                <Link
                  href="/sales/dashboard"
                  className={`p-2 rounded-lg transition-all ${
                    pathname === '/sales/dashboard'
                      ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Sales Dashboard"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Link>

                <Link
                  href="/sales/orders"
                  className={`p-2 rounded-lg transition-all ${
                    pathname?.startsWith('/sales/orders')
                      ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Assigned Orders"
                >
                  <ScanLine className="w-4 h-4" />
                </Link>

                <Link
                  href="/sales/inspections"
                  className={`p-2 rounded-lg transition-all ${
                    pathname?.startsWith('/sales/inspections')
                      ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Health Inspections"
                >
                  <ClipboardCheck className="w-4 h-4" />
                </Link>

                <Link
                  href="/sales/catalog-lookup"
                  className={`p-2 rounded-lg transition-all ${
                    pathname === '/sales/catalog-lookup'
                      ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Prop Rate Lookup"
                >
                  <QrCode className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/billing/dashboard"
                  className={`p-2 rounded-lg transition-all ${
                    pathname === '/billing/dashboard' || pathname === '/billing'
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Billing Dashboard"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Link>

                <Link
                  href="/billing/finance/invoices"
                  className={`p-2 rounded-lg transition-all ${
                    pathname?.includes('/billing/finance')
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Finance & Invoices"
                >
                  <FileText className="w-4 h-4" />
                </Link>

                <Link
                  href="/billing/orders/live-cart"
                  className={`p-2 rounded-lg transition-all ${
                    pathname?.includes('/billing/orders')
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Live Orders & Cart"
                >
                  <Calendar className="w-4 h-4" />
                </Link>

                <Link
                  href="/billing/rental/dispatched"
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors relative"
                  title="Rental Pipeline"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-sky-500" />
                </Link>

                <Link
                  href="/billing/crew/deployment"
                  className={`p-2 rounded-lg transition-all ${
                    pathname?.includes('/billing/crew')
                      ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Crew Hub"
                >
                  <HardHat className="w-4 h-4" />
                </Link>

                <Link
                  href="/billing/inventory/catalog"
                  className={`p-2 rounded-lg transition-all ${
                    pathname?.includes('/billing/inventory')
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  title="Inventory 360"
                >
                  <Folder className="w-4 h-4" />
                </Link>

                <Link
                  href="/billing/finance/analytics"
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Sales Analytics"
                >
                  <BarChart2 className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom Help Icon */}
        <div className="pt-2">
          <Link
            href={isSalesSection ? '/sales/dashboard' : '/billing/dashboard'}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors block"
            title="Help & Operations"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. MAIN DRAWER MENU PANEL */}
      {drawerOpen && (
        <div className="w-56 flex-shrink-0 bg-white flex flex-col justify-between transition-all duration-200">
          {/* Drawer Header with Logo & Section tag */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
            <Link href={isSalesSection ? '/sales/dashboard' : '/billing/dashboard'} className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-sm shadow-sm ${
                isSalesSection
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950'
                  : 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white'
              }`}>
                {isSalesSection ? 'S' : 'B'}
              </div>
              <div className="leading-tight">
                <div className="font-bold text-slate-900 text-xs tracking-wider flex items-center gap-1.5">
                  <span>ASHWA</span>
                  <span className={`text-[9px] font-semibold px-1 py-0.2 rounded uppercase tracking-tighter ${
                    isSalesSection ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-800'
                  }`}>
                    {isSalesSection ? 'SALES' : 'OPS'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                  {isSalesSection ? 'Rental Sales Field Ops' : 'Billing & Commercial Desk'}
                </div>
              </div>
            </Link>

            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Collapse Menu"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
            {(isSalesSection ? salesNavGroups : billingNavGroups).map((grp, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 select-none">
                  {grp.title}
                </div>

                <div className="space-y-0.5">
                  {grp.items.map((item, iIdx) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={iIdx}
                        href={item.href}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                          isActive
                            ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={isActive ? (isSalesSection ? 'text-amber-600' : 'text-sky-600') : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </div>

                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            item.badge === 'Live' || item.badge === 'Pick'
                              ? 'bg-amber-100 text-amber-800'
                              : item.badge === 'Audit'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR FOR TOUCH VIEWPORTS */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <Link
          href={isSalesSection ? '/sales/dashboard' : '/billing/dashboard'}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold ${
            pathname?.includes('dashboard') ? (isSalesSection ? 'text-amber-600' : 'text-sky-600') : 'text-slate-500'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Overview</span>
        </Link>

        <Link
          href={isSalesSection ? '/sales/orders' : '/billing/orders/live-cart'}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold ${
            pathname?.includes('/orders') ? (isSalesSection ? 'text-amber-600' : 'text-sky-600') : 'text-slate-500'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>Orders</span>
        </Link>

        <Link
          href={isSalesSection ? '/sales/inspections' : '/billing/inventory/health-audits'}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold ${
            pathname?.includes('/inspections') || pathname?.includes('/health-audits') ? (isSalesSection ? 'text-amber-600' : 'text-sky-600') : 'text-slate-500'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Audits</span>
        </Link>

        <Link
          href={isSalesSection ? '/sales/catalog-lookup' : '/billing/inventory/catalog'}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold ${
            pathname?.includes('/catalog') ? (isSalesSection ? 'text-amber-600' : 'text-sky-600') : 'text-slate-500'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Lookup</span>
        </Link>

        <Link
          href={isSalesSection ? '/sales/profile' : '/billing/finance/invoices'}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold ${
            pathname?.includes('/profile') || pathname?.includes('/finance') ? (isSalesSection ? 'text-amber-600' : 'text-sky-600') : 'text-slate-500'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{isSalesSection ? 'Profile' : 'Billing'}</span>
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;
