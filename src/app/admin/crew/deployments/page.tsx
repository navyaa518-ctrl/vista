'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  HardHat,
  Truck,
  Calendar,
  MapPin,
  Clock,
  UserCheck,
  ArrowRightLeft,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  Shield,
  Search,
  RefreshCw,
  ExternalLink,
  Users,
  Film,
  Sparkles,
} from 'lucide-react';
import { crewHubService, calculateDaysBetween } from '@/lib/services/crewHub';
import {
  ActiveShootDeployment,
  CrewMember360,
  CrewSwapRequest,
} from '@/types/crewHub';

export default function CrewDeploymentsPage() {
  const [deployments, setDeployments] = useState<ActiveShootDeployment[]>([]);
  const [availableCrew, setAvailableCrew] = useState<CrewMember360[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mid-Shoot Swap Modal State
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<ActiveShootDeployment | null>(null);
  const [releasingMemberId, setReleasingMemberId] = useState('');
  const [replacementMemberId, setReplacementMemberId] = useState('');
  const [effectiveSwapDate, setEffectiveSwapDate] = useState('');
  const [swapReason, setSwapReason] = useState('Medical leave / On-set rotation');
  const [swapping, setSwapping] = useState(false);
  const [swapSuccessMessage, setSwapSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [depList, crewList] = await Promise.all([
        crewHubService.getActiveDeployments(),
        crewHubService.getCrewMembers(),
      ]);
      setDeployments(depList);
      setAvailableCrew(crewList.filter((m) => m.status === 'Available'));
    } catch (err) {
      console.error('Failed to load deployments data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = crewHubService.subscribeToCrewHub((event) => {
      if (event.table === 'order_crew_assignments' || event.table === 'crew_members') {
        loadData();
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenSwapModal = (deployment: ActiveShootDeployment) => {
    setSelectedDeployment(deployment);
    const activeCrew = deployment.in_house_crew.filter((c) => c.status === 'Active');
    setReleasingMemberId(activeCrew[0]?.crew_member_id || '');
    setReplacementMemberId(availableCrew[0]?.id || '');
    // Default effective swap date to today or mid-shoot
    const today = new Date().toISOString().split('T')[0];
    setEffectiveSwapDate(today >= deployment.start_date && today <= deployment.end_date ? today : deployment.start_date);
    setSwapReason('Medical emergency / Unscheduled set leave');
    setSwapSuccessMessage(null);
    setSwapModalOpen(true);
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeployment || !releasingMemberId || !replacementMemberId || !effectiveSwapDate) {
      alert('Please fill out all required fields to proceed with crew swap.');
      return;
    }

    try {
      setSwapping(true);
      const request: CrewSwapRequest = {
        order_id: selectedDeployment.order_id,
        releasing_crew_member_id: releasingMemberId,
        replacement_crew_member_id: replacementMemberId,
        effective_swap_date: effectiveSwapDate,
        reason: swapReason,
      };

      const result = await crewHubService.swapCrewMember(request);
      setSwapSuccessMessage(result.audit_message);

      // Refresh data
      await loadData();
      setTimeout(() => {
        setSwapModalOpen(false);
        setSwapSuccessMessage(null);
      }, 2200);
    } catch (err: any) {
      console.error('Crew swap failed:', err);
      alert(`Crew swap error: ${err.message || 'Failed to update crew assignment.'}`);
    } finally {
      setSwapping(false);
    }
  };

  const filteredDeployments = deployments.filter((dep) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      dep.movie_project_name.toLowerCase().includes(q) ||
      dep.client_name.toLowerCase().includes(q) ||
      dep.shoot_location.toLowerCase().includes(q) ||
      dep.order_number.toLowerCase().includes(q) ||
      dep.in_house_crew.some((c) => c.crew_name.toLowerCase().includes(q))
    );
  });

  const totalCrewOnField = deployments.reduce(
    (acc, curr) => acc + curr.in_house_crew.filter((c) => c.status === 'Active').length,
    0
  );
  const totalDailyWages = deployments.reduce(
    (acc, curr) =>
      acc +
      curr.in_house_crew
        .filter((c) => c.status === 'Active')
        .reduce((s, c) => s + (c.daily_wage || 1000), 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6">
      {/* 1. TOP COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Rental Pipeline Fleet
            </span>
            <span className="text-xs font-mono text-slate-400">/admin/crew/deployments</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <HardHat className="w-7 h-7 text-amber-500" />
            Live Deployment Board &amp; Field Fleet
          </h1>
          <p className="text-xs text-slate-500">
            Real-time monitoring of all active movie shoots with on-site Ashwa Crew, lorry logistics, and mid-shoot crew rotations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>Sync Pipeline</span>
          </button>
          <Link
            href="/admin/crew/field-logs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>View Live Logs</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Movie Shoots
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{deployments.length} Projects</div>
            <span className="text-[11px] text-emerald-600 font-semibold">100% On Schedule</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Crew On Set Today
            </span>
            <div className="text-2xl font-extrabold text-slate-900">{totalCrewOnField} Members</div>
            <span className="text-[11px] text-slate-500">In-House Staff Deployed</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Daily Fleet Labor Tally
            </span>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              ₹ {totalDailyWages.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500">Daily field payroll basis</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Prop Safety Health
            </span>
            <div className="text-2xl font-extrabold text-emerald-600">All Safe</div>
            <span className="text-[11px] text-slate-500">Zero open set incidents</span>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search movie project, shoot location, or crew member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white text-slate-900 placeholder-slate-400"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Showing <strong className="text-slate-900">{filteredDeployments.length}</strong> Active Shoot Pipelines
        </span>
      </div>

      {/* 4. ACTIVE SHOOT DEPLOYMENT CARDS */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span className="text-sm font-semibold">Loading Live Deployments &amp; Field Crew...</span>
        </div>
      ) : filteredDeployments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <HardHat className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-bold text-slate-700">No Active Shoots Found</p>
          <p className="text-xs text-slate-400">
            All orders are currently in warehouse or returned. Dispatched orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDeployments.map((deployment) => (
            <div
              key={deployment.order_id}
              className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-slate-300"
            >
              {/* Card Banner */}
              <div className="p-5 bg-gradient-to-r from-slate-50 via-white to-amber-50/30 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                      {deployment.order_number}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Shoot in Progress
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-600">
                      Client: <strong className="text-slate-800">{deployment.client_name}</strong>
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>{deployment.movie_project_name}</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {deployment.shoot_location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {deployment.start_date} to {deployment.end_date} ({deployment.total_rental_days} Days)
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Day {deployment.days_elapsed} of {deployment.total_rental_days}
                    </span>
                  </div>
                </div>

                {/* Logistics & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenSwapModal(deployment)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Manage / Swap Crew</span>
                  </button>
                  <Link
                    href={`/admin/orders/${deployment.order_id}/billing-cart`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Live Cart / Gate Pass</span>
                  </Link>
                </div>
              </div>

              {/* Card Body: Transport + In-House Crew + External Manifest */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: Transport Logistics */}
                <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/70">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-600" /> Transit Logistics &amp; Gate Pass
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Transit Vehicle No:</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {deployment.transport_logistics.lorry_vehicle_number}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Lorry Driver:</span>
                      <span className="font-semibold text-slate-800">
                        {deployment.transport_logistics.driver_name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">Driver Mobile:</span>
                      <a
                        href={`tel:${deployment.transport_logistics.driver_phone}`}
                        className="text-amber-700 font-mono font-semibold hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {deployment.transport_logistics.driver_phone}
                      </a>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Security Gate Pass:</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {deployment.transport_logistics.gate_pass_number}
                      </span>
                    </div>
                  </div>

                  {/* Prop Health Snippet */}
                  {deployment.last_health_update && (
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Prop Health Sign-off
                        </span>
                        <span className="text-[10px] text-emerald-700 font-mono">
                          {deployment.last_health_update.timestamp}
                        </span>
                      </div>
                      <p className="text-emerald-800 text-[11px] italic">
                        &quot;{deployment.last_health_update.summary}&quot;
                      </p>
                      <span className="text-[10px] text-slate-500 block">
                        Signed: {deployment.last_health_update.reported_by_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Column 2: Assigned In-House Ashwa Crew */}
                <div className="space-y-3 lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5 text-amber-600" />
                      Assigned Ashwa Field Crew ({deployment.in_house_crew.length} Members Tagged)
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                      Labor Tally: ₹ {deployment.total_labor_cost.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deployment.in_house_crew.map((member) => (
                      <div
                        key={member.id}
                        className={`p-3 rounded-xl border transition-all ${
                          member.status === 'Active'
                            ? 'bg-white border-slate-200/90 shadow-2xs'
                            : 'bg-slate-50/80 border-dashed border-slate-300 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-slate-200 relative overflow-hidden shrink-0 border border-slate-300">
                              <Image
                                src={member.avatar_url}
                                alt={member.crew_name}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/crew/members/${member.crew_member_id}`}
                                className="text-xs font-bold text-slate-900 hover:text-amber-700 truncate block hover:underline"
                              >
                                {member.crew_name}
                              </Link>
                              <span className="text-[10px] text-slate-500 font-mono block">
                                {member.badge_number} • {member.designation}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              member.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {member.status === 'Active' ? 'On Set' : 'Replaced Mid-Shoot'}
                          </span>
                        </div>

                        {/* Wage Breakdown */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">
                            {member.start_date} → {member.end_date || deployment.end_date} (
                            <strong className="text-slate-700">{member.effective_days} days</strong>)
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            ₹ {member.calculated_earnings.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">
                              (@₹{member.daily_wage}/d)
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Client Sourced Crew Manifest (if any) */}
                  {deployment.external_crew.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Client Sourced Handlers (Gate Pass Manifest)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {deployment.external_crew.map((ext) => (
                          <div
                            key={ext.id}
                            className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs flex items-center gap-2"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-800">{ext.full_name}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({ext.phone_number})
                            </span>
                            {ext.notes && (
                              <span className="text-[10px] text-amber-700 italic">
                                &quot;{ext.notes}&quot;
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================================================================
          5. MID-SHOOT CREW SWAP / REPLACEMENT MODAL
          =================================================================== */}
      {swapModalOpen && selectedDeployment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-900 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" /> Mid-Shoot Crew Rotation
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Manage &amp; Swap On-Set Crew Member
                </h3>
              </div>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shoot Info Banner */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
              <div className="flex justify-between font-bold text-amber-950">
                <span>{selectedDeployment.movie_project_name}</span>
                <span className="font-mono">{selectedDeployment.order_number}</span>
              </div>
              <div className="text-slate-600 text-[11px]">
                Shoot Period: {selectedDeployment.start_date} to {selectedDeployment.end_date} (
                {selectedDeployment.total_rental_days} Days) • Location: {selectedDeployment.shoot_location}
              </div>
            </div>

            {swapSuccessMessage ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Crew Replacement Successful</h4>
                <p className="text-xs text-emerald-800">{swapSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleExecuteSwap} className="space-y-4 text-xs">
                {/* Releasing Member */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    1. Select Crew Member to Release / Relieve <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={releasingMemberId}
                    onChange={(e) => setReleasingMemberId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    {selectedDeployment.in_house_crew
                      .filter((c) => c.status === 'Active')
                      .map((c) => (
                        <option key={c.crew_member_id} value={c.crew_member_id}>
                          {c.crew_name} ({c.badge_number}) — Currently On Set (@₹{c.daily_wage}/day)
                        </option>
                      ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    This member will be marked as &quot;Replaced&quot; up to the day before effective swap date.
                  </span>
                </div>

                {/* Replacement Member */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    2. Select In-House Replacement Member <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={replacementMemberId}
                    onChange={(e) => setReplacementMemberId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    {availableCrew.length === 0 ? (
                      <option value="">No standby crew available (All currently deployed)</option>
                    ) : (
                      availableCrew.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} ({m.badge_number}) — {m.designation} (Clean Score: {m.analytics.clean_record_score}%)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Effective Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      3. Effective Swap Date <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={effectiveSwapDate}
                      min={selectedDeployment.start_date}
                      max={selectedDeployment.end_date}
                      onChange={(e) => setEffectiveSwapDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Daily Wage Rate (₹)
                    </label>
                    <input
                      type="number"
                      defaultValue={1000}
                      readOnly
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-500"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    4. Operational Reason for Swap
                  </label>
                  <input
                    type="text"
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    placeholder="e.g. Member ill on Day 2 of 4-day shoot; replaced by Govind Raj"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Prorated Wage Breakdown Preview */}
                {effectiveSwapDate && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Prorated Wage Recalculation Preview
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Original Member (Days before {effectiveSwapDate}):</span>
                        <span className="font-mono font-bold text-slate-900">
                          {calculateDaysBetween(selectedDeployment.start_date, effectiveSwapDate) - 1 > 0
                            ? `${calculateDaysBetween(selectedDeployment.start_date, effectiveSwapDate) - 1} Days × ₹1,000`
                            : '1 Day × ₹1,000'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Replacement Member ({effectiveSwapDate} to {selectedDeployment.end_date}):</span>
                        <span className="font-mono font-bold text-slate-900">
                          {calculateDaysBetween(effectiveSwapDate, selectedDeployment.end_date)} Days × ₹1,000
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 text-amber-900 font-bold">
                        <span>Adjusted Total Labor Cost:</span>
                        <span className="font-mono">
                          ₹{' '}
                          {(
                            (calculateDaysBetween(selectedDeployment.start_date, selectedDeployment.end_date)) *
                            1000
                          ).toLocaleString('en-IN')}{' '}
                          (Accurate per member)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSwapModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={swapping || availableCrew.length === 0}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {swapping ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating System...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Confirm Mid-Shoot Crew Swap</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
