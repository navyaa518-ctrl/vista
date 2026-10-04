'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
  Search,
  Bell,
  Settings,
  HelpCircle,
  User as UserIcon,
  Lock,
  LogOut,
  Check,
  X,
  ChevronDown,
  Shield,
  Key,
  CheckCheck,
  Clock,
  AlertTriangle,
  Box,
  Sparkles,
  Phone,
  Mail,
  Building2,
  Command,
  Info,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  category: 'props' | 'return_alert' | 'overdue' | 'picking' | 'damage_alert';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'props',
    title: '50 new ARRI Alexa LF Cameras Added',
    description: 'Catalog team uploaded 50 serialized units to Godown 1 - Floor 2 - Rack A.',
    time: '15m ago',
    read: false,
  },
  {
    id: 'notif-2',
    category: 'return_alert',
    title: 'Order #ASH-9042 Return Due Tomorrow',
    description: 'Pushpa 2: The Rule VFX unit rental due back by 11:00 AM.',
    time: '1h ago',
    read: false,
  },
  {
    id: 'notif-3',
    category: 'overdue',
    title: 'Overdue: Order #ASH-8821 (+2 Days)',
    description: 'Mythri Movie Makers vintage prop package overdue. Late fee active.',
    time: '3h ago',
    read: false,
  },
  {
    id: 'notif-4',
    category: 'picking',
    title: 'Live Picking Completed',
    description: 'Executive Vikram verified all 12 items for Salaar 2 production cart.',
    time: '5h ago',
    read: true,
  },
];

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, role, signOut } = useAuth();

  // Navigation title mapping
  const getPageTitle = (path: string): string => {
    if (path.includes('/admin/warehouse/categories')) return 'Prop Categories';
    if (path.includes('/admin/warehouse/space') || path.includes('/admin/warehouse/metrics')) return 'Warehouse Space & Capacity';
    if (path.includes('/admin/inventory/props')) return 'Serialized Inventory 360';
    if (path.includes('/admin/inventory/metrics')) return 'Stock Analytics & Metrics';
    if (path.includes('/admin/orders/in-person/create')) return 'Create Walk-In Rental Order';
    if (path.includes('/admin/orders/in-person') || path.includes('/admin/orders/walk-in')) return 'Walk-In Order History';
    if (path.includes('/admin/orders/pipeline')) return 'Live Order Pipeline';
    if (path.includes('/admin/orders/app')) return 'Customer App RFQs';
    if (path.includes('/admin/finance/invoices')) return 'Billing & Invoices';
    if (path.includes('/admin/finance/expenses')) return 'Operational Expenses';
    if (path.includes('/admin/finance/payroll')) return 'Staff Payroll';
    if (path.includes('/admin/people/staff')) return 'Personnel & Operations Staff';
    if (path.includes('/admin/people/field-ops')) return 'Field Operations';
    if (path.includes('/admin/people/clients')) return 'Client Studios & Production Houses';
    if (path.includes('/admin/settings')) return 'Enterprise System Settings';
    return 'Executive Operations Dashboard';
  };

  // State management
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Refs for click outside
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Unread notification count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Derive dynamic user details
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Operations Lead';
  const displayEmail = profile?.email || user?.email || 'admin@ashwarentals.com';
  const roleLabel =
    role === 'admin'
      ? 'Chief Ops Officer'
      : role === 'manager'
      ? 'Warehouse Ops Manager'
      : role === 'executive'
      ? 'Rental Sales Executive'
      : 'Production Producer';

  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
  // Realtime Damage & Ops Notification Listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedAlerts = localStorage.getItem('ashwa_realtime_notifications');
        if (storedAlerts) {
          const parsed = JSON.parse(storedAlerts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotifications((prev) => {
              const ids = new Set(prev.map((p) => p.id));
              const newAlerts = parsed.filter((a) => !ids.has(a.id));
              return [...newAlerts, ...prev];
            });
          }
        }
      } catch (e) {
        console.warn('Error reading stored alerts:', e);
      }
    }

    const handleIncident = (e: any) => {
      if (e.detail) {
        setNotifications((prev) => [e.detail, ...prev]);
      }
    };
    window.addEventListener('ashwa_damage_incident', handleIncident);
    return () => {
      window.removeEventListener('ashwa_damage_incident', handleIncident);
    };
  }, []);

  // Keyboard shortcut listener (⌘K, ⌘B, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileDropdownOpen(false);
        setNotificationsOpen(false);
        setProfileModalOpen(false);
        setPasswordModalOpen(false);
        setHelpDrawerOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('admin-global-search') as HTMLInputElement | null;
        searchInput?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setHelpDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all notifications as read
  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters long.', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match.', error: true });
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMessage(null);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordMessage({ text: error.message, error: true });
      } else {
        setPasswordMessage({ text: 'Password updated successfully!', error: false });
        setTimeout(() => {
          setPasswordModalOpen(false);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordMessage(null);
        }, 1500);
      }
    } catch (err: any) {
      setPasswordMessage({ text: err.message || 'Failed to update password', error: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Page Title & Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Ashwa ERP</span>
            <span className="text-slate-300">/</span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              {getPageTitle(pathname || '')}
            </h1>
          </div>
        </div>

        {/* Center Apple Search Bar with ⌘K Badge */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="admin-global-search"
              type="text"
              placeholder="Search props, orders, godowns, clients..."
              className="w-full pl-9 pr-14 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-2xs"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-500 text-[10px] font-semibold border border-slate-300/80">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Bell with Badge & Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileDropdownOpen(false);
              }}
              className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Apple Frosted Notification Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-700 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      onClick={markAllRead}
                      className="text-slate-500 hover:text-sky-600 transition-colors font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                    <span className="text-slate-200">|</span>
                    <button
                      onClick={clearAllNotifications}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <Bell className="w-6 h-6 text-slate-300" />
                      <span>All caught up! No notifications.</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition-colors hover:bg-slate-50/80 flex items-start gap-2.5 ${
                          !n.read ? 'bg-sky-50/30' : ''
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {n.category === 'props' && (
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                              <Box className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {n.category === 'return_alert' && (
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {n.category === 'overdue' && (
                            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {n.category === 'picking' && (
                            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {n.category === 'damage_alert' && (
                            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 border border-rose-300 flex items-center justify-center animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-semibold truncate ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                            {n.description}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 border-t border-slate-100 bg-slate-50/40 text-center">
                  <Link
                    href="/admin/orders/pipeline"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center justify-center gap-1"
                  >
                    View Real-Time Operations Pipeline
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Settings Shortcut */}
          <Link
            href="/admin/settings"
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            title="System Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Help & Support Button */}
          <button
            onClick={() => setHelpDrawerOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            title="Help & Shortcuts (⌘B)"
            aria-label="Help & Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Dynamic User Profile Trigger & Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-xl hover:bg-slate-100/80 transition-all focus:outline-none group"
              aria-label="User menu"
            >
              {/* Dynamic User Avatar */}
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {userInitials}
              </div>

              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors flex items-center gap-1">
                  {displayName}
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform duration-200" />
                </div>
                <div className="text-[10px] text-slate-400 font-medium tracking-tight">
                  ({roleLabel})
                </div>
              </div>
            </button>

            {/* Apple Frosted Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
                {/* User Card Header */}
                <div className="px-3 py-2.5 bg-slate-50/70 rounded-xl mb-1 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{displayName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{displayEmail}</div>
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-0.5 text-xs font-medium">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors text-left"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>View Profile & Permissions</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setPasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors text-left"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Change Password</span>
                  </button>

                  <Link
                    href="/admin/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>System Settings</span>
                  </Link>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      await signOut();
                      router.push('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span className="font-semibold">Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-900">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active User Profile</h3>
                  <p className="text-[11px] text-slate-500">Supabase authenticated session details</p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {userInitials}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{displayName}</h4>
                  <p className="text-slate-500">{displayEmail}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {roleLabel} ({role.toUpperCase()})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    Organization / Studio
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    {profile?.production_company || 'ASHWA Central Operations'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-slate-400" />
                    Assigned Yard / Floor
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    {profile?.floor_assigned ? `Floor ${profile.floor_assigned}` : 'All Godowns (Unrestricted)'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    Phone
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    {profile?.phone || '+91 98490 23456'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-slate-400" />
                    Access Level
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    {role === 'admin' ? 'Super Admin / Full Bypass' : 'Role-Based Access Control'}
                  </div>
                </div>
              </div>

              {/* Permissions list */}
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Active System Entitlements
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Check className="w-3 h-3 text-emerald-600" /> Warehouse Space CRUD
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Check className="w-3 h-3 text-emerald-600" /> Serialized Prop Manager
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Check className="w-3 h-3 text-emerald-600" /> Walk-In Billing Counter
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Check className="w-3 h-3 text-emerald-600" /> Realtime Picking Dispatch
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-900">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
                  <p className="text-[11px] text-slate-500">Update your Supabase authentication credentials</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
              {passwordMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                    passwordMessage.error
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {passwordMessage.error ? (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help & Support Quick Drawer */}
      {helpDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border-l border-slate-200 w-full max-w-md h-full shadow-2xl flex flex-col text-slate-900 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Operations Help & Documentation</h3>
                  <p className="text-[11px] text-slate-500">Quick guides, keyboard shortcuts & support</p>
                </div>
              </div>
              <button
                onClick={() => setHelpDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Keyboard Shortcuts */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Command className="w-3.5 h-3.5 text-slate-500" />
                  Keyboard Shortcuts
                </h4>
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Global Search</span>
                    <kbd className="px-2 py-0.5 rounded bg-white text-slate-600 text-[10px] font-bold border border-slate-200 shadow-2xs">
                      ⌘K
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Toggle Help Drawer</span>
                    <kbd className="px-2 py-0.5 rounded bg-white text-slate-600 text-[10px] font-bold border border-slate-200 shadow-2xs">
                      ⌘B
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Close Modals / Drawers</span>
                    <kbd className="px-2 py-0.5 rounded bg-white text-slate-600 text-[10px] font-bold border border-slate-200 shadow-2xs">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Standard Operating Procedures (SOP) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Warehouse SOP & Best Practices
                </h4>
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-300 transition-colors">
                    <div className="font-bold text-slate-900">Walk-in Order Intake</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Create order at billing counter → Assign picking executives → Real-time mobile cart sync → Dispatch pass.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-300 transition-colors">
                    <div className="font-bold text-slate-900">Warehouse Slot Codes</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Standard format: <code className="text-sky-700 bg-sky-50 px-1 py-0.5 rounded font-mono">G1-F1-R01-S01</code> (Godown 1, Floor 1, Rack 1, Shelf 1).
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Support Hotline */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <div className="flex items-center gap-2 mb-1.5">
                  <Shield className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-xs">24/7 IT & Systems Support</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  Encountering sync discrepancies or scanner issues? Reach the warehouse tech desk directly.
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    <span>Internal Ext: <strong>4040</strong> (+91 40 2345 6789)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    <span>support@ashwarentals.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setHelpDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
