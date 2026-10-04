'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle, X } from 'lucide-react';

const STORAGE_KEY = 'ashwa_active_session';

/**
 * Event-based Global Toast Dispatcher for RBAC Interceptions
 */
export function triggerAccessDeniedToast(message = 'Access Denied: Administrative Clearance Required') {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('ashwa_rbac_toast', {
      detail: { type: 'error', message },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Global RBAC Toast Banner Component
 */
export function RbacToastBanner() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleToastEvent = (e) => {
      if (e.detail) {
        setToast(e.detail);
        const timer = setTimeout(() => {
          setToast(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('ashwa_rbac_toast', handleToastEvent);
    return () => window.removeEventListener('ashwa_rbac_toast', handleToastEvent);
  }, []);

  if (!toast) return null;

  return (
    <div
      role="alert"
      id="rbac-toast-notification"
      className="fixed top-5 right-5 z-[9999] max-w-md p-4 rounded-2xl bg-rose-900/95 border border-rose-500/80 text-white shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-top-4 duration-200"
    >
      <div className="w-8 h-8 rounded-xl bg-rose-800 text-rose-200 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-4 h-4 text-rose-300" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="text-xs font-bold text-white tracking-tight">Security Clearance Block</h4>
        <p className="text-xs text-rose-200 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => setToast(null)}
        className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-800/80 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * RoleRouteGuard: Strict Bidirectional Route Guard separating Admin and Billing
 *
 * Rules:
 * 1. Role `billing` or `billing_manager`:
 *    - Root route MUST be `/billing/dashboard`.
 *    - If user attempts `/admin` or `/admin/*`, intercept immediately, show
 *      "Access Denied: Administrative Clearance Required" toast, and keep securely on `/billing/dashboard`.
 * 2. Role `admin` or `super_admin`:
 *    - Root route MUST be `/admin/dashboard`.
 *    - Admin sessions must NEVER be bounced or redirected into `/billing/*`.
 */
export function RoleRouteGuard({
  children,
  allowedRoles,
  deniedRedirect,
  deniedMessage = 'Access Denied: Administrative Clearance Required',
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, loading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // 1. Immediately read cached role from storage if auth state is resolving
    let currentRole = role;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.role) currentRole = parsed.role;
        }
      } catch (e) {
        // Ignore
      }
    }

    const isBillingRole =
      currentRole === 'billing' || currentRole === 'billing_manager' || currentRole === 'manager';
    const isAdminRole = currentRole === 'admin' || currentRole === 'super_admin';
    const isSalesRole = currentRole === 'rental_sales_exec' || currentRole === 'executive';

    // 2. Strict Interception for Sales Executives trying to access Admin or Billing routes
    if (isSalesRole && (pathname?.startsWith('/admin') || pathname?.startsWith('/billing'))) {
      triggerAccessDeniedToast('Access Denied: Administrative or Commercial Billing Clearance Required');
      router.replace('/sales/dashboard');
      setAuthorized(false);
      return;
    }

    // 3. Strict Interception for Billing Users trying to access Admin routes
    if (isBillingRole && pathname?.startsWith('/admin')) {
      triggerAccessDeniedToast(deniedMessage);
      router.replace('/billing/dashboard');
      setAuthorized(false);
      return;
    }

    // 4. Strict Check: Admin sessions must NEVER be bounced or redirected into /billing/*
    if (isAdminRole && pathname?.startsWith('/admin')) {
      setAuthorized(true);
      return;
    }

    // 5. Role list verification if allowedRoles is provided
    if (allowedRoles && allowedRoles.length > 0) {
      if (allowedRoles.includes(currentRole)) {
        setAuthorized(true);
      } else {
        const targetRedirect = isSalesRole
          ? '/sales/dashboard'
          : isBillingRole
          ? '/billing/dashboard'
          : isAdminRole
          ? '/admin/dashboard'
          : deniedRedirect || '/sales/dashboard';

        triggerAccessDeniedToast(deniedMessage);
        router.replace(targetRedirect);
        setAuthorized(false);
      }
      return;
    }

    setAuthorized(true);
  }, [pathname, role, allowedRoles, deniedRedirect, deniedMessage, router]);

  // While checking authorization, show a clean, ambient loading placeholder
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-6 text-slate-600">
        <RbacToastBanner />
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          <span className="text-xs font-medium tracking-tight">Verifying security clearance...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <RbacToastBanner />
      {children}
    </>
  );
}

export default RoleRouteGuard;
