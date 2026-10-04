'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Radio,
  Clock,
  MapPin,
  Calendar,
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Printer,
  FileSpreadsheet,
  Truck,
  Sparkles,
  QrCode,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Info,
  CreditCard,
  Building,
  Phone,
  Mail,
  X,
  FileText,
  UserCheck,
  Receipt,
  Check,
  Shield,
  HardHat,
  UserPlus,
  Plus,
  Edit3,
  Lock,
} from 'lucide-react';
import { ordersService, STAFF_EXECUTIVES } from '@/lib/services/orders';
import { isOrderLocked } from '@/lib/services/orderStateMachine';
import { fieldCrewService } from '@/lib/services/fieldCrew';
import { crewHubService } from '@/lib/services/crewHub';
import { FieldWorkerProfile, ClientSourcedCrewInput } from '@/types/fieldCrew';
import { rbacService } from '@/lib/services/rbac';
import { WalkInOrder, WalkInOrderItem, OrderLifecycleStatus } from '@/types/orders';
import { formatINR } from '@/lib/utils';
import { soundEffects } from '@/lib/audio';
import confetti from 'canvas-confetti';
import { useAuth } from '@/context/AuthContext';
import { DeleteOrderConfirmDialog } from '@/components/orders/DeleteOrderConfirmDialog';
import { InvoiceModal } from '@/components/documents/InvoiceModal';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BillingCounterCartPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();
  const { user, profile, role } = useAuth();

  const [order, setOrder] = useState<WalkInOrder | null>(null);
  const [items, setItems] = useState<WalkInOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentScannedId, setRecentScannedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Advance Payment State
  const [advancePaid, setAdvancePaid] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Credit Card'>('Cash');
  const [savingAdvance, setSavingAdvance] = useState(false);

  // Final Dispatch Verification Modal State
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [transportVehicleNumber, setTransportVehicleNumber] = useState('TS 09 EA 4521');
  const [driverName, setDriverName] = useState('Mohan Babu (Senior Cargo Driver)');
  const [driverMobile, setDriverMobile] = useState('+91 94400 55667');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);
  const [activeGatePass, setActiveGatePass] = useState<string | null>(null);

  // Field Workers & Labor Billing State
  const [crewType, setCrewType] = useState<'in_house' | 'client_sourced'>('in_house');
  const [availableWorkers, setAvailableWorkers] = useState<FieldWorkerProfile[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>(['fw-001', 'fw-002']);
  const [dailyWageRate, setDailyWageRate] = useState<number>(1000);
  const [workerCount, setWorkerCount] = useState<number>(2);
  const [clientCrewList, setClientCrewList] = useState<ClientSourcedCrewInput[]>([
    { id: 'cc-1', name: 'Ramesh (Lightman / Grip)', phone: '+91 98499 11223', govt_id_or_notes: 'Govt ID: 8842-1192-3341' },
    { id: 'cc-2', name: 'Siva (Production Assistant)', phone: '+91 98499 44556', govt_id_or_notes: 'Crew Pass #RFC-441' },
  ]);
  const [savingLabor, setSavingLabor] = useState(false);
  const [editingLaborInline, setEditingLaborInline] = useState(false);
  const [taxInvoiceModalOpen, setTaxInvoiceModalOpen] = useState(false);
  const [invoiceModalMode, setInvoiceModalMode] = useState<'invoice' | 'quotation'>('invoice');

  // Dynamic Microsoft Dynamics 365 RBAC Clearance State
  const [rbacClearance, setRbacClearance] = useState<{
    canAppendScan: boolean;
    canDispatch: boolean;
    canUpdateFinancials: boolean;
    roles: string[];
  }>({
    canAppendScan: true,
    canDispatch: true,
    canUpdateFinancials: true,
    roles: [],
  });

  useEffect(() => {
    const evaluateRbac = async () => {
      try {
        const [appendRes, dispatchRes, finRes, effectiveRoles] = await Promise.all([
          rbacService.checkPermission(user?.id, 'live_picking', 'append_scan', 'user', role),
          rbacService.checkPermission(user?.id, 'rental_pipeline', 'dispatch_pass', 'user', role),
          rbacService.checkPermission(user?.id, 'financials', 'update', 'user', role),
          rbacService.getUserEffectiveRoles(user?.id, role),
        ]);
        setRbacClearance({
          canAppendScan: appendRes.allowed,
          canDispatch: dispatchRes.allowed,
          canUpdateFinancials: finRes.allowed,
          roles: effectiveRoles.map((r) => r.name),
        });
      } catch (e) {
        console.warn('RBAC clearance evaluation error:', e);
      }
    };
    evaluateRbac();
  }, [user, role]);

  // Load Order and Items
  const loadData = async () => {
    try {
      const [ord, itms, workers] = await Promise.all([
        ordersService.getOrderById(orderId),
        ordersService.getOrderItems(orderId),
        fieldCrewService.getAvailableFieldWorkers(),
      ]);

      if (workers) {
        setAvailableWorkers(workers);
      }

      if (ord) {
        setOrder(ord);
        setAdvancePaid(ord.advance_paid);
        setAdvanceAmount(ord.advance_amount || 0);
        setPaymentMode(ord.payment_mode || 'Cash');

        if (ord.crew_type) setCrewType(ord.crew_type);
        if (ord.daily_wage_rate) setDailyWageRate(ord.daily_wage_rate);
        if (ord.in_house_worker_count) setWorkerCount(ord.in_house_worker_count);
        if (ord.client_sourced_crew && ord.client_sourced_crew.length > 0) {
          setClientCrewList(ord.client_sourced_crew as ClientSourcedCrewInput[]);
        }

        // Try to fetch order_field_crew
        const crew = await fieldCrewService.getOrderCrew(orderId);
        if (crew && crew.length > 0) {
          const inHouse = crew.filter((c) => c.crew_type === 'in_house' && c.worker_id);
          if (inHouse.length > 0) {
            setSelectedWorkerIds(inHouse.map((c) => c.worker_id!));
            setWorkerCount(inHouse.length);
          }
          const ext = crew.filter((c) => c.crew_type === 'client_sourced');
          if (ext.length > 0) {
            setClientCrewList(
              ext.map((c) => ({
                id: c.id,
                name: c.external_name || 'Crew Member',
                phone: c.external_phone || '',
                govt_id_or_notes: c.external_govt_id || '',
              }))
            );
          }
        }
      }

      setItems(itms);
    } catch (e) {
      console.error('Failed to load order data:', e);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();

    // Supabase Realtime + Cross-tab WebSocket Channel
    const unsubscribe = ordersService.subscribeToOrderUpdates(orderId, {
      onItemScanned: (newItem) => {
        soundEffects.playSuccessChime();
        setItems((prev) => {
          const exists = prev.some((i) => i.id === newItem.id);
          if (exists) return prev;
          return [newItem, ...prev];
        });

        setRecentScannedId(newItem.id);
        const execLabel = newItem.added_by_executive_name || newItem.scanned_by_name || 'Executive';
        setToastMessage(`⚡ Scanned by ${execLabel}: ${newItem.item_code} (${newItem.prop_title})`);

        ordersService.getOrderById(orderId).then((ord) => {
          if (ord) setOrder(ord);
        });

        setTimeout(() => setRecentScannedId(null), 5000);
        setTimeout(() => setToastMessage(null), 6000);
      },
      onItemDeleted: (deletedItemId) => {
        setItems((prev) => prev.filter((i) => i.id !== deletedItemId));
        ordersService.getOrderById(orderId).then((ord) => {
          if (ord) setOrder(ord);
        });
      },
      onOrderUpdated: (updatedOrder) => {
        setOrder(updatedOrder);
      },
      onOrderDeleted: (deletedId) => {
        if (deletedId === orderId) {
          router.push('/admin/orders/walk-in');
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [orderId, router]);

  // Single-Click Delete/Remove Prop from Cart
  const handleDeleteItem = async (itemId: string, itemCode: string) => {
    if (!confirm(`Discard ${itemCode} from this active order cart? Prop will be returned to available warehouse stock.`)) return;
    try {
      await ordersService.deleteOrderItem(orderId, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      const updated = await ordersService.getOrderById(orderId);
      if (updated) setOrder(updated);
    } catch (e) {
      console.error('Delete item error:', e);
    }
  };

  // Advance Payment Controls Change
  const handleAdvanceChange = async (
    newPaid: boolean,
    newAmount: number,
    newMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit Card'
  ) => {
    setAdvancePaid(newPaid);
    setAdvanceAmount(newAmount);
    setPaymentMode(newMode);
    setSavingAdvance(true);
    try {
      const updated = await ordersService.updateAdvancePayment(orderId, newPaid, newAmount, newMode);
      if (updated) setOrder(updated);
    } catch (e) {
      console.error('Advance payment update error:', e);
    } finally {
      setSavingAdvance(false);
    }
  };

  // Save as Quotation
  const handleSaveQuotation = async () => {
    try {
      const res = await ordersService.saveAsQuotation(orderId);
      alert(res.message);
      const updated = await ordersService.getOrderById(orderId);
      if (updated) setOrder(updated);
    } catch (e) {
      console.error('Save quotation error:', e);
    }
  };

  // Labor Billing & Crew Sourcing Updates
  const handleLaborBillingUpdate = async (
    newCrewType: 'in_house' | 'client_sourced',
    newWorkerCount: number,
    newWage: number,
    newClientCrew: ClientSourcedCrewInput[] = clientCrewList
  ) => {
    setCrewType(newCrewType);
    setWorkerCount(newWorkerCount);
    setDailyWageRate(newWage);
    setClientCrewList(newClientCrew);

    const dur = order ? (order.duration_days || order.rental_days || 3) : 3;
    const newLaborTotal = newCrewType === 'in_house' ? newWorkerCount * newWage * dur : 0;

    setSavingLabor(true);
    try {
      const updated = await ordersService.updateOrderLaborCharges(orderId, {
        crew_type: newCrewType,
        total_labor_charges: newLaborTotal,
        in_house_worker_count: newWorkerCount,
        daily_wage_rate: newWage,
        client_sourced_crew: newClientCrew,
      });
      if (updated) setOrder(updated);
    } catch (e) {
      console.error('Error updating labor charges:', e);
    } finally {
      setSavingLabor(false);
    }
  };

  // Confirm and Finalize Dispatch
  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transportVehicleNumber.trim()) {
      alert('Transport Vehicle Number is mandatory for cargo dispatch gate pass.');
      return;
    }

    if (crewType === 'client_sourced' && clientCrewList.length === 0) {
      alert('Please add at least one client crew member contact for gate pass documentation.');
      return;
    }

    setDispatching(true);
    try {
      const dur = order ? (order.duration_days || order.rental_days || 3) : 3;
      const selectedWorkers = availableWorkers.filter((w) => selectedWorkerIds.includes(w.id));
      const activeWorkerCount = crewType === 'in_house' ? (workerCount || selectedWorkers.length) : 0;
      const calculatedLaborTotal = crewType === 'in_house' ? activeWorkerCount * dailyWageRate * dur : 0;

      // 1. Assign field crew in order_field_crew & order_crew_assignments
      await fieldCrewService.assignOrderCrew(
        orderId,
        crewType,
        selectedWorkers,
        clientCrewList,
        dailyWageRate,
        dur
      );

      await crewHubService.assignOrderCrewMembers(
        orderId,
        crewType === 'in_house'
          ? selectedWorkers.map((w) => ({
              member_id: w.id,
              start_date: order?.rental_start_date || new Date().toISOString().split('T')[0],
              end_date:
                order?.rental_end_date ||
                new Date(Date.now() + 86400000 * dur).toISOString().split('T')[0],
              daily_wage: dailyWageRate,
            }))
          : [],
        crewType === 'client_sourced'
          ? clientCrewList.map((c) => ({
              full_name: c.name,
              phone_number: c.phone,
              notes: c.govt_id_or_notes,
            }))
          : []
      );

      // 2. Dispatch order
      const res = await ordersService.dispatchOrder(orderId, {
        vehicle_number: transportVehicleNumber,
        driver_name: driverName,
        driver_phone: driverMobile,
        notes: dispatchNotes,
        crew_type: crewType,
        in_house_workers: selectedWorkers,
        client_crew: clientCrewList,
        daily_wage: dailyWageRate,
        total_labor_charges: calculatedLaborTotal,
      });

      if (res.success) {
        setDispatchedSuccess(true);
        setActiveGatePass(res.gatePassNumber || 'GP-2026-DISPATCH');
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
        const updated = await ordersService.getOrderById(orderId);
        if (updated) setOrder(updated);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error('Dispatch error:', err);
      alert('Failed to dispatch order.');
    } finally {
      setDispatching(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center text-slate-500 gap-3">
        <Radio className="w-8 h-8 text-amber-500 animate-pulse" />
        <p className="text-sm font-medium">Connecting to Supabase Realtime Counter Cart...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col items-center justify-center text-slate-500 gap-4 p-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="text-sm">The requested walk-in order ID does not exist in the database.</p>
        <Link
          href="/admin/orders/walk-in"
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all shadow-xs"
        >
          Return to Orders Queue
        </Link>
      </div>
    );
  }

  const isOrderClosed = isOrderLocked(order);
  const isDispatched = !isOrderClosed && (order.status === 'DISPATCHED_RENTAL_PIPELINE' || order.status === 'Dispatched');
  const canEdit = !isDispatched && !isOrderClosed;
  const duration = order.duration_days || order.rental_days || 3;
  const balanceDue = Math.max(0, (order.final_payable || 0) - (advancePaid ? advanceAmount : 0));

  // Cart summary calculations
  const totalPhysicalQuantity = items.reduce((acc, i) => acc + (i.quantity || 1), 0);
  const totalDailyRentSum = items.reduce((acc, i) => acc + ((i.daily_rent_price || 0) * (i.quantity || 1)), 0);

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Toast Notification for Realtime Scans */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-bounce duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl 2xl:max-w-[1600px] w-full mx-auto space-y-6">
        {/* Navigation Breadcrumb & Quick Utility Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/orders/walk-in"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Walk-in Orders Queue
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {/* Microsoft Dynamics 365 RBAC Active Roles Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span>
                Clearance: <strong className="text-slate-900">{rbacClearance.roles.join(' + ') || 'Standard Clearance'}</strong>
              </span>
            </div>

            {!isOrderClosed && (
              <Link
                href={`/ops/picking/${order.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold transition-all shadow-2xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                Open Mobile Scanner as Executive
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}

            <Link
              href="/admin/orders/pipeline"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs"
            >
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              Rental Pipeline Tab
            </Link>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print Gate Pass
            </button>

            {/* Role-Based Order Deletion Action */}
            {(() => {
              const perm = ordersService.canDeleteOrder(order, user, role);
              if (perm.allowed) {
                return (
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                    title="Delete Order (2-Step Verification)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete Order</span>
                  </button>
                );
              } else {
                return (
                  <div className="relative group inline-block">
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold cursor-not-allowed opacity-75"
                      title={perm.reason || "Dispatched orders can only be deleted by a Super Admin"}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Delete Order</span>
                    </button>
                    <div className="absolute right-0 top-full mt-1.5 z-30 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[11px] rounded-xl shadow-xl pointer-events-none">
                      {perm.reason || "Dispatched orders can only be deleted by a Super Admin"}
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>

        {/* =================================================================
            1. TOP SECTION: Order Info Card (Full Width - 100%)
            ================================================================= */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs sm:text-sm font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                  {order.order_number}
                </span>

                {isOrderClosed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-amber-400 border border-slate-700 shadow-sm">
                    <Lock className="w-3.5 h-3.5" />
                    ORDER COMPLETED &amp; LOCKED
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      isDispatched
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {!isDispatched && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                    {order.status === 'PICKING_IN_PROGRESS' || order.status === 'Picking_In_Progress'
                      ? 'PICKING IN PROGRESS (Live Cart)'
                      : order.status}
                  </span>
                )}

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                  Realtime Collaborative Sync Active
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {order.movie_project_name}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                  <Building className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Production</span>
                    <strong className="text-slate-900 font-bold truncate block">{order.client_name}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Contact</span>
                    <span className="text-slate-800 font-medium truncate block">{order.client_phone || '+91 98490 12345'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Shoot Location</span>
                    <span className="text-slate-800 font-medium truncate block">{order.shoot_location || 'Ramoji Film City'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-amber-800/80 block uppercase font-bold">Rental Duration</span>
                    <strong className="text-amber-900 font-extrabold truncate block">
                      {duration} Days ({order.rental_start_date} → {order.rental_end_date})
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Sales Executives Badge Panel */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 lg:min-w-[280px] shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  Active Sales Executives
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {order.assigned_executives?.length || 2} Online
                </span>
              </div>

              <div className="space-y-2">
                {order.assigned_executives && order.assigned_executives.length > 0 ? (
                  order.assigned_executives.map((exec) => (
                    <div
                      key={exec.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold text-slate-800">{exec.name.split('(')[0].trim()}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-mono font-medium">
                        Floor {exec.floor}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None assigned</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            2. MIDDLE SECTION: Collaborative Live Cart Table (FULL WIDTH - 100%)
            ================================================================= */}
        <div className="w-full space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Collaborative Live Cart</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {items.length} Props Scanned
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Realtime warehouse sync active. Props scanned by mobile sales executives appear here automatically.
              </p>
            </div>

            {recentScannedId && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                New Prop Picked &amp; Added!
              </span>
            )}
          </div>

          {/* Full-Width Expansive Table Container */}
          <div className="w-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3.5 px-4 min-w-[280px]">Item Image &amp; Details</th>
                    <th className="py-3.5 px-4 min-w-[150px]">QR Serial Code</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Warehouse Slot</th>
                    <th className="py-3.5 px-4 min-w-[170px]">Added By</th>
                    <th className="py-3.5 px-4 min-w-[130px] text-right">Qty &amp; Daily Rent</th>
                    <th className="py-3.5 px-4 min-w-[140px] text-right">Total Rent ({duration}d)</th>
                    {canEdit && <th className="py-3.5 px-3 w-[60px] text-center">Action</th>}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 7 : 6} className="py-16 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                            <QrCode className="w-6 h-6 animate-pulse" />
                          </div>
                          <h3 className="text-base font-bold text-slate-900">
                            Waiting for Sales Executives to Scan Props...
                          </h3>
                          <p className="text-xs text-slate-500">
                            Assigned executives are scanning physical QR tags on Floor 1 &amp; Floor 2. Newly scanned props will stream into this table instantly with their signature badge.
                          </p>
                          <div className="pt-2">
                            <Link
                              href={`/ops/picking/${order.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              Test Scan as Sales Executive
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const isNewlyScanned = recentScannedId === item.id;
                      const addedBy = item.added_by_executive_name || item.scanned_by_name || 'Ravi Kumar';
                      const isRavi = addedBy.toLowerCase().includes('ravi');

                      return (
                        <tr
                          key={item.id}
                          className={`transition-all duration-700 ${
                            isNewlyScanned
                              ? 'bg-emerald-50/80 ring-1 ring-emerald-300'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* 1. Prop Image & Name / Model */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3.5">
                              {item.image_url ? (
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100 shadow-2xs">
                                  <Image
                                    src={item.image_url}
                                    alt={item.prop_title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0 shadow-2xs">
                                  <Layers className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-sm line-clamp-1">
                                  {item.prop_title}
                                </div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                  {item.model_number || 'Standard SKU'} • <span className="text-slate-600 font-sans">{item.prop_category || 'Props'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Serialized QR Code */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block shadow-2xs">
                              {item.item_code}
                            </span>
                          </td>

                          {/* 3. Warehouse Slot */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">{item.warehouse_location.split('(')[0].trim()}</span>
                            </span>
                          </td>

                          {/* 4. Added By Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs ${
                                isRavi
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isRavi ? 'bg-blue-600' : 'bg-purple-600'}`} />
                              Added by {addedBy}
                            </span>
                          </td>

                          {/* 5. Quantity & Unit Daily Rent */}
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700">
                            <div className="font-semibold text-slate-800">{item.quantity} × {formatINR(item.daily_rent_price)}</div>
                            <div className="text-[10px] text-slate-400">20% daily rule</div>
                          </td>

                          {/* 6. Total Rent */}
                          <td className="py-3.5 px-4 text-right font-mono text-xs font-bold text-slate-900">
                            <div className="text-sm font-bold text-slate-900">{formatINR(item.line_total)}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {duration} days total
                            </div>
                          </td>

                          {/* 7. Action Button */}
                          {canEdit && (
                            <td className="py-3.5 px-3 text-center">
                              <button
                                onClick={() => handleDeleteItem(item.id, item.item_code)}
                                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove prop & return to stock"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Summary Footer Row */}
                {items.length > 0 && (
                  <tfoot className="bg-slate-50/90 border-t border-slate-200 text-xs font-semibold text-slate-700">
                    <tr>
                      <td colSpan={4} className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">
                            Total Props Scanned: <span className="font-mono text-amber-800">{items.length} units</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-normal">
                            {totalPhysicalQuantity} physical units across {new Set(items.map((i) => i.prop_title)).size} catalog SKUs
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                        <div>Daily: <strong className="text-slate-900 font-bold">{formatINR(totalDailyRentSum)}</strong>/day</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-900">
                        <div className="text-sm font-extrabold text-slate-900">{formatINR(order.total_rent_amount || 0)}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{duration} Days Rental</div>
                      </td>
                      {canEdit && <td></td>}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* =================================================================
            3. BOTTOM SECTION: Financial Breakdown & Payment Controls (FULL WIDTH - 100%)
            ================================================================= */}
        <div className="w-full space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <span>Financial Breakdown &amp; Payment Settlement</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive rental valuation, advance collection ledger, and gate pass dispatch authorization.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Rental Period:</span>
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                {duration} Days Active
              </span>
            </div>
          </div>

          {/* Expansive 3-Card Structured Horizontal Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {/* -------------------------------------------------------------
                Card A (Cost Tally)
                ------------------------------------------------------------- */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Cost &amp; Tax Valuation</h3>
                      <p className="text-[11px] text-slate-500">Live tally for {duration} shoot days</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-mono">
                    {items.length} Props
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal Replacement Value</span>
                    <span className="font-mono text-slate-700 font-medium">
                      {formatINR(order.total_replacement_val || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-700 font-medium">
                    <span>Base Rental Amount ({duration} Days)</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatINR(order.total_rent_amount || 0)}
                    </span>
                  </div>

                  {/* Dynamic Handling & Transit Crew Wages Line Item */}
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <HardHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-bold text-slate-900">Handling &amp; Transit Crew Wages</span>
                      </div>
                      <span className="font-mono font-bold text-amber-900 text-xs">
                        +{formatINR(crewType === 'in_house' ? (order.total_labor_charges ?? (workerCount * dailyWageRate * duration)) : 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>
                        {crewType === 'in_house'
                          ? `${workerCount} Workers × ₹${dailyWageRate.toLocaleString('en-IN')}/day × ${duration} Days`
                          : 'Client Sourced Crew (₹0 - Labor handled by Client)'}
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditingLaborInline(!editingLaborInline)}
                          className="text-amber-800 hover:text-amber-950 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{editingLaborInline ? 'Close' : 'Adjust Wage'}</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Labor Billing Calibration Controls */}
                    {editingLaborInline && canEdit && (
                      <div className="pt-2 mt-1 border-t border-amber-200/60 space-y-2 animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                              Crew Sourcing
                            </label>
                            <select
                              value={crewType}
                              onChange={(e) =>
                                handleLaborBillingUpdate(e.target.value as any, workerCount, dailyWageRate)
                              }
                              className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                            >
                              <option value="in_house">In-House Crew</option>
                              <option value="client_sourced">Client Sourced</option>
                            </select>
                          </div>

                          {crewType === 'in_house' ? (
                            <div>
                              <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                                Workers Count
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={workerCount}
                                onChange={(e) =>
                                  handleLaborBillingUpdate(crewType, Math.max(1, Number(e.target.value)), dailyWageRate)
                                }
                                className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 flex items-center">
                              No labor fee billed
                            </div>
                          )}
                        </div>

                        {crewType === 'in_house' && (
                          <div>
                            <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                              Daily Wage Rate per Worker (₹)
                            </label>
                            <input
                              type="number"
                              step={100}
                              min={500}
                              value={dailyWageRate}
                              onChange={(e) =>
                                handleLaborBillingUpdate(crewType, workerCount, Math.max(0, Number(e.target.value)))
                              }
                              className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1">
                      Security Deposit (30% Refundable)
                      <span title="Refundable upon safe return of props" className="inline-flex cursor-help">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </span>
                    <span className="font-mono text-slate-700 font-medium">
                      {formatINR(order.security_deposit || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>GST Tax (18% - 9% CGST + 9% SGST)</span>
                    <span className="font-mono text-slate-700 font-medium">
                      {formatINR(order.tax_amount || 0)}
                    </span>
                  </div>
                </div>

              </div>

              <div className="pt-3.5 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Subtotal Valuation</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono">
                  {formatINR(order.final_payable || 0)}
                </span>
              </div>
            </div>

            {/* -------------------------------------------------------------
                Card B (Advance Payment Controls)
                ------------------------------------------------------------- */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Advance Payment Controls</h3>
                      <p className="text-[11px] text-slate-500">Front counter deposit collection</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                    {savingAdvance ? 'Syncing...' : 'Live Synced'}
                  </span>
                </div>

                {/* Apple-style Segmented Toggle: Advance Paid vs No Advance */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Payment Terms</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleAdvanceChange(false, 0, paymentMode)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        !advancePaid
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      No Advance (Pay on Return)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdvanceChange(true, advanceAmount || Math.round((order.final_payable || 0) * 0.3), paymentMode)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        advancePaid
                          ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Advance Paid
                    </button>
                  </div>
                </div>

                {/* Amount & Mode Inputs if Advance Paid */}
                {advancePaid && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Advance Amount Received (₹)
                      </label>
                      <input
                        type="number"
                        value={advanceAmount}
                        onChange={(e) => handleAdvanceChange(true, Number(e.target.value), paymentMode)}
                        placeholder="e.g. 50000"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={paymentMode}
                        onChange={(e) => handleAdvanceChange(true, advanceAmount, e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 shadow-2xs"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI (Google Pay / PhonePe)</option>
                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                        <option value="Credit Card">Corporate Credit Card</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Advance Deducted:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {advancePaid ? `-${formatINR(advanceAmount)}` : '₹0'}
                </span>
              </div>
            </div>

            {/* -------------------------------------------------------------
                Card C (Grand Total & Actions)
                ------------------------------------------------------------- */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Total Valuation &amp; Dispatch</h3>
                      <p className="text-[11px] text-slate-500">Net order settlement</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isDispatched
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {isDispatched ? 'Dispatched' : 'Ready'}
                  </span>
                </div>

                {/* Big Grand Total Figures */}
                <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                      Total Order Valuation
                    </span>
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {formatINR(order.final_payable || 0)}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-black text-amber-800">
                        Balance Due on Return
                      </span>
                      <div className="text-[10px] text-slate-400">Payable upon physical return</div>
                    </div>
                    <span className="text-2xl font-black text-amber-700 font-mono tracking-tight">
                      {formatINR(balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {isOrderClosed ? (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-2.5 shadow-md">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <Lock className="w-4 h-4" />
                      <span>Order Completed &amp; Locked</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      This order has completed physical warehouse return verification and is permanently locked in the historical archive. Modifying items or re-dispatching is strictly prohibited.
                    </p>
                    <div className="pt-2 flex items-center gap-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setInvoiceModalMode('invoice');
                          setTaxInvoiceModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Tax Invoice</span>
                      </button>
                      <button
                        onClick={() => {
                          setInvoiceModalMode('quotation');
                          setTaxInvoiceModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Quotation</span>
                      </button>
                      <Link
                        href="/admin/orders/pipeline"
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 flex items-center justify-center"
                        title="View in Pipeline"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : !isDispatched ? (
                  <>
                    <button
                      onClick={() => {
                        if (!rbacClearance.canDispatch) {
                          alert('Access Restricted: Your assigned Dynamics 365 Security Role does not have "Dispatch & Print Pass" clearance.');
                          return;
                        }
                        setDispatchModalOpen(true);
                      }}
                      disabled={items.length === 0 || !rbacClearance.canDispatch}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all ${
                        !rbacClearance.canDispatch
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer disabled:opacity-40'
                      }`}
                      title={!rbacClearance.canDispatch ? 'Restricted by Dynamics 365 RBAC (Requires Dispatch clearance)' : undefined}
                    >
                      <Truck className="w-4 h-4 stroke-[2.5]" />
                      <span>{!rbacClearance.canDispatch ? 'Dispatch Restricted (Requires RBAC Clearance)' : 'Confirm & Dispatch Lorry to Pipeline'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setInvoiceModalMode('quotation');
                          setTaxInvoiceModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors border border-amber-200 cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        Print Quotation
                      </button>

                      <button
                        onClick={() => {
                          setInvoiceModalMode('invoice');
                          setTaxInvoiceModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                        Tax Invoice
                      </button>
                    </div>

                    <button
                      onClick={handleSaveQuotation}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors border border-slate-200 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Save Draft Quotation in System
                    </button>
                  </>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>DISPATCHED TO RENTAL PIPELINE</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      All props marked &apos;On Rent&apos;. Lorry: <strong className="text-slate-900">{order.vehicle_number}</strong> • Gate Pass: <strong className="text-amber-800">{order.gate_pass_number}</strong>.
                    </p>
                    <Link
                      href="/admin/orders/pipeline"
                      className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline font-bold"
                    >
                      View in Rental Pipeline &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================
          FINAL DISPATCH VERIFICATION MODAL
          ================================================================= */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-900 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-amber-600" /> Step 4: Dispatch Pipeline Transition
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Final Dispatch &amp; Field Crew Allocation
                </h3>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-5 text-xs">
              {/* Transport Vehicle & Driver Details */}
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-600" /> Logistics Vehicle &amp; Driver Gate Pass
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Transport Vehicle Number <span className="text-amber-700">* (Mandatory for Gate Pass)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transportVehicleNumber}
                    onChange={(e) => setTransportVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. TS 09 EA 4521"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-mono text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Driver Name
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Mohan Babu"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Driver Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={driverMobile}
                      onChange={(e) => setDriverMobile(e.target.value)}
                      placeholder="+91 94400 55667"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* =======================================================
                  DEDICATED SECTION: Prop Handling & Transportation Crew
                  ======================================================= */}
              <div className="p-4 rounded-xl bg-white border-2 border-amber-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-sm">
                      <HardHat className="w-4 h-4 text-amber-600" />
                      <span>Prop Handling &amp; Transportation Crew (Field Workers)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Allocate on-site labor for packing, lorry loading, and set handling.
                    </p>
                  </div>

                  {/* Sourcing Toggle: Option A (In-House) vs Option B (Client Sourced) */}
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCrewType('in_house');
                        handleLaborBillingUpdate('in_house', selectedWorkerIds.length || 2, dailyWageRate);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        crewType === 'in_house'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      In-House Field Crew
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCrewType('client_sourced');
                        handleLaborBillingUpdate('client_sourced', 0, dailyWageRate);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        crewType === 'client_sourced'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Client Sourced Crew
                    </button>
                  </div>
                </div>

                {/* Option A Flow: In-House Workers */}
                {crewType === 'in_house' ? (
                  <div className="space-y-3.5 animate-in fade-in duration-150">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-800">
                        Select In-House Staff ({selectedWorkerIds.length} Selected)
                      </label>
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Orders sync to /field/my-tasks
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                      {availableWorkers.map((worker) => {
                        const isSelected = selectedWorkerIds.includes(worker.id);
                        return (
                          <div
                            key={worker.id}
                            onClick={() => {
                              const updatedIds = isSelected
                                ? selectedWorkerIds.filter((id) => id !== worker.id)
                                : [...selectedWorkerIds, worker.id];
                              setSelectedWorkerIds(updatedIds);
                              setWorkerCount(updatedIds.length);
                              handleLaborBillingUpdate('in_house', updatedIds.length, dailyWageRate);
                            }}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-50/90 border-amber-400 shadow-2xs'
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300 relative">
                                <Image
                                  src={worker.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                  alt={worker.full_name}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <strong className="text-xs font-bold text-slate-900 truncate block">
                                  {worker.full_name}
                                </strong>
                                <span className="text-[10px] text-slate-500 font-mono block truncate">
                                  {worker.badge_number} • {worker.phone}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-amber-600 border-amber-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Wage Rate & Billing Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Daily Wage Rate per Worker (₹)
                        </label>
                        <input
                          type="number"
                          step={100}
                          value={dailyWageRate}
                          onChange={(e) => {
                            const newRate = Math.max(0, Number(e.target.value));
                            setDailyWageRate(newRate);
                            handleLaborBillingUpdate('in_house', selectedWorkerIds.length, newRate);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                        />
                      </div>

                      <div className="flex flex-col justify-end text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">
                          Handling &amp; Transit Labor Cost
                        </span>
                        <span className="text-base font-extrabold text-amber-900 font-mono">
                          +{formatINR(selectedWorkerIds.length * dailyWageRate * duration)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({selectedWorkerIds.length} Workers × ₹{dailyWageRate} × {duration} Days)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Option B Flow: Client / Production Sourced Crew */
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block">
                          Production House Handlers (Gate Pass Manifest)
                        </label>
                        <span className="text-[11px] text-slate-500">
                          Recorded for set entry security, gate pass badges, and physical liability disclaimer.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setClientCrewList([
                            ...clientCrewList,
                            {
                              id: `cc-${Date.now()}`,
                              name: '',
                              phone: '',
                              govt_id_or_notes: '',
                            },
                          ])
                        }
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {clientCrewList.map((crewMember, idx) => (
                        <div
                          key={crewMember.id}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 items-center"
                        >
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              required
                              placeholder="Full Name (e.g. Ramesh)"
                              value={crewMember.name}
                              onChange={(e) => {
                                const updated = [...clientCrewList];
                                updated[idx].name = e.target.value;
                                setClientCrewList(updated);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="sm:col-span-4">
                            <input
                              type="tel"
                              required
                              placeholder="Contact Mobile (+91)"
                              value={crewMember.phone}
                              onChange={(e) => {
                                const updated = [...clientCrewList];
                                updated[idx].phone = e.target.value;
                                setClientCrewList(updated);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="Govt ID / Role"
                              value={crewMember.govt_id_or_notes || ''}
                              onChange={(e) => {
                                const updated = [...clientCrewList];
                                updated[idx].govt_id_or_notes = e.target.value;
                                setClientCrewList(updated);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="sm:col-span-1 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (clientCrewList.length <= 1) return;
                                setClientCrewList(clientCrewList.filter((_, i) => i !== idx));
                              }}
                              disabled={clientCrewList.length <= 1}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30 cursor-pointer"
                              title="Remove crew member"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                      <span>Labor fee billed to client:</span>
                      <strong className="font-mono text-emerald-700 font-bold">₹0 (Production Sourced Crew)</strong>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security / Transport Notes
                </label>
                <textarea
                  rows={2}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="e.g. Fragile glass cameras on top rack. Deliver directly to RFC floor 7 bay."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 resize-none shadow-2xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <div className="font-bold text-amber-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Automated Pipeline Triggers:
                </div>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                  <li>Changes status to <strong className="text-slate-900">DISPATCHED_RENTAL_PIPELINE</strong></li>
                  <li>Moves order to the <strong className="text-slate-900">Rental Pipeline</strong> tab</li>
                  <li>Sets {items.length} props in <strong className="text-slate-900">prop_serialized_items</strong> to &apos;On Rent&apos;</li>
                  <li>
                    {crewType === 'in_house'
                      ? `Assigns ${selectedWorkerIds.length} field workers into order_field_crew with active mobile task queue`
                      : 'Records client handlers JSONB metadata on gate pass with liability disclaimer'}
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatching}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                >
                  <Truck className="w-4 h-4 stroke-[2.5]" />
                  {dispatching ? 'Dispatching...' : 'Confirm Lorry & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAX INVOICE & QUOTATION MODAL */}
      {taxInvoiceModalOpen && order && (
        <InvoiceModal
          order={order as any}
          items={items.map((i) => ({
            id: i.id,
            order_id: i.order_id,
            prop_id: i.prop_id || '',
            prop_item_id: i.prop_serialized_item_id,
            item_serial: i.item_code,
            prop_title: i.prop_title,
            prop_category: i.prop_category,
            replacement_value: i.replacement_value,
            daily_rental_rate: i.daily_rent_price,
            rental_days: duration,
            floor: 1,
            rack: i.warehouse_location,
            status: 'picked',
            created_at: i.scanned_at,
          }))}
          initialMode={invoiceModalMode}
          onClose={() => setTaxInvoiceModalOpen(false)}
        />
      )}

      {/* 2-STEP ORDER DELETION DIALOG */}
      <DeleteOrderConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        order={order}
        currentUser={user}
        userRole={role}
        onOrderDeleted={() => {
          router.push('/admin/orders/walk-in');
        }}
      />
    </div>
  );
}

