'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_ACCOUNTS, getTargetRoute } from '@/context/AuthContext';
import {
  Lock,
  Mail,
  User,
  Building,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HardHat,
  Receipt,
  LayoutDashboard,
  ScanLine,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, signInDemo, user, role } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup fields
  const [fullName, setFullName] = useState('');
  const [productionCompany, setProductionCompany] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in, show redirection option
  if (user) {
    const target = getTargetRoute(role);
    return (
      <div className="min-h-screen bg-[#08090d] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0e1017] border border-amber-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white">Already Authenticated</h2>
          <p className="text-xs text-slate-400">
            You are logged in as <strong className="text-amber-400">{user.email}</strong> ({role}).
          </p>
          <Link
            href={target}
            className="w-full min-h-[44px] py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <span>Proceed to Workspace ({target})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    if (tab === 'signin') {
      const res = await signIn(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      } else {
        setSuccessMessage('Sign in successful! Redirecting...');
      }
    } else {
      const res = await signUp(email, password, fullName, productionCompany, phone);
      if (!res.success) {
        setErrorMessage(res.error || 'Registration failed.');
      } else {
        setSuccessMessage('Registration completed! Redirecting...');
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#08090d] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <Link href="/" className="inline-block group">
          <div className="relative w-48 h-20 mx-auto transition-transform group-hover:scale-105">
            <Image
              src="/assets/logo.png"
              alt="Ashwa Movie Property Rentals"
              fill
              priority
              sizes="192px"
              className="object-contain"
            />
          </div>
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Ashwa Enterprise Portal
        </h1>
        <p className="text-xs text-amber-200/70">
          Cinematic Prop Inventory &amp; Rental Operations Authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0e1017] border border-amber-500/35 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setErrorMessage(null);
              }}
              className={`min-h-[40px] py-2 rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setErrorMessage(null);
              }}
              className={`min-h-[40px] py-2 rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. S. S. Rajamouli"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-xs text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Production House / Company
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={productionCompany}
                      onChange={(e) => setProductionCompany(e.target.value)}
                      placeholder="e.g. Mythri Movie Makers"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-xs text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98490 00000"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-xs text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="production@mythriofficial.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-xs text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>{tab === 'signin' ? 'Sign In to Ashwa' : 'Create Producer Account'}</span>
            </button>
          </form>

          {/* Quick Demo One-Click Access */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Quick Role-Based Demo Clearance
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => signInDemo('sales')}
                className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-2 text-left font-semibold transition-colors cursor-pointer"
              >
                <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">Sales Exec</div>
                  <div className="text-[9px] text-slate-400">Ravi Kumar (Floor 1)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => signInDemo('billing')}
                className="p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-2 text-left font-semibold transition-colors cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">Billing Mgr</div>
                  <div className="text-[9px] text-slate-400">Operations Console</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => signInDemo('admin')}
                className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-2 text-left font-semibold transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">Admin ERP</div>
                  <div className="text-[9px] text-slate-400">Full Access</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => signInDemo('client')}
                className="p-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-2 text-left font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">Producer Portal</div>
                  <div className="text-[9px] text-slate-400">Mythri Movies</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
