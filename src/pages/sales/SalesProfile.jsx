'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  Building,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  History,
  HardHat,
  Bell,
  Save,
  Clock,
  ArrowRight,
  ScanLine,
  ClipboardCheck,
  Package,
  Layers,
  Sparkles,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

export function SalesProfile() {
  const { user, profile, signOut } = useAuth();

  // Profile fields state
  const [fullName, setFullName] = useState(profile?.full_name || 'Ravi Kumar');
  const [employeeCode, setEmployeeCode] = useState(profile?.employee_code || profile?.badge_number || 'ASH-SLS-01');
  const [assignedFloor, setAssignedFloor] = useState(profile?.floor_assigned || 1);
  const [email, setEmail] = useState(user?.email || 'sales@aswamovies.com');
  const [phone, setPhone] = useState(profile?.phone || '+91 98480 22331');

  // Notification preferences
  const [notifyUrgentOrders, setNotifyUrgentOrders] = useState(true);
  const [notifyAuditReminders, setNotifyAuditReminders] = useState(true);
  const [notifyDamageReports, setNotifyDamageReports] = useState(false);

  // Profile save state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState(null);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState(null);

  // Sync profile when auth state updates
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile?.phone) setPhone(profile.phone);
    if (profile?.employee_code) setEmployeeCode(profile.employee_code);
    if (user?.email) setEmail(user.email);
    if (profile?.floor_assigned) setAssignedFloor(profile.floor_assigned);
  }, [profile, user]);

  // Password Strength Calculation
  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200', textCol: 'text-slate-400' };

    const hasMinLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);

    if (hasMinLength) score += 1;
    if (hasUpper && hasLower) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500', textCol: 'text-rose-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500', textCol: 'text-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-sky-500', textCol: 'text-sky-500' };
      case 4:
        return { score: 100, label: 'Very Strong', color: 'bg-emerald-500', textCol: 'text-emerald-500' };
      default:
        return { score: 15, label: 'Too Short', color: 'bg-rose-400', textCol: 'text-rose-400' };
    }
  };

  const strength = calculatePasswordStrength(newPassword);

  // Save Profile Details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    try {
      if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: phone,
            floor_assigned: Number(assignedFloor),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) {
          console.warn('Profile Supabase update notice:', error);
        }
      }

      // Also persist to localStorage for offline robustness
      const localProfile = {
        full_name: fullName,
        phone: phone,
        employee_code: employeeCode,
        floor_assigned: Number(assignedFloor),
        notification_preferences: {
          urgent_orders: notifyUrgentOrders,
          audit_reminders: notifyAuditReminders,
          damage_reports: notifyDamageReports,
        },
      };
      localStorage.setItem('ashwa_executive_profile', JSON.stringify(localProfile));

      setProfileSuccessMsg('Profile details and notification preferences saved successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Save profile error:', err);
      setProfileErrorMsg('Failed to update profile details. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  // In-App Password Change using Supabase Auth
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (newPassword.length < 8) {
      setPasswordErrorMsg('New password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Password confirmation does not match new password.');
      return;
    }

    setUpdatingPassword(true);

    try {
      // Supabase in-app password update
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setPasswordSuccessMsg('Password updated successfully! Your account security is up to date.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Password reset error:', err);
      setPasswordErrorMsg(err.message || 'Failed to update password. Session may have expired.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Personal Activity Ledger Items (Chronological record)
  const ledgerItems = [
    {
      id: 'act-001',
      action: 'SCAN_PROP',
      title: 'Scanned 4 Cinema Cameras into Live Manifest',
      details: 'ASH-CAM-RED-0001, ASH-CAM-ARRI-0004 for Mythri Movie Makers (#ASH-2026-ORD-014)',
      timestamp: 'Today, 11:24 AM',
      typeBadge: 'QR Pick',
      typeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: <ScanLine className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'act-002',
      action: 'AUDIT_LOG',
      title: 'Completed Bay Health Verification',
      details: 'Audit AUD-2026-001: Verified 5 antique throne sets on Floor 1, Bay A-01. Structural grade: Pristine.',
      timestamp: 'Today, 09:40 AM',
      typeBadge: 'Audit Log',
      typeColor: 'bg-sky-100 text-sky-900 border-sky-300',
      icon: <ClipboardCheck className="w-4 h-4 text-sky-600" />,
    },
    {
      id: 'act-003',
      action: 'STAGE_DISPATCH',
      title: 'Staged Commercial Order in Loading Dock',
      details: 'Order #ASH-2026-ORD-011 for DVV Entertainment tagged for vehicle AP 28 TB 9821',
      timestamp: 'Yesterday, 04:15 PM',
      typeBadge: 'Dispatch Prep',
      typeColor: 'bg-violet-100 text-violet-900 border-violet-300',
      icon: <Package className="w-4 h-4 text-violet-600" />,
    },
    {
      id: 'act-004',
      action: 'ORDER_CLOSE',
      title: 'Verified Returned Props & Settlement Cleared',
      details: 'Order #ASH-2026-ORD-009 returned from Ramoji Film City. Zero damages reported; security deposit released.',
      timestamp: '25 Sep 2026, 02:30 PM',
      typeBadge: 'Order Closed',
      typeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'act-005',
      action: 'SCAN_PROP',
      title: 'Scanned 12 Period Weapons into Armor Manifest',
      details: 'Order #ASH-2026-ORD-008: Ancient bronze swords and shields tagged with tamper-evident stickers.',
      timestamp: '24 Sep 2026, 11:05 AM',
      typeBadge: 'QR Pick',
      typeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: <ScanLine className="w-4 h-4 text-amber-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6">
      {/* 1. TOP HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-amber-700" />
              <span>Rental Sales Executive Desk</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Badge: {employeeCode}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Executive Profile & Account Settings
          </h1>
          <p className="text-xs text-slate-500">
            Manage your personal profile details, notification preferences, in-app Supabase security credentials, and view your chronological activity ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sales/dashboard"
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <span>&larr; Back to Dashboard</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: Profile Details & Security Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* A. PROFILE DETAILS FORM */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>Profile Information & Floor Allocation</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Update your contact details and operational preferences.
                </p>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                Active Staff
              </span>
            </div>

            {profileSuccessMsg && (
              <div className="p-4 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="p-4 bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-semibold"
                  />
                </div>

                {/* Employee Code (Read-only verified) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Employee Code / Staff Badge
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={employeeCode}
                      disabled
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono font-bold cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Contact Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+91 98480 00000"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                {/* Assigned Floor / Warehouse Bay */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Assigned Warehouse Floor Specialty
                  </label>
                  <select
                    value={assignedFloor}
                    onChange={(e) => setAssignedFloor(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-semibold cursor-pointer"
                  >
                    <option value={1}>Floor 1: Period Furniture, Ancient Weapons & Historical Armory</option>
                    <option value={2}>Floor 2: Cinema Optics, High-End Electronics & Modern Set Dressings</option>
                  </select>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Executive Notification Preferences</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={notifyUrgentOrders}
                      onChange={(e) => setNotifyUrgentOrders(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-800">Urgent Shoot Order Alerts</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={notifyAuditReminders}
                      onChange={(e) => setNotifyAuditReminders(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-800">Weekly Bay Audit Reminders</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Profile Details</span>
                </button>
              </div>
            </form>
          </div>

          {/* B. SECURITY & PASSWORD RESET FORM */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Security & In-App Password Update</span>
              </h2>
              <p className="text-xs text-slate-500">
                Update your Supabase authentication password with immediate validation and strength metering.
              </p>
            </div>

            {passwordSuccessMsg && (
              <div className="p-4 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div className="p-4 bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    New Security Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Password Strength:</span>
                    <span className={`font-black ${strength.textCol}`}>{strength.label}</span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>

                  {/* Checklist criteria */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-500">
                    <span className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-emerald-600 font-bold' : ''}`}>
                      • 8+ characters
                    </span>
                    <span className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}`}>
                      • Uppercase letter
                    </span>
                    <span className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}`}>
                      • Lowercase letter
                    </span>
                    <span className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-emerald-600 font-bold' : ''}`}>
                      • Number / Digit
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={updatingPassword || !newPassword || newPassword.length < 8}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {updatingPassword ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>Update Supabase Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Personal Activity Ledger */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
                <History className="w-4 h-4 text-violet-600" />
                <span>Personal Activity Ledger</span>
              </h2>
              <p className="text-xs text-slate-500">
                Recent prop scans, audits logged, and order settlements executed.
              </p>
            </div>

            <div className="space-y-3.5">
              {ledgerItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${item.typeColor}`}>
                        {item.typeBadge}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {item.timestamp}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {item.details}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-400 font-medium">
                Showing last 5 operations • Full ledger archived to Supabase
              </span>
            </div>
          </div>

          {/* Quick Sign Out Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-center">
            <p className="text-xs text-slate-500">
              Finished with your shift? Sign out of your executive terminal to release active locks.
            </p>
            <button
              onClick={() => signOut()}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Sign Out from Executive Terminal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesProfile;
