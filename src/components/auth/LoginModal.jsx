'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAuth, DEMO_ACCOUNTS } from '@/context/AuthContext';
import {
  X,
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
} from 'lucide-react';

/**
 * Enterprise Responsive Login Form for ASHWA ERP
 */
export function LoginForm({ onSuccess }) {
  // Gracefully obtain auth context
  let auth = {};
  try {
    auth = useAuth() || {};
  } catch (err) {
    console.warn('LoginForm mounted outside of AuthProvider, using fallback handler:', err);
  }

  const { signIn, signUp, signInDemo } = auth;

  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [fullName, setFullName] = useState('');
  const [productionCompany, setProductionCompany] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (tab === 'signin') {
        if (typeof signIn === 'function') {
          const res = await signIn(email, password);
          if (!res?.success) {
            setErrorMessage(res?.error || 'Authentication failed. Please check your credentials.');
          } else {
            onSuccess?.();
          }
        } else {
          // Fallback if no signIn provider
          console.log('SignIn submitted with email:', email);
          onSuccess?.();
        }
      } else {
        if (typeof signUp === 'function') {
          const res = await signUp(email, password, fullName, productionCompany, phone);
          if (!res?.success) {
            setErrorMessage(res?.error || 'Account registration failed.');
          } else {
            onSuccess?.();
          }
        } else {
          console.log('SignUp submitted with email:', email);
          onSuccess?.();
        }
      }
    } catch (err) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (key) => {
    setErrorMessage(null);
    setLoading(true);
    try {
      if (typeof signInDemo === 'function') {
        await signInDemo(key);
        onSuccess?.();
      } else {
        console.log('Demo sign in triggered for:', key);
        onSuccess?.();
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-slate-100">
      {/* Brand Logo Header strictly using /assets/logo.png */}
      <div className="flex flex-col items-center justify-center text-center mb-6">
        <div className="relative w-48 h-24 drop-shadow-[0_10px_25px_rgba(212,175,55,0.3)]">
          <Image
            src="/assets/logo.png"
            alt="Ashwa Movie Property Rentals"
            fill
            priority
            sizes="192px"
            className="object-contain"
          />
        </div>
        <p className="text-xs text-amber-200/80 tracking-wide mt-1">
          Enterprise Movie Property Rentals &amp; Warehouse Logistics
        </p>
      </div>

      {/* Tab Selector */}
      <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setTab('signin');
            setErrorMessage(null);
          }}
          className={`py-2 rounded-lg transition-all min-h-[40px] ${
            tab === 'signin'
              ? 'bg-amber-500 text-black shadow-md font-bold'
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
          className={`py-2 rounded-lg transition-all min-h-[40px] ${
            tab === 'signup'
              ? 'bg-amber-500 text-black shadow-md font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 mb-4 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {/* Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {tab === 'signup' && (
          <>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Simon Jones"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Production Company / Studio</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={productionCompany}
                  onChange={(e) => setProductionCompany(e.target.value)}
                  placeholder="e.g. Mythri Movie Makers"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200 44556"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 min-h-[44px]"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@aswamovies.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-300 font-semibold block mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-11 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 min-h-[44px]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 min-h-[48px] cursor-pointer pointer-events-auto touch-manipulation active:scale-[0.98]"
        >
          <span>{loading ? 'Processing...' : tab === 'signin' ? 'Sign In' : 'Register Account'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick 1-Click Demo Login Selector */}
      {tab === 'signin' && DEMO_ACCOUNTS && (
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5" />
            <span>1-Click Demo Role Access:</span>
          </span>

          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {Object.entries(DEMO_ACCOUNTS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleDemoSignIn(key)}
                className="w-full p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 text-left flex items-center justify-between text-slate-300 hover:text-white transition-colors group min-h-[44px] cursor-pointer touch-manipulation"
              >
                <div>
                  <span className="font-semibold text-amber-300 group-hover:text-amber-200 block text-[11px]">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.email}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-slate-400 border border-slate-800">
                  {item.route}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * LoginModal Component rendered via React Portal directly into document.body
 * Eliminates mobile viewport clipping, overflow-hidden parent trapping, and z-index collisions.
 */
export const LoginModal = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent background body scroll when modal is active on mobile
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // SSR and closed guard
  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="login-modal-portal"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto"
      onClick={onClose}
    >
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Responsive Modal Container */}
      <div
        className="relative z-10 w-full max-w-md bg-[#0e1017] dark:bg-zinc-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[92vh] pointer-events-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-900/80 border border-slate-700/80 text-zinc-400 hover:text-white dark:hover:text-white transition-colors cursor-pointer pointer-events-auto z-20 touch-manipulation"
          aria-label="Close Login Modal"
        >
          ✕
        </button>

        {/* Actual Login Form */}
        <LoginForm onSuccess={onClose} />
      </div>
    </div>,
    document.body
  );
};

export default LoginModal;
