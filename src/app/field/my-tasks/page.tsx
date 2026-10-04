'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WalkInOrder } from '@/types/orders';
import { DamageIncidentRecord } from '@/types/fieldCrew';
import { fieldCrewService } from '@/lib/services/fieldCrew';
import { formatINR } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { DamageIncidentReceiptModal } from '@/components/documents/DamageIncidentReceiptModal';
import {
  HardHat,
  Truck,
  MapPin,
  Calendar,
  Building,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Clock,
  Radio,
  FileSpreadsheet,
  Layers,
  Search,
  Check,
} from 'lucide-react';

export default function FieldWorkerTasksPage() {
  const { user, profile } = useAuth();
  const workerId = user?.id || 'fw-001';
  const workerName = profile?.full_name || 'Ramesh Babu (Senior Field Crew)';

  const [orders, setOrders] = useState<WalkInOrder[]>([]);
  const [incidents, setIncidents] = useState<DamageIncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'staged' | 'returned' | 'incidents'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<DamageIncidentRecord | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const [taskOrders, dmgIncidents] = await Promise.all([
          fieldCrewService.getFieldWorkerTasks(workerId),
          fieldCrewService.getAllDamageIncidents(),
        ]);
        setOrders(taskOrders);
        setIncidents(dmgIncidents);
      } catch (e) {
        console.error('Error loading field worker tasks:', e);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();

    // Listen for realtime damage events
    const handleNewIncident = (e: any) => {
      if (e.detail?.incident) {
        setIncidents((prev) => [e.detail.incident, ...prev]);
      }
    };
    window.addEventListener('ashwa_damage_incident', handleNewIncident);
    return () => {
      window.removeEventListener('ashwa_damage_incident', handleNewIncident);
    };
  }, [workerId]);

  const activeOrders = orders.filter(
    (o) =>
      o.status === 'DISPATCHED_RENTAL_PIPELINE' ||
      o.status === 'Dispatched'
  );

  const stagedOrders = orders.filter(
    (o) =>
      o.status === 'PICKING_IN_PROGRESS' ||
      o.status === 'Picking_In_Progress' ||
      o.status === 'Confirmed' ||
      o.status === 'Draft'
  );

  const returnedOrders = orders.filter((o) => o.status === 'Returned');

  const filteredOrders = (
    activeTab === 'active'
      ? activeOrders
      : activeTab === 'staged'
      ? stagedOrders
      : activeTab === 'returned'
      ? returnedOrders
      : orders
  ).filter(
    (o) =>
      o.movie_project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.vehicle_number && o.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
        <HardHat className="w-10 h-10 text-amber-500 animate-bounce" />
        <p className="text-sm font-semibold">Connecting to Field Operations Server...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Welcome & Shift Summary Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Radio className="w-3 h-3 text-amber-600 animate-pulse" />
              <span>On-Duty Shift Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Assigned Field Tasks &amp; Film Logistics
            </h1>
            <p className="text-xs text-slate-500">
              Logged in as <strong className="text-slate-800 font-semibold">{workerName}</strong> • Lead Prop Handling &amp; Transit Crew
            </p>
          </div>

          {/* Quick Stat Pills */}
          <div className="grid grid-cols-3 gap-2 shrink-0 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Active Shoots</span>
              <strong className="text-base font-extrabold text-slate-900 font-mono">
                {activeOrders.length}
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-800 font-bold block uppercase">Staged</span>
              <strong className="text-base font-extrabold text-amber-900 font-mono">
                {stagedOrders.length}
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] text-rose-700 font-bold block uppercase">Damage Logs</span>
              <strong className="text-base font-extrabold text-rose-800 font-mono">
                {incidents.length}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Apple-style Segmented Filter Bar */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-200/80 border border-slate-300 text-xs font-semibold max-w-lg w-full">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
              activeTab === 'active'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active On-Set ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('staged')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
              activeTab === 'staged'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pre-Dispatch ({stagedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('returned')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
              activeTab === 'returned'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Returned ({returnedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer truncate ${
              activeTab === 'incidents'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-rose-700 hover:text-rose-900'
            }`}
          >
            Damage Tickets ({incidents.length})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search movie, order, lorry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'incidents' ? (
        /* DAMAGE INCIDENT TICKETS VIEW */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Recorded Damage Incident Tickets ({incidents.length})</span>
            </h2>
            <span className="text-[11px] text-slate-500">
              Click any ticket to preview &amp; print official debit note
            </span>
          </div>

          {incidents.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">No Damage Incidents Reported</h3>
              <p className="text-xs">All props in your custody are in safe, certified condition.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                        {inc.incident_number}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase bg-amber-50 text-amber-800 border-amber-200">
                        {inc.severity.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{inc.prop_title}</h4>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Serial: {inc.item_code} • {inc.movie_project_name}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg font-mono text-[11px]">
                      {inc.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Penalty Amount</span>
                      <span className="font-mono font-bold text-rose-700 text-sm">
                        {formatINR(inc.repair_or_replacement_cost)}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 hover:underline">
                      View Receipt &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ASSIGNED ORDERS QUEUE */
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <Truck className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">No Orders in this Queue</h3>
              <p className="text-xs">No active orders match the selected status filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((ord) => {
                const duration = ord.duration_days || ord.rental_days || 3;
                const isDispatched =
                  ord.status === 'DISPATCHED_RENTAL_PIPELINE' || ord.status === 'Dispatched';

                return (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Top Row: Order Number & Status Badge */}
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                        <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                          {ord.order_number}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                              isDispatched
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {isDispatched ? 'On-Set Active' : 'Pre-Dispatch Staging'}
                          </span>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {ord.crew_type === 'client_sourced' ? 'Client Crew' : 'In-House Staff'}
                          </span>
                        </div>
                      </div>

                      {/* Movie Title & Production */}
                      <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                          {ord.movie_project_name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ord.client_name}</span>
                        </div>
                      </div>

                      {/* Shoot Particulars: Location, Lorry, Driver */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">{ord.shoot_location || 'Ramoji Film City'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                          <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate font-mono font-bold text-slate-800">
                            {ord.vehicle_number || 'TS 09 EA 4521'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Duration: <strong>{duration} Shoot Days</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Driver: <strong>{ord.driver_name?.split('(')[0] || 'Mohan Babu'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500">
                        Gate Pass: <strong className="font-mono text-slate-800">{ord.gate_pass_number || 'GP-ACTIVE'}</strong>
                      </div>

                      <Link
                        href={`/field/my-tasks/${ord.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                      >
                        <span>Open Task Manifest</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DAMAGE RECEIPT MODAL */}
      {selectedIncident && (
        <DamageIncidentReceiptModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}
