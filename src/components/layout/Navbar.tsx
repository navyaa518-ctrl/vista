'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import {
  ShoppingBag,
  Layers,
  Home,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  ScanLine,
  Receipt,
  Sparkles,
  User,
  ShieldCheck,
  Building,
  HardHat,
  Menu,
  X,
} from 'lucide-react';

export interface NavbarProps {
  onOpenLogin?: () => void;
  setIsLoginModalOpen?: (open: boolean) => void;
  isLoginModalOpen?: boolean;
}

export function Navbar({
  onOpenLogin,
  setIsLoginModalOpen,
  isLoginModalOpen,
}: NavbarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, signOut, setAuthModalOpen } = useAuth();
  const { cartCount } = useRole();
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Unified Login State Binding Across Desktop & Mobile Headers
  const handleOpenLogin = (e: React.MouseEvent | React.TouchEvent) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const width = typeof window !== 'undefined' ? window.innerWidth : 0;
    console.log("Login triggered from device viewport width:", width);

    // Close mobile menu drawer if open
    setMobileMenuOpen(false);

    // Call external state setter if provided
    if (setIsLoginModalOpen) {
      setIsLoginModalOpen(true);
    }
    if (onOpenLogin) {
      onOpenLogin();
    }
    // Always trigger global AuthContext modal state
    setAuthModalOpen(true);
  };

  // Determine role workspace route
  const roleWorkspaceMap: Record<string, { label: string; route: string; icon: React.ReactNode }> = {
    super_admin: { label: 'Super Admin ERP', route: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4 text-amber-400" /> },
    admin: { label: 'Admin ERP Dashboard', route: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4 text-amber-400" /> },
    billing: { label: 'Billing Operations', route: '/billing/dashboard', icon: <Receipt className="w-4 h-4 text-amber-400" /> },
    billing_manager: { label: 'Billing Operations Console', route: '/billing/dashboard', icon: <Receipt className="w-4 h-4 text-amber-400" /> },
    manager: { label: 'Billing & Ops Dashboard', route: '/billing/dashboard', icon: <Receipt className="w-4 h-4 text-amber-400" /> },
    rental_sales_exec: { label: 'Rental Sales Operations', route: '/sales/dashboard', icon: <ScanLine className="w-4 h-4 text-amber-400" /> },
    executive: { label: 'Executive QR Scanner', route: '/ops/scanner', icon: <ScanLine className="w-4 h-4 text-amber-400" /> },
    field_worker: { label: 'Field Operations Portal', route: '/field/my-tasks', icon: <HardHat className="w-4 h-4 text-amber-400" /> },
    crew: { label: 'Field Crew Portal', route: '/field/my-tasks', icon: <HardHat className="w-4 h-4 text-amber-400" /> },
    client: { label: 'My RFQs & Rentals', route: '/portal/my-rentals', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
  };
  const roleWorkspace = roleWorkspaceMap[role] || { label: 'My Portal', route: '/portal/my-rentals', icon: <User className="w-4 h-4 text-amber-400" /> };

  // Check if current route is an internal office staff workspace route
  const isOfficeRoute =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/ops') ||
    pathname?.startsWith('/warehouse') ||
    pathname?.startsWith('/billing') ||
    pathname?.startsWith('/sales') ||
    pathname?.startsWith('/field');

  // Check if current user is logged in as office staff
  const isOfficeStaff = !!user && (
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'billing' ||
    role === 'billing_manager' ||
    role === 'manager' ||
    role === 'rental_sales_exec' ||
    role === 'executive' ||
    role === 'field_worker' ||
    role === 'crew'
  );

  // 1. Completely hide customer navbar on office routes
  if (isOfficeRoute) {
    return null;
  }

  // 2. Hide customer navbar (Home, Catalog, Wishlist) for logged-in office staff
  if (isOfficeStaff) {
    const staffRoute =
      role === 'super_admin' || role === 'admin'
        ? '/admin/dashboard'
        : role === 'billing' || role === 'billing_manager' || role === 'manager'
        ? '/billing/dashboard'
        : role === 'rental_sales_exec' || role === 'executive'
        ? '/sales/dashboard'
        : role === 'field_worker'
        ? '/field/my-tasks'
        : '/portal/my-rentals';
    const staffLabel =
      role === 'super_admin'
        ? 'Super Admin ERP'
        : role === 'admin'
        ? 'Admin ERP Dashboard'
        : role === 'billing' || role === 'billing_manager'
        ? 'Billing Operations Console'
        : role === 'manager'
        ? 'Billing & Ops'
        : role === 'rental_sales_exec' || role === 'executive'
        ? 'Rental Sales Operations'
        : role === 'field_worker'
        ? 'Field Operations'
        : 'My Portal';

    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in pointer-events-auto">
        <Link
          href={staffRoute}
          className="min-h-[44px] px-4 py-2.5 rounded-full bg-slate-900/95 border border-amber-500/40 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 hover:bg-slate-800 transition-all backdrop-blur-md cursor-pointer touch-manipulation pointer-events-auto"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Staff Mode: Go to {staffLabel} &rarr;</span>
        </Link>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-[#08090d]/95 backdrop-blur-md border-b border-amber-500/20 shadow-2xl pointer-events-auto">
      {/* Top Gold Trim Accent Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-90" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto">
        <div className="flex items-center justify-between h-20 pointer-events-auto">
          {/* LEFT: STRICT LOGO IMAGE ONLY (NO PLAIN TEXT) */}
          <Link href="/" className="flex items-center group shrink-0 pointer-events-auto">
            <div className="relative w-32 h-12 sm:w-44 sm:h-16 md:w-52 md:h-18 transition-transform group-hover:scale-105">
              <Image
                src="/assets/logo.png"
                alt="Ashwa"
                fill
                priority
                sizes="(max-width: 640px) 128px, 208px"
                className="object-contain"
              />
            </div>
          </Link>

          {/* CENTER: CLIENT NAVIGATION MENU FLOW */}
          {/* [Home] -> [Catalog] -> [Wishlist] */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 pointer-events-auto">
            <Link
              href="/"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                pathname === '/'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/40'
              }`}
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>Home</span>
            </Link>

            <Link
              href="/catalog"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                pathname?.startsWith('/catalog')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Catalog</span>
            </Link>

            <Link
              href="/cart"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 relative ${
                pathname === '/cart'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/40'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Wishlist</span>
              {cartCount > 0 && (
                <span className="bg-amber-500 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>

          {/* RIGHT: AUTHENTICATION FLOW */}
          <div className="relative z-50 pointer-events-auto flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Wishlist icon shortcut for mobile */}
            <Link
              href="/cart"
              className="md:hidden relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900 border border-amber-500/30 text-amber-400 touch-manipulation pointer-events-auto cursor-pointer"
              aria-label="Wishlist"
            >
              <ShoppingBag className="w-5 h-5 pointer-events-none" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center pointer-events-none">
                  {cartCount}
                </span>
              )}
            </Link>

            {!user ? (
              /* UNAUTHENTICATED: [Sign In] Desktop & Mobile Header Trigger */
              <button
                type="button"
                id="mobile-sign-in-button"
                onClick={handleOpenLogin}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  handleOpenLogin(e);
                }}
                className="relative z-50 pointer-events-auto cursor-pointer min-h-[44px] min-w-[44px] sm:min-w-[100px] flex items-center justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:from-amber-500 active:to-amber-600 text-black shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 gap-2 touch-manipulation select-none"
                aria-label="Sign In to Account"
              >
                <User className="w-4 h-4 shrink-0 pointer-events-none" />
                <span className="pointer-events-none font-bold">Sign In</span>
              </button>
            ) : (
              /* AUTHENTICATED: [My Portal] */
              <div className="relative pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
                  className="flex items-center gap-2 sm:gap-3 min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-[#141722] border border-amber-500/35 hover:border-amber-400/70 transition-all text-left shadow-lg touch-manipulation pointer-events-auto cursor-pointer"
                >
                  {/* Client Avatar Image Placeholder */}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-400/60 bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-xs pointer-events-none">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div className="hidden sm:block pointer-events-none">
                    <div className="text-xs font-bold text-white leading-tight">
                      My Portal
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">
                      {role}
                    </div>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </button>

                {/* Portal Dropdown Menu */}
                {portalDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setPortalDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0f1118] border border-amber-500/40 shadow-2xl z-50 p-2 space-y-2 animate-fade-in pointer-events-auto">
                      {/* User Info Header */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <div className="text-xs font-bold text-white line-clamp-1">
                          {profile?.full_name || user.email}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {user.email}
                        </div>
                        {profile?.production_company && (
                          <div className="text-[10px] text-amber-300 font-medium mt-1 flex items-center gap-1">
                            <Building className="w-3 h-3 text-amber-400" />
                            <span>{profile.production_company}</span>
                          </div>
                        )}
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                          Role: {role}
                        </span>
                      </div>

                      {/* Primary Role Destination Link */}
                      <Link
                        href={roleWorkspace.route}
                        onClick={() => setPortalDropdownOpen(false)}
                        className="w-full p-2.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 flex items-center gap-2.5 text-xs font-semibold transition-colors"
                      >
                        {roleWorkspace.icon}
                        <span>{roleWorkspace.label}</span>
                      </Link>

                      {/* Common Links */}
                      <div className="space-y-1 pt-1 border-t border-slate-800">
                        <Link
                          href="/catalog"
                          onClick={() => setPortalDropdownOpen(false)}
                          className="w-full p-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>Explore Props Catalog</span>
                        </Link>

                        <Link
                          href="/cart"
                          onClick={() => setPortalDropdownOpen(false)}
                          className="w-full p-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                            <span>Wishlist / RFQ</span>
                          </div>
                          {cartCount > 0 && (
                            <span className="text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.2 rounded-full">
                              {cartCount}
                            </span>
                          )}
                        </Link>
                      </div>

                      {/* Sign Out Button */}
                      <div className="pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setPortalDropdownOpen(false);
                            signOut();
                          }}
                          className="w-full p-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-amber-400 touch-manipulation pointer-events-auto cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 pointer-events-none" /> : <Menu className="w-5 h-5 pointer-events-none" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE EXPANDABLE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0c12]/98 border-b border-amber-500/20 backdrop-blur-xl px-4 py-5 space-y-4 animate-fade-in relative z-50 pointer-events-auto">
          <nav className="flex flex-col space-y-2 pointer-events-auto">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 touch-manipulation pointer-events-auto ${
                pathname === '/'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/40'
              }`}
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span>Home</span>
            </Link>

            <Link
              href="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 touch-manipulation pointer-events-auto ${
                pathname?.startsWith('/catalog')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/40'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Catalog</span>
            </Link>

            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between touch-manipulation pointer-events-auto ${
                pathname === '/cart'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Wishlist</span>
              </div>
              {cartCount > 0 && (
                <span className="bg-amber-500 text-black text-xs font-black px-2 py-0.5 rounded-full">
                  {cartCount} items
                </span>
              )}
            </Link>
          </nav>

          {!user ? (
            <div className="pt-2 border-t border-slate-800/80 pointer-events-auto">
              <button
                type="button"
                id="drawer-mobile-sign-in"
                onClick={handleOpenLogin}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  handleOpenLogin(e);
                }}
                className="relative z-50 pointer-events-auto cursor-pointer w-full min-h-[48px] px-5 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 touch-manipulation select-none"
              >
                <User className="w-4 h-4 pointer-events-none" />
                <span className="pointer-events-none font-bold">Sign In to Ashwa</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800/80 space-y-2 pointer-events-auto">
              <Link
                href={roleWorkspace.route}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] p-3 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-3 text-xs font-bold pointer-events-auto"
              >
                {roleWorkspace.icon}
                <span>Launch {roleWorkspace.label}</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full min-h-[44px] p-3 rounded-xl bg-rose-950/30 text-rose-400 border border-rose-500/20 flex items-center gap-3 text-xs font-bold pointer-events-auto cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
