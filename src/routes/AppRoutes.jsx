'use client';

import React from 'react';
import { RoleRouteGuard } from './RoleRouteGuard';
import { BillingDashboard } from '@/pages/billing/BillingDashboard';
import { Sidebar } from '@/components/layout/Sidebar';
import { BillingHeader } from '@/components/billing/BillingHeader';
import { SalesHeader } from '@/components/sales/SalesHeader';

/**
 * Enterprise Application Route Definitions & RBAC Boundaries
 */
export const APP_ROUTE_MANIFEST = {
  billing: {
    root: '/billing/dashboard',
    allowedRoles: ['billing', 'billing_manager', 'manager', 'admin', 'super_admin'],
    submodules: [
      { path: '/billing/dashboard', title: 'Billing Overview', exact: true },
      { path: '/billing/inventory/catalog', title: 'Props Catalog' },
      { path: '/billing/inventory/categories', title: 'Catalog Categories' },
      { path: '/billing/inventory/rack-map', title: 'Warehouse Rack Map' },
      { path: '/billing/inventory/bulk-qr', title: 'Bulk QR Tags' },
      { path: '/billing/inventory/health-audits', title: 'Property Health & Audits' },
      { path: '/billing/orders/live-cart', title: 'Walk-in Live Cart' },
      { path: '/billing/orders/web', title: 'Web App Orders' },
      { path: '/billing/orders/requests', title: 'Rental Requests' },
      { path: '/billing/rental/picking', title: 'Picking Tasks' },
      { path: '/billing/rental/dispatched', title: 'Dispatched Props' },
      { path: '/billing/rental/returned', title: 'Returned & Inspect' },
      { path: '/billing/crew/deployment', title: 'Crew Deployment Board' },
      { path: '/billing/crew/attendance', title: 'Crew Attendance Logs' },
      { path: '/billing/crew/directory', title: 'Crew Directory' },
      { path: '/billing/crew/incidents', title: 'Damage & Incidents' },
      { path: '/billing/crew/vouchers', title: 'Labor Sheets & Vouchers' },
      { path: '/billing/finance/invoices', title: 'Invoices & Settlements' },
      { path: '/billing/finance/expenses', title: 'Operating Expenses' },
      { path: '/billing/finance/analytics', title: 'Sales Analytics' },
      { path: '/billing/finance/salaries', title: 'Salaries & Payouts' },
    ],
  },
  admin: {
    root: '/admin/dashboard',
    allowedRoles: ['admin', 'super_admin'],
    submodules: [
      { path: '/admin/dashboard', title: 'Executive Operations Dashboard' },
      { path: '/admin/warehouse/inventory', title: 'Serialized Inventory' },
      { path: '/admin/warehouse/categories', title: 'Categories' },
      { path: '/admin/inventory/metrics', title: 'Warehouse Capacity & Metrics' },
      { path: '/admin/inventory/audits', title: 'Property Health Audits' },
      { path: '/admin/orders/pipeline', title: 'Live Order Pipeline' },
      { path: '/admin/crew/deployments', title: 'Crew Deployments' },
      { path: '/admin/finance/invoices', title: 'Admin Billing & Invoices' },
      { path: '/admin/settings/security-roles', title: 'Security Roles' },
      { path: '/admin/settings/teams', title: 'Teams & Access' },
      { path: '/admin/users', title: 'User & Staff Management' },
    ],
  },
  sales: {
    root: '/sales/dashboard',
    allowedRoles: ['rental_sales_exec', 'executive', 'admin', 'super_admin'],
    submodules: [
      { path: '/sales/dashboard', title: 'Sales Executive Overview', exact: true },
      { path: '/sales/orders', title: 'Assigned Orders' },
      { path: '/sales/inspections', title: 'Warehouse Health Inspections' },
      { path: '/sales/catalog-lookup', title: 'Prop Rate Lookup' },
      { path: '/sales/profile', title: 'Executive Profile & Account' },
    ],
  },
};

/**
 * SalesWorkspaceLayout: Dedicated workspace layout for Rental Sales Executive
 */
export function SalesWorkspaceLayout({ children }) {
  return (
    <RoleRouteGuard
      allowedRoles={['rental_sales_exec', 'executive', 'admin', 'super_admin']}
      deniedRedirect="/portal/my-rentals"
      deniedMessage="Access Denied: Rental Sales Executive Clearance Required"
    >
      <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900">
        <Sidebar currentSection="sales" />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <SalesHeader />
          <main className="flex-1 pb-16 md:pb-6">{children}</main>
        </div>
      </div>
    </RoleRouteGuard>
  );
}

/**
 * BillingWorkspaceLayout: Enforces 100% UI fidelity with Admin dashboard
 * Persistent Sidebar dock rail + Apple ERP Top Navigation Bar + High-Density Canvas
 */
export function BillingWorkspaceLayout({ children }) {
  return (
    <RoleRouteGuard
      allowedRoles={['billing', 'billing_manager', 'manager', 'admin', 'super_admin']}
      deniedRedirect="/portal/my-rentals"
      deniedMessage="Access Denied: Billing Operations Clearance Required"
    >
      <div className="min-h-screen bg-[#f4f6f8] flex font-sans antialiased text-slate-900">
        {/* Dedicated Billing Sidebar (Omits System Admin & People/Teams) */}
        <Sidebar currentSection="billing" />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {/* Top Navigation Bar with Live Status & Active Session Badge */}
          <BillingHeader />

          {/* High Density Ambient Page Canvas */}
          <main className="flex-1 p-5 md:p-6 bg-[#f4f6f8]">{children}</main>
        </div>
      </div>
    </RoleRouteGuard>
  );
}

/**
 * AdminWorkspaceLayout: Protects Admin Environment against Billing user cross-bleed
 */
export function AdminWorkspaceLayout({ children }) {
  return (
    <RoleRouteGuard
      allowedRoles={['admin', 'super_admin']}
      deniedRedirect="/billing/dashboard"
      deniedMessage="Access Denied: Administrative Clearance Required"
    >
      {children}
    </RoleRouteGuard>
  );
}

/**
 * AppRoutes Component
 */
export function AppRoutes() {
  return (
    <BillingWorkspaceLayout>
      <BillingDashboard />
    </BillingWorkspaceLayout>
  );
}

export default AppRoutes;
