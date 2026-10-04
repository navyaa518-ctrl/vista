'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  HardHat,
  Search,
  Filter,
  Phone,
  Mail,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Truck,
  Sparkles,
} from 'lucide-react';
import { crewHubService } from '@/lib/services/crewHub';
import { CrewMember360 } from '@/types/crewHub';

export default function CrewDirectoryPage() {
  const [crew, setCrew] = useState<CrewMember360[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'On_Shoot' | 'Available'>('All');

  useEffect(() => {
    async function loadCrew() {
      try {
        setLoading(true);
        const data = await crewHubService.getCrewMembers();
        setCrew(data);
      } catch (err) {
        console.error('Failed to load crew directory:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCrew();

    const unsubscribe = crewHubService.subscribeToCrewHub((event) => {
      if (event.table === 'crew_members') {
        loadCrew();
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const filteredCrew = crew.filter((member) => {
    if (statusFilter !== 'All' && member.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      member.full_name.toLowerCase().includes(q) ||
      member.badge_number.toLowerCase().includes(q) ||
      member.designation.toLowerCase().includes(q) ||
      member.phone.includes(q)
    );
  });

  const totalCompletedShoots = crew.reduce((acc, m) => acc + m.analytics.total_shoots_completed, 0);
  const totalLifetimePayroll = crew.reduce((acc, m) => acc + m.analytics.cumulative_lifetime_earnings, 0);
  const totalDays = crew.reduce((acc, m) => acc + m.analytics.total_days_deployed, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6">
      {/* 1. TOP COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <HardHat className="w-3.5 h-3.5 text-amber-600" />
              Field Fleet Roster
            </span>
            <span className="text-xs font-mono text-slate-400">/admin/crew/members</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-amber-500" />
            Crew Directory &amp; Performance Profiles
          </h1>
          <p className="text-xs text-slate-500">
            Certified In-House Ashwa crew members, heavy rigging specialists, lifetime earnings, and shoot track records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/crew/deployments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <HardHat className="w-3.5 h-3.5 text-amber-400" />
            <span>Deployment Board</span>
          </Link>
        </div>
      </div>

      {/* 2. SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total In-House Roster
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{crew.length} Members</div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {crew.filter((m) => m.status === 'On_Shoot').length} Currently On Set
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Completed Movie Shoots
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalCompletedShoots} Shoots</div>
          <span className="text-[11px] text-slate-500">Tollywood &amp; Pan-India catalog</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Field Days Served
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalDays} Days</div>
          <span className="text-[11px] text-slate-500">Cumulative on-set hours</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Cumulative Lifetime Payroll
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">
            ₹ {totalLifetimePayroll.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">100% Disbursed</span>
        </div>
      </div>

      {/* 3. SEARCH & STATUS FILTERS */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'On_Shoot', 'Available'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {s === 'All' ? 'All Members' : s === 'On_Shoot' ? 'On Shoot Now' : 'Available (Standby)'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, badge, or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white text-slate-900"
          />
        </div>
      </div>

      {/* 4. ROSTER GRID */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          Loading Crew Members...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCrew.map((member) => (
            <Link
              key={member.id}
              href={`/admin/crew/members/${member.id}`}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group flex flex-col justify-between block cursor-pointer"
            >
              <div className="space-y-4">
                {/* Header: Photo + Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 relative overflow-hidden shrink-0 border-2 border-amber-500/30 group-hover:border-amber-500 transition-colors">
                      <Image
                        src={member.avatar_url}
                        alt={member.full_name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors flex items-center gap-1.5">
                        <span>{member.full_name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                      </h3>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {member.badge_number}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                      member.status === 'On_Shoot'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {member.status === 'On_Shoot' ? 'On Set' : 'Standby'}
                  </span>
                </div>

                {/* Designation & Phone */}
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-slate-700">{member.designation}</p>
                  <p className="text-slate-500 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {member.phone}
                  </p>
                </div>

                {/* Current Shoot (if active) */}
                {member.current_deployment && (
                  <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-[11px] space-y-0.5">
                    <span className="text-amber-800 font-bold block">
                      Currently On Set: {member.current_deployment.movie_project_name}
                    </span>
                    <span className="text-slate-500 truncate block">
                      {member.current_deployment.shoot_location}
                    </span>
                  </div>
                )}
              </div>

              {/* KPI Strip */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Shoots</span>
                  <strong className="text-slate-900 font-bold">
                    {member.analytics.total_shoots_completed}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Clean Rec.</span>
                  <strong className="text-emerald-700 font-bold">
                    {member.analytics.clean_record_score}%
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Earnings</span>
                  <strong className="text-slate-900 font-mono font-bold">
                    ₹{(member.analytics.cumulative_lifetime_earnings / 1000).toFixed(0)}k
                  </strong>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
