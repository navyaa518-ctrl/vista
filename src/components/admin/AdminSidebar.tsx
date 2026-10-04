'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Settings,
  HelpCircle,
  ChevronsLeft,
  ChevronsRight,
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
  Database,
  UserCheck,
  MapPin,
  Shield,
  HardHat,
  AlertTriangle,
  Receipt,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(true);

  // Categorized Navigation groups matching user screenshot exactly
  const navGroups: NavGroup[] = [
    {
      title: 'DASHBOARD',
      items: [
        {
          title: 'Overview',
          href: '/admin/dashboard',
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
          href: '/admin/warehouse/inventory',
          icon: <Layers className="w-3.5 h-3.5" />,
        },
        {
          title: 'Categories',
          href: '/admin/warehouse/categories',
          icon: <FolderTree className="w-3.5 h-3.5" />,
        },
        {
          title: 'Rack Map',
          href: '/admin/inventory/metrics',
          icon: <Grid3X3 className="w-3.5 h-3.5" />,
        },
        {
          title: 'Bulk QR Tags',
          href: '/admin/inventory/stock',
          icon: <QrCode className="w-3.5 h-3.5" />,
        },
        {
          title: 'Property Health & Audits',
          href: '/admin/inventory/audits',
          icon: <ClipboardCheck className="w-3.5 h-3.5" />,
          badge: 'Audit',
        },
      ],
    },
    {
      title: 'ACTIVE ORDERS',
      items: [
        {
          title: 'Walk-In Live Cart',
          href: '/admin/orders/walk-in',
          icon: <ShoppingCart className="w-3.5 h-3.5" />,
        },
        {
          title: 'Web App Orders',
          href: '/admin/orders/app',
          icon: <Smartphone className="w-3.5 h-3.5" />,
        },
        {
          title: 'Requests',
          href: '/admin/orders/create',
          icon: <ClipboardList className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      title: 'RENTAL PIPELINE',
      items: [
        {
          title: 'Picking Tasks',
          href: '/ops/scanner',
          icon: <ScanLine className="w-3.5 h-3.5" />,
        },
        {
          title: 'Dispatched Props',
          href: '/admin/orders/pipeline',
          icon: <Truck className="w-3.5 h-3.5" />,
        },
        {
          title: 'Returned & Inspect',
          href: '/admin/orders/pipeline',
          icon: <RotateCcw className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      title: 'CREW HUB',
      items: [
        {
          title: 'Live Deployment Board',
          href: '/admin/crew/deployments',
          icon: <HardHat className="w-3.5 h-3.5" />,
          badge: 'Live',
        },
        {
          title: 'Daily Attendance & Logs',
          href: '/admin/crew/field-logs',
          icon: <MapPin className="w-3.5 h-3.5" />,
        },
        {
          title: 'Crew Directory & Profiles',
          href: '/admin/crew/members',
          icon: <Users className="w-3.5 h-3.5" />,
        },
        {
          title: 'Damage & Incident Reports',
          href: '/admin/crew/incidents',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        },
        {
          title: 'Labor Sheet & Vouchers',
          href: '/admin/crew/labor-sheet',
          icon: <Receipt className="w-3.5 h-3.5" />,
          badge: 'New',
        },
      ],
    },
    {
      title: 'REVENUE & REPORTS',
      items: [
        {
          title: 'Invoices',
          href: '/admin/finance/invoices',
          icon: <FileText className="w-3.5 h-3.5" />,
        },
        {
          title: 'Operating Expenses',
          href: '/admin/finance/expenses',
          icon: <CreditCard className="w-3.5 h-3.5" />,
        },
        {
          title: 'Sales Analytics',
          href: '/admin/dashboard',
          icon: <TrendingUp className="w-3.5 h-3.5" />,
        },
        {
          title: 'Salaries',
          href: '/admin/finance/payroll',
          icon: <Users className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      title: 'PEOPLE & TEAMS',
      items: [
        {
          title: 'Cloud Database',
          href: '/admin/settings',
          icon: <Database className="w-3.5 h-3.5" />,
        },
        {
          title: 'Staff Directory',
          href: '/admin/people/staff',
          icon: <UserCheck className="w-3.5 h-3.5" />,
          badge: 'HRMS',
        },
        {
          title: 'Field Ops',
          href: '/admin/people/field-ops',
          icon: <MapPin className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      title: 'SECURITY & SYSTEM',
      items: [
        {
          title: 'User Management',
          href: '/admin/users',
          icon: <UserCheck className="w-3.5 h-3.5 text-amber-500" />,
          badge: 'Super Admin',
        },
        {
          title: 'Security Roles',
          href: '/admin/settings/security-roles',
          icon: <Shield className="w-3.5 h-3.5" />,
        },
        {
          title: 'Teams & Access',
          href: '/admin/settings/teams',
          icon: <Users className="w-3.5 h-3.5" />,
        },
        {
          title: 'Cloud Settings',
          href: '/admin/settings',
          icon: <Settings className="w-3.5 h-3.5" />,
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen sticky top-0 z-40 bg-white border-r border-slate-200 select-none shadow-sm">
      {/* 1. EXTREME LEFT ICON DOCK RAIL (Matching Screenshot) */}
      <div className="w-14 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col items-center justify-between py-3">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Menu Hamburger */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Toggle Menu Drawer"
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

            <Link
              href="/admin/dashboard"
              className={`p-2 rounded-lg transition-all ${
                pathname === '/admin/dashboard'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Dashboard"
            >
              <LayoutGrid className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/finance/invoices"
              className={`p-2 rounded-lg transition-all ${
                pathname?.includes('/finance')
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Documents & Invoices"
            >
              <FileText className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/orders/walk-in"
              className={`p-2 rounded-lg transition-all ${
                pathname?.includes('/orders')
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Orders Calendar / Pipeline"
            >
              <Calendar className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/orders/pipeline"
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors relative"
              title="Pipeline Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </Link>

            <Link
              href="/admin/crew/deployments"
              className={`p-2 rounded-lg transition-all ${
                pathname?.includes('/admin/crew')
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Crew Hub & Field Fleet"
            >
              <HardHat className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/warehouse/inventory"
              className={`p-2 rounded-lg transition-all ${
                pathname?.includes('/warehouse')
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Inventory Folder"
            >
              <Folder className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/inventory/metrics"
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              title="Analytics"
            >
              <BarChart2 className="w-4 h-4" />
            </Link>

            <Link
              href="/admin/settings"
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Bottom Help Icon */}
        <div className="pt-2">
          <Link
            href="/admin/settings"
            className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors block"
            title="Help & Documentation"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 2. MAIN DRAWER MENU PANEL (Matching Screenshot) */}
      {drawerOpen && (
        <div className="w-56 flex-shrink-0 bg-white flex flex-col justify-between transition-all duration-200">
          {/* Drawer Header with Logo & Collapse Toggle */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-sky-400 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                A
              </div>
              <div className="leading-tight">
                <div className="font-bold text-slate-900 text-xs tracking-wider">ASHWA</div>
                <div className="text-[9px] text-slate-400 font-medium whitespace-nowrap">Movie Property Rentals</div>
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
            {navGroups.map((grp, gIdx) => (
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
                          <span className={isActive ? 'text-sky-600' : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </div>

                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700">
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
    </div>
  );
}
