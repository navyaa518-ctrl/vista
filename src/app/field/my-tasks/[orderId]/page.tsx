'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { WalkInOrder, WalkInOrderItem } from '@/types/orders';
import { DamageIncidentRecord } from '@/types/fieldCrew';
import { ordersService } from '@/lib/services/orders';
import { fieldCrewService } from '@/lib/services/fieldCrew';
import { crewHubService } from '@/lib/services/crewHub';
import { formatINR } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { ReportDamageModal } from '@/components/field/ReportDamageModal';
import { DamageIncidentReceiptModal } from '@/components/documents/DamageIncidentReceiptModal';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  HardHat,
  Truck,
  MapPin,
  Calendar,
  Building,
  Phone,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Check,
  Printer,
  Sparkles,
  Camera,
  Layers,
  Info,
  Clock,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function FieldWorkerOrderDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;
  const router = useRouter();
  const { user, profile } = useAuth();

  const workerName = profile?.full_name || 'Ramesh Babu (Senior Field Crew)';
  const workerId = user?.id || 'fw-001';

  const [order, setOrder] = useState<WalkInOrder | null>(null);
  const [items, setItems] = useState<WalkInOrderItem[]>([]);
  const [incidents, setIncidents] = useState<DamageIncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Pre-Dispatch Inspection State
  const [verifiedItemIds, setVerifiedItemIds] = useState<string[]>([]);
  const [preDispatchCompleted, setPreDispatchCompleted] = useState(false);

  // Return Handover State
  const [returnedItemIds, setReturnedItemIds] = useState<string[]>([]);
  const [returnCompleted, setReturnCompleted] = useState(false);

  // Modals
  const [reportDamageModalOpen, setReportDamageModalOpen] = useState(false);
  const [selectedIncidentForReceipt, setSelectedIncidentForReceipt] = useState<DamageIncidentRecord | null>(null);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        const [ord, itms, incs, preInsp, retHand] = await Promise.all([
          ordersService.getOrderById(orderId),
          ordersService.getOrderItems(orderId),
          fieldCrewService.getOrderDamageIncidents(orderId),
          fieldCrewService.getPreDispatchInspection(orderId),
          fieldCrewService.getReturnHandover(orderId),
        ]);

        if (ord) setOrder(ord);
        if (itms) {
          setItems(itms);
          if (preInsp && preInsp.verified_all_packed) {
            setPreDispatchCompleted(true);
            setVerifiedItemIds(preInsp.verified_item_ids);
          } else {
            // Default check all if already dispatched
            if (ord?.status === 'DISPATCHED_RENTAL_PIPELINE' || ord?.status === 'Dispatched') {
              setPreDispatchCompleted(true);
              setVerifiedItemIds(itms.map((i) => i.id));
            }
          }

          if (retHand && retHand.verified_return_to_bay) {
            setReturnCompleted(true);
            setReturnedItemIds(retHand.checked_item_ids);
          }
        }
        if (incs) setIncidents(incs);
      } catch (e) {
        console.error('Failed to load order manifest:', e);
      } finally {
        setLoading(false);
      }
    };
    loadOrderData();
  }, [orderId]);

  // Toggle Item in Pre-Dispatch Checklist
  const togglePreDispatchItem = (itemId: string) => {
    setVerifiedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Complete Pre-Dispatch Verification
  const handleConfirmPreDispatch = async () => {
    if (verifiedItemIds.length !== items.length) {
      if (!confirm(`You have verified ${verifiedItemIds.length} of ${items.length} props. Proceed with packing confirmation?`)) {
        return;
      }
    }

    try {
      await fieldCrewService.verifyPreDispatchInspection({
        order_id: orderId,
        worker_id: workerId,
        worker_name: workerName,
        verified_item_ids: verifiedItemIds,
        verified_all_packed: true,
        inspected_at: new Date().toISOString(),
      });
      setPreDispatchCompleted(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (e) {
      console.error('Pre-dispatch confirmation error:', e);
    }
  };

  // Toggle Item in Return Handover
  const toggleReturnItem = (itemId: string) => {
    setReturnedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Complete Return Handover
  const handleConfirmReturnHandover = async () => {
    if (returnedItemIds.length !== items.length) {
      if (!confirm(`You have checked ${returnedItemIds.length} of ${items.length} props back into bay. Proceed?`)) {
        return;
      }
    }

    try {
      await fieldCrewService.verifyReturnHandover({
        order_id: orderId,
        worker_id: workerId,
        worker_name: workerName,
        checked_item_ids: returnedItemIds,
        verified_return_to_bay: true,
        returned_at: new Date().toISOString(),
      });
      setReturnCompleted(true);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
      console.error('Return handover confirmation error:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
        <HardHat className="w-10 h-10 text-amber-500 animate-bounce" />
        <p className="text-sm font-semibold">Loading On-Site Manifest &amp; Items...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-900">Order Not Found</h3>
        <p className="text-xs">The requested manifest does not exist in the active fleet registry.</p>
        <Link
          href="/field/my-tasks"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
        >
          Return to Tasks Queue
        </Link>
      </div>
    );
  }

  const duration = order.duration_days || order.rental_days || 3;
  const isDispatched = order.status === 'DISPATCHED_RENTAL_PIPELINE' || order.status === 'Dispatched';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/field/my-tasks"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assigned Tasks Queue</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* On-Site Attendance Check-in */}
          <button
            onClick={async () => {
              try {
                await crewHubService.submitFieldLog({
                  order_id: orderId,
                  crew_member_id: workerId,
                  log_type: 'Attendance',
                  location_name: order?.shoot_location || 'Ramoji Film City Set',
                  notes: `On-site check-in verified by ${workerName}. Ready for set operations.`,
                });
                alert(`Attendance check-in logged for ${order?.movie_project_name || 'order'}!`);
              } catch (e) {
                console.error(e);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>Check-in Attendance</span>
          </button>

          {/* Daily Prop Health Sign-off */}
          <button
            onClick={async () => {
              try {
                await crewHubService.submitFieldLog({
                  order_id: orderId,
                  crew_member_id: workerId,
                  log_type: 'Prop_Health_Update',
                  location_name: order?.shoot_location || 'Set Storage Bay',
                  notes: `Daily Prop Health Sign-off: All ${items.length} props verified safe, undamaged, and sheltered. Signed by ${workerName}.`,
                });
                confetti({ particleCount: 50, spread: 60 });
                alert(`Daily Prop Health sign-off submitted for ${order?.movie_project_name}!`);
              } catch (e) {
                console.error(e);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Prop Health Sign-off</span>
          </button>

          {/* Primary Action: Report Damaged Prop */}
          <button
            onClick={() => setReportDamageModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Report Damaged Prop</span>
          </button>
        </div>
      </div>

      {/* Order Info Manifest Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                {order.order_number}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isDispatched
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {isDispatched ? 'Dispatched to Set' : 'Pre-Dispatch Staging'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Gate Pass: <strong className="font-mono">{order.gate_pass_number || 'GP-ACTIVE'}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              {order.movie_project_name}
            </h1>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Production House</span>
            <strong className="text-slate-900 font-bold block">{order.client_name}</strong>
            <span className="text-slate-500 text-[11px]">{order.client_phone || '+91 98490 12345'}</span>
          </div>
        </div>

        {/* Shoot Particulars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Location</span>
              <strong className="text-slate-900 font-bold truncate block">{order.shoot_location || 'Ramoji Film City'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <Truck className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Lorry / Van</span>
              <strong className="text-slate-900 font-mono font-bold truncate block">{order.vehicle_number || 'TS 09 EA 4521'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Duration</span>
              <strong className="text-slate-900 font-bold block">{duration} Shoot Days</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <Phone className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Driver</span>
              <span className="text-slate-800 font-medium truncate block">{order.driver_name?.split('(')[0] || 'Mohan Babu'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================
          1. PRE-DISPATCH CONDITION INSPECTION SECTION
          ================================================================= */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>1. Pre-Dispatch Condition Inspection &amp; Lorry Loading</span>
            </div>
            <p className="text-xs text-slate-500">
              Verify all physical serialized props before cargo truck departure from Ashwa warehouse.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
              {verifiedItemIds.length} / {items.length} Props Verified
            </span>
          </div>
        </div>

        {preDispatchCompleted ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <strong className="font-bold">
                All {items.length} Props Verified &amp; Packed in Good Condition
              </strong>
            </div>
            <span className="text-[11px] text-slate-500">Inspected by {workerName}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item) => {
                const isVerified = verifiedItemIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => togglePreDispatchItem(item.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isVerified
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isVerified ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'
                        }`}
                      >
                        {isVerified && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-xs font-bold text-slate-900 truncate block">
                          {item.prop_title}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {item.item_code} • {item.warehouse_location}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-600 font-semibold shrink-0">
                      {formatINR(item.replacement_value)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleConfirmPreDispatch}
                disabled={verifiedItemIds.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm All {verifiedItemIds.length} Props Packed in Good Condition</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================
          2. ACTIVE PROPS MANIFEST & ON-SITE INSPECTION
          ================================================================= */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-amber-600" />
              <span>Serialized Props Manifest ({items.length} Assets on loan)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Each unit holds certified serial identification and replacement indemnity.
            </p>
          </div>

          <button
            onClick={() => setReportDamageModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Report Damaged Prop</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <QrCode className="w-6 h-6 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <strong className="text-xs font-bold text-slate-900 truncate block">
                    {item.prop_title}
                  </strong>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 mt-0.5">
                    <span className="font-bold text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded border border-amber-200">
                      {item.item_code}
                    </span>
                    <span>Bay: {item.warehouse_location}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono text-xs font-bold text-slate-800">
                  {formatINR(item.replacement_value)}
                </div>
                <button
                  onClick={() => setReportDamageModalOpen(true)}
                  className="mt-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>Report Damage</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =================================================================
          3. RECORDED DAMAGE INCIDENTS FOR THIS ORDER
          ================================================================= */}
      {incidents.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border-2 border-rose-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>On-Site Damage Incidents Logged ({incidents.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Supplementary billing debit notes generated for production settlement.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                      {inc.incident_number}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-rose-200 text-rose-800">
                      {inc.severity.replace('_', ' ')}
                    </span>
                  </div>
                  <strong className="text-xs font-bold text-slate-900 block">
                    {inc.prop_title} ({inc.item_code})
                  </strong>
                  <p className="text-[11px] text-slate-600 font-mono">{inc.description}</p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                  <span className="font-mono text-sm font-bold text-rose-700">
                    {formatINR(inc.repair_or_replacement_cost)}
                  </span>
                  <button
                    onClick={() => setSelectedIncidentForReceipt(inc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Print Incident Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================
          4. RETURN HANDOVER CHECK-IN
          ================================================================= */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Truck className="w-4 h-4 text-amber-600" />
              <span>3. Return Handover &amp; Warehouse Bay Check-in</span>
            </div>
            <p className="text-xs text-slate-500">
              When shoot concludes, check props back into godown storage bays.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
            {returnedItemIds.length} / {items.length} Checked In
          </span>
        </div>

        {returnCompleted ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <strong className="font-bold">
                Return Handover Completed &amp; All Props Checked into Warehouse Bays
              </strong>
            </div>
            <span className="text-[11px] text-slate-500">Checked by {workerName}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item) => {
                const isChecked = returnedItemIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleReturnItem(item.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-xs font-bold text-slate-900 truncate block">
                          {item.prop_title}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {item.item_code} • Return to: {item.warehouse_location}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleConfirmReturnHandover}
                disabled={returnedItemIds.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>Complete Warehouse Handover ({returnedItemIds.length} Items)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REPORT DAMAGE MODAL */}
      {reportDamageModalOpen && (
        <ReportDamageModal
          order={order}
          items={items}
          currentWorkerName={workerName}
          currentWorkerId={workerId}
          onClose={() => setReportDamageModalOpen(false)}
          onSuccess={(newIncident) => {
            setReportDamageModalOpen(false);
            setIncidents((prev) => [newIncident, ...prev]);
            setSelectedIncidentForReceipt(newIncident);
          }}
        />
      )}

      {/* DAMAGE INCIDENT RECEIPT MODAL */}
      {selectedIncidentForReceipt && (
        <DamageIncidentReceiptModal
          incident={selectedIncidentForReceipt}
          onClose={() => setSelectedIncidentForReceipt(null)}
        />
      )}
    </div>
  );
}
