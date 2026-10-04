'use client';

import React from 'react';
import Link from 'next/link';
import {
  Settings,
  ShieldCheck,
  Database,
  Server,
  KeyRound,
  HardDrive,
  Users,
  Shield,
  ArrowRight,
  Sparkles,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export default function SystemSettingsPage() {
  return (
    <div className="max-w-5xl space-y-8 text-slate-900 pb-16">
      <div className="pb-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Centralized Administration Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise Security Roles, Teams &amp; RBAC Governance, Supabase PostgreSQL, and S3 Storage Configuration.
          </p>
        </div>
      </div>

      {/* 1. ENTERPRISE RBAC & TEAMS GOVERNANCE (Microsoft Dynamics 365 Architecture) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700">
          <Shield className="w-4 h-4 text-sky-600" />
          <span>Microsoft Dynamics 365 Security &amp; Access Governance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Security Roles Matrix */}
          <Link
            href="/admin/settings/security-roles"
            className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all shadow-xs space-y-4 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Matrix
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors flex items-center gap-1.5">
                  <span>Security Roles Management</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Entity-level granular privilege matrix with Dynamics 365 scope depth (⚪ None, 🟡 User, 🔵 Team, 🟢 Organization) for Props, Walk-in Orders, Live Carts, and Pipelines.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 pt-2 border-t border-slate-100 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px]">Create</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px]">Read</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px]">Update</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px]">Delete</span>
                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-mono text-[10px]">Append / Scan</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px]">Dispatch Pass</span>
              </div>
            </div>

            <div className="text-xs font-semibold text-sky-600 flex items-center gap-1">
              <span>Open Entity Privilege Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: Operational Teams & User Groups */}
          <Link
            href="/admin/settings/teams"
            className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all shadow-xs space-y-4 group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Automated Inheritance
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors flex items-center gap-1.5">
                  <span>Teams &amp; User Group Bindings</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Configure operational teams (Billing Desk, Rental Sales Executives, Fleet Logistics) and bind Security Roles directly to entire teams for seamless access inheritance.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 pt-2 border-t border-slate-100 flex-wrap">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Team Role Inheritance</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Direct User Overrides</span>
                </span>
              </div>
            </div>

            <div className="text-xs font-semibold text-sky-600 flex items-center gap-1">
              <span>Manage Teams &amp; Personnel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* 2. CLOUD INFRASTRUCTURE CONFIGURATION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Database className="w-4 h-4 text-slate-500" />
          <span>Cloud Database &amp; Media Storage Infrastructure</span>
        </div>

        {/* S3 Storage Configuration Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700">
            <HardDrive className="w-4 h-4 text-sky-600" />
            <span>Supabase S3 Protocol Storage Integration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">S3 Endpoint</span>
              <span className="font-mono text-slate-900 text-[11px] break-all">
                https://ujxqffdfybsxalvkevqc.storage.supabase.co/storage/v1/s3
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">AWS Region</span>
              <span className="font-mono text-emerald-700 font-semibold text-[11px]">ap-south-1</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Media Bucket</span>
              <span className="font-mono text-amber-800 font-semibold text-[11px]">props-media (Public Read)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Access Key ID</span>
              <span className="font-mono text-slate-700 text-[11px]">51e7bc0e4ed1521f732c7799f39c0468</span>
            </div>
          </div>
        </div>

        {/* Database & Realtime Status */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700">
            <Database className="w-4 h-4 text-sky-600" />
            <span>PostgreSQL &amp; Realtime Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Database Engine</span>
              <span className="font-mono text-slate-900 text-[11px] font-semibold">PostgreSQL 17.6 (Supabase)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Realtime Publications</span>
              <span className="font-mono text-emerald-700 text-[11px] font-semibold">Active (orders, order_items, security_roles)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Standard Rental Rate</span>
              <span className="font-mono text-amber-800 text-[11px] font-semibold">20% of Certified Replacement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
