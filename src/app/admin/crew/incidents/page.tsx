'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  FileText,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  HardHat,
  Eye,
  DollarSign,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { fieldCrewService } from '@/lib/services/fieldCrew';
import { DamageIncidentRecord } from '@/types/fieldCrew';
import { DamageIncidentReceiptModal } from '@/components/documents/DamageIncidentReceiptModal';
import { formatINR } from '@/lib/utils';

export default function CrewIncidentsPage() {
  const [incidents, setIncidents] = useState<DamageIncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<DamageIncidentRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const data = await fieldCrewService.getAllDamageIncidents();
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load damage incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
    const unsubscribe = fieldCrewService.subscribeToIncidents(() => {
      loadIncidents();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleStatusUpdate = async (
    id: string,
    status: 'Pending_Review' | 'Billed_To_Client' | 'Waived' | 'Settled'
  ) => {
    try {
      await fieldCrewService.updateIncidentStatus(id, status);
      await loadIncidents();
    } catch (err) {
      console.error('Failed to update incident status:', err);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filterStatus !== 'All' && inc.status !== filterStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.incident_number.toLowerCase().includes(q) ||
      inc.movie_project_name.toLowerCase().includes(q) ||
      inc.prop_title.toLowerCase().includes(q) ||
      inc.reported_by_name?.toLowerCase().includes(q) ||
      inc.client_name?.toLowerCase().includes(q)
    );
  });

  const totalCost = incidents.reduce((acc, i) => acc + (i.repair_or_replacement_cost || 0), 0);
  const pendingCount = incidents.filter((i) => i.status === 'Pending_Review').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6">
      {/* 1. TOP COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Field Incident Governance
            </span>
            <span className="text-xs font-mono text-slate-400">/admin/crew/incidents</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
            Damage &amp; Incident Reports (Rental Pipeline)
          </h1>
          <p className="text-xs text-slate-500">
            Tickets raised by field crew for on-set prop damages, photographic evidence, client debit notes, and workshop repairs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/crew/deployments"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <HardHat className="w-3.5 h-3.5 text-amber-400" />
            <span>Deployments Board</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Incident Tickets
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5">{incidents.length} Tickets</div>
          <span className="text-[11px] text-slate-500">Pipeline active &amp; historical</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending Manager Review
          </span>
          <div className="text-2xl font-extrabold text-rose-600 mt-0.5">{pendingCount} Actionable</div>
          <span className="text-[11px] text-rose-600 font-semibold">Requires billing clearance</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Assessed Damage
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-0.5 font-mono">
            {formatINR(totalCost)}
          </div>
          <span className="text-[11px] text-slate-500">Repair &amp; replacement valuation</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Billed / Settled
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">
            {incidents.filter((i) => i.status === 'Billed_To_Client' || i.status === 'Settled').length} Closed
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Debit notes issued</span>
        </div>
      </div>

      {/* 3. SEARCH & FILTERS */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Pending_Review', 'Billed_To_Client', 'Waived', 'Settled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'All'
                ? 'All Incidents'
                : st === 'Pending_Review'
                ? 'Pending Review'
                : st === 'Billed_To_Client'
                ? 'Billed to Client'
                : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket #, movie, or prop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:bg-white text-slate-900"
          />
        </div>
      </div>

      {/* 4. INCIDENT TICKETS LIST */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          Loading Incident Reports...
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Damage Incidents Recorded</p>
          <p className="text-xs text-slate-400">
            Field crew reports will automatically appear here when damage is logged during shoot.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => {
            const isPending = incident.status === 'Pending_Review';
            const isBilled = incident.status === 'Billed_To_Client';

            return (
              <div
                key={incident.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg">
                      {incident.incident_number}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        incident.severity === 'Total_Loss'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : incident.severity === 'Moderate'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-sky-100 text-sky-900 border-sky-300'
                      }`}
                    >
                      Severity: {incident.severity.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-700">
                      Order: <strong className="text-slate-900">{incident.order_number}</strong>
                    </span>
                    <span className="text-xs text-slate-500">({incident.movie_project_name})</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Print Debit Note</span>
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Damaged Prop */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Damaged Prop &amp; Serial
                    </span>
                    <strong className="text-slate-900 font-bold block text-sm">
                      {incident.prop_title}
                    </strong>
                    <span className="text-slate-500 font-mono block">
                      Tag: {incident.item_code} • {incident.prop_category}
                    </span>
                    <span className="text-slate-600 block">
                      Replacement Value: {formatINR(incident.replacement_value)}
                    </span>
                  </div>

                  {/* Reported By & Location */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Reported By &amp; Location
                    </span>
                    <strong className="text-slate-800 font-semibold block">
                      {incident.reported_by_name || 'Ashwa Field Crew'}
                    </strong>
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{incident.shoot_location || 'Film Set'}</span>
                    </div>
                    <span className="text-slate-400 text-[11px] block">
                      Logged: {new Date(incident.created_at).toLocaleString()}
                    </span>
                  </div>

                  {/* Financial Assessment & Status */}
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Assessed Repair Cost
                      </span>
                      <div className="text-lg font-extrabold text-rose-700 font-mono">
                        {formatINR(incident.repair_or_replacement_cost)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-[11px] text-slate-500">Current Status:</span>
                      <select
                        value={incident.status}
                        onChange={(e) => handleStatusUpdate(incident.id, e.target.value as any)}
                        className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Pending_Review">Pending Review</option>
                        <option value="Billed_To_Client">Billed to Client</option>
                        <option value="Waived">Waived (Insurance)</option>
                        <option value="Settled">Settled &amp; Paid</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description & Evidence Photos */}
                <div className="p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-2 text-xs">
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Incident Description: </strong>
                    {incident.description}
                  </p>

                  {incident.evidence_photos && incident.evidence_photos.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-500">Photographic Evidence:</span>
                      <div className="flex gap-2">
                        {incident.evidence_photos.map((photo, i) => (
                          <a
                            key={i}
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-12 h-12 rounded-lg border border-slate-300 overflow-hidden shrink-0 hover:opacity-80 transition-opacity"
                          >
                            <Image
                              src={photo}
                              alt="Evidence"
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================================================================
          5. DAMAGE INCIDENT RECEIPT PRINT MODAL
          =================================================================== */}
      {selectedIncident && (
        <DamageIncidentReceiptModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}
