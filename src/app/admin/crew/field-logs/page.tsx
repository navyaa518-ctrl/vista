'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Send,
  RefreshCw,
  Search,
  Filter,
  X,
  Bell,
  HardHat,
  ShieldAlert,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { crewHubService } from '@/lib/services/crewHub';
import { EnrichedFieldLogEntry, BroadcastAnnouncement, CrewMember360 } from '@/types/crewHub';
import { CrewFieldLogType } from '@/types/database';

export default function CrewFieldLogsPage() {
  const [logs, setLogs] = useState<EnrichedFieldLogEntry[]>([]);
  const [announcements, setAnnouncements] = useState<BroadcastAnnouncement[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember360[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'All' | CrewFieldLogType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Broadcast Modal State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'Normal' | 'Urgent' | 'Critical_Alert'>('Urgent');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Quick Simulation Modal State (Allows managers to log on behalf of crew)
  const [simulateModalOpen, setSimulateModalOpen] = useState(false);
  const [simCrewId, setSimCrewId] = useState('');
  const [simLogType, setSimLogType] = useState<CrewFieldLogType>('Prop_Health_Update');
  const [simLocation, setSimLocation] = useState('Annapurna Studios 7-acre set');
  const [simNotes, setSimNotes] = useState('All 42 props safe at Annapurna Studios 7-acre set. Rain canopy installed.');
  const [simulating, setSimulating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsData, annData, membersData] = await Promise.all([
        crewHubService.getFieldLogs(),
        crewHubService.getBroadcastAnnouncements(),
        crewHubService.getCrewMembers(),
      ]);
      setLogs(logsData);
      setAnnouncements(annData);
      setCrewMembers(membersData);
      if (membersData.length > 0 && !simCrewId) {
        setSimCrewId(membersData[0].id);
      }
    } catch (err) {
      console.error('Failed to load field logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = crewHubService.subscribeToCrewHub((event) => {
      if (event.table === 'crew_field_logs') {
        loadData();
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    try {
      setBroadcasting(true);
      await crewHubService.broadcastAnnouncement({
        title: broadcastTitle,
        message: broadcastMessage,
        priority: broadcastPriority,
        sent_by: 'Super Admin / Operations Command',
      });
      setBroadcastSuccess(true);
      await loadData();
      setTimeout(() => {
        setBroadcastModalOpen(false);
        setBroadcastSuccess(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
      }, 1800);
    } catch (err) {
      console.error('Broadcast failed:', err);
      alert('Failed to send broadcast alert.');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleSimulateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simCrewId || !simNotes.trim()) return;

    try {
      setSimulating(true);
      await crewHubService.submitFieldLog({
        order_id: 'ord-walkin-001',
        crew_member_id: simCrewId,
        log_type: simLogType,
        location_name: simLocation,
        gps_coordinates: { latitude: 17.4325, longitude: 78.4071, accuracy: 8 },
        notes: simNotes,
      });
      await loadData();
      setSimulateModalOpen(false);
    } catch (err) {
      console.error('Failed to submit simulation:', err);
    } finally {
      setSimulating(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === 'All' || log.log_type === filterType;
    if (!matchesType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.crew_member_name.toLowerCase().includes(q) ||
      log.movie_project_name.toLowerCase().includes(q) ||
      log.location_name?.toLowerCase().includes(q) ||
      log.notes?.toLowerCase().includes(q) ||
      log.crew_badge_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6">
      {/* 1. TOP COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              Live Mobile Stream
            </span>
            <span className="text-xs font-mono text-slate-400">/admin/crew/field-logs</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-sky-600" />
            Daily Attendance &amp; Field Status Feed
          </h1>
          <p className="text-xs text-slate-500">
            Real-time feed of location check-ins, GPS pings, and daily &quot;Prop Health&quot; sign-offs from on-site movie sets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setSimulateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Simulate Log</span>
          </button>

          <button
            onClick={() => setBroadcastModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-slate-950" />
            <span>Broadcast Announcement</span>
          </button>
        </div>
      </div>

      {/* 2. BROADCAST ALERT BANNER (If any) */}
      {announcements.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                Active Operational Broadcast ({announcements[0].priority})
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(announcements[0].created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-1">{announcements[0].title}</h4>
            <p className="text-xs text-slate-700 mt-0.5">{announcements[0].message}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Dispatched by: {announcements[0].sent_by}
            </span>
          </div>
        </div>
      )}

      {/* 3. FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', 'Attendance', 'Prop_Health_Update', 'Location_Ping', 'Incident'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {t === 'All'
                ? 'All Updates'
                : t === 'Attendance'
                ? 'Check-Ins'
                : t === 'Prop_Health_Update'
                ? 'Prop Health Sign-offs'
                : t === 'Location_Ping'
                ? 'Location Pings'
                : 'Incident Alerts'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs by crew or movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:bg-white text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* 4. LIVE TIMELINE FEED */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
          <span className="text-sm font-semibold">Streaming Field Logs...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <Clock className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-bold text-slate-700">No Logs Matching Filter</p>
          <p className="text-xs text-slate-400">
            Updates submitted by on-site crew from the field portal will display here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((entry) => {
            const isHealthSignOff = entry.log_type === 'Prop_Health_Update';
            const isIncident = entry.log_type === 'Incident';
            const isAttendance = entry.log_type === 'Attendance';

            return (
              <div
                key={entry.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300 flex flex-col sm:flex-row items-start gap-4 ${
                  isHealthSignOff
                    ? 'border-emerald-200/90 bg-gradient-to-r from-white via-white to-emerald-50/20'
                    : isIncident
                    ? 'border-rose-300 bg-rose-50/10'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Crew Member Avatar & Badge */}
                <div className="w-11 h-11 rounded-full bg-slate-200 relative overflow-hidden shrink-0 border border-slate-300">
                  <Image
                    src={entry.crew_avatar_url}
                    alt={entry.crew_member_name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/crew/members/${entry.crew_member_id}`}
                        className="text-sm font-bold text-slate-900 hover:text-sky-700 hover:underline"
                      >
                        {entry.crew_member_name}
                      </Link>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {entry.crew_badge_number}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {entry.movie_project_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isHealthSignOff
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isIncident
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : isAttendance
                            ? 'bg-sky-50 text-sky-800 border-sky-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {isHealthSignOff
                          ? '🛡️ Prop Health Sign-off'
                          : isIncident
                          ? '⚠️ Damage Alert'
                          : isAttendance
                          ? '📍 Attendance Check-in'
                          : '📡 Location Ping'}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {new Date(entry.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Location & GPS Info */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {entry.location_name || 'Ramoji Film City Set'}
                    </span>
                    {entry.gps_coordinates && (
                      <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <Navigation className="w-3 h-3 text-sky-500" />
                        {entry.gps_coordinates.latitude.toFixed(4)},{' '}
                        {entry.gps_coordinates.longitude.toFixed(4)} (±
                        {entry.gps_coordinates.accuracy}m)
                      </span>
                    )}
                  </div>

                  {/* Notes / Health Message */}
                  {entry.notes && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium ${
                        isHealthSignOff
                          ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950'
                          : isIncident
                          ? 'bg-rose-50 border border-rose-200 text-rose-950'
                          : 'bg-slate-50 border border-slate-200 text-slate-800'
                      }`}
                    >
                      <p>{entry.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================
          5. BROADCAST ANNOUNCEMENT MODAL
          =================================================================== */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-amber-600" /> Operations Command
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Broadcast Alert to On-Site Field Crews
                </h3>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {broadcastSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-900">Announcement Broadcasted</h4>
                <p className="text-xs text-emerald-700">
                  Push alert sent to all mobile field staff on active movie sets.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Normal', 'Urgent', 'Critical_Alert'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setBroadcastPriority(lvl)}
                        className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer ${
                          broadcastPriority === lvl
                            ? lvl === 'Critical_Alert'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : lvl === 'Urgent'
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lvl.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Announcement Subject <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. Rain Alert: Protect Electronic &amp; Vintage Props"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Message Details <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="All field crews on outdoor sets must immediately cover optical gear and ensure storage tarpaulins are tied down..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBroadcastModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={broadcasting}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {broadcasting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Broadcast Instantly</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          6. SIMULATE ON-SITE LOG MODAL
          =================================================================== */}
      {simulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Mobile Simulator
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Simulate On-Site Crew Update
                </h3>
              </div>
              <button
                onClick={() => setSimulateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulateLog} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Logging Crew Member
                </label>
                <select
                  value={simCrewId}
                  onChange={(e) => setSimCrewId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none"
                >
                  {crewMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.badge_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Log Type
                </label>
                <select
                  value={simLogType}
                  onChange={(e) => setSimLogType(e.target.value as CrewFieldLogType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none"
                >
                  <option value="Prop_Health_Update">Daily Prop Health Sign-off</option>
                  <option value="Attendance">Location Check-in / Attendance</option>
                  <option value="Location_Ping">Transit Location Ping</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Set Location
                </label>
                <input
                  type="text"
                  value={simLocation}
                  onChange={(e) => setSimLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Notes / Health Audit Sign-off Statement
                </label>
                <textarea
                  rows={3}
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSimulateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {simulating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Publish Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
