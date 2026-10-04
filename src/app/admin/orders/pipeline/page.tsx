'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Film,
  Users,
  Truck,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Radio,
  ArrowRight,
  Search,
  RefreshCw,
  Plus,
  MapPin,
  RotateCcw,
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Trash2,
  DollarSign,
  Receipt,
  Layers,
  HardHat,
  Phone,
  Building,
  Check,
  CreditCard,
  Printer,
  Sparkles,
  Minus,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ordersService } from '@/lib/services/orders';
import { crewHubService } from '@/lib/services/crewHub';
import { isOrderLocked } from '@/lib/services/orderStateMachine';
import { WalkInOrder, WalkInOrderItem, FinalInvoiceRecord, OrderLifecycleStatus } from '@/types/orders';
import { formatINR } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { DeleteOrderConfirmDialog } from '@/components/orders/DeleteOrderConfirmDialog';
import { DeliveryChallanModal } from '@/components/orders/DeliveryChallanModal';
import { ReturnVerificationModal } from '@/components/orders/ReturnVerificationModal';
import { RecordAdvanceModal } from '@/components/orders/RecordAdvanceModal';
import { TaxInvoiceView } from '@/components/documents/TaxInvoiceView';

type PipelineFilterStage = 'all' | 'dispatched' | 'on_site' | 'return_initiated' | 'verified_closed' | 'picking';

export default function RentalPipelinePage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const isSuperAdmin = role === 'super_admin' || role === 'admin';

  const [orders, setOrders] = useState<WalkInOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<PipelineFilterStage>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, WalkInOrderItem[]>>({});
  const [loadingItemsFor, setLoadingItemsFor] = useState<string | null>(null);
  const [updatingDaysFor, setUpdatingDaysFor] = useState<string | null>(null);

  // Modals state
  const [orderToDelete, setOrderToDelete] = useState<WalkInOrder | null>(null);
  const [challanModalOrder, setChallanModalOrder] = useState<WalkInOrder | null>(null);
  const [challanModalItems, setChallanModalItems] = useState<WalkInOrderItem[]>([]);
  const [returnModalOrder, setReturnModalOrder] = useState<WalkInOrder | null>(null);
  const [returnModalItems, setReturnModalItems] = useState<WalkInOrderItem[]>([]);
  const [advanceModalOrder, setAdvanceModalOrder] = useState<WalkInOrder | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<FinalInvoiceRecord | null>(null);

  // Load orders
  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersService.getOrders();
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('ashwa_walkin_picking_stream');
      bc.onmessage = (event) => {
        if (event.data?.type === 'ORDER_DELETED' && event.data.orderId) {
          setOrders((prev) => prev.filter((o) => o.id !== event.data.orderId));
        } else if (event.data?.type === 'ORDER_CLOSED' && event.data.orderId) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === event.data.orderId
                ? {
                    ...o,
                    status: 'CLOSED',
                    lifecycle_status: 'Verified_Closed',
                    is_archived_or_closed: true,
                    is_locked: true,
                    closed_at: new Date().toISOString(),
                  }
                : o
            )
          );
        }
        loadOrders();
      };
      return () => {
        bc.close();
      };
    }
  }, []);

  // Fetch items when expanding a row or opening modals
  const fetchItemsForOrder = async (orderId: string): Promise<WalkInOrderItem[]> => {
    if (orderItemsMap[orderId]) return orderItemsMap[orderId];
    setLoadingItemsFor(orderId);
    try {
      const items = await ordersService.getOrderItems(orderId);
      setOrderItemsMap((prev) => ({ ...prev, [orderId]: items }));
      return items;
    } catch (err) {
      console.error('Failed to load items for order:', orderId, err);
      return [];
    } finally {
      setLoadingItemsFor(null);
    }
  };

  const handleToggleExpand = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      await fetchItemsForOrder(orderId);
    }
  };

  // Helper: map order to strict 4-step pipeline status
  const getLifecycleStage = (o: WalkInOrder): OrderLifecycleStatus => {
    if (isOrderLocked(o) || o.is_archived_or_closed || o.status === 'CLOSED' || (o.status || '').toLowerCase() === 'closed') {
      return 'Verified_Closed';
    }
    if (o.lifecycle_status) return o.lifecycle_status;
    const st = (o.status || '').toLowerCase();
    if (st === 'returned') return 'Verified_Closed';
    if (o.return_status_crew === 'Initiated') return 'Return_Initiated';
    if (st === 'dispatched' || st === 'dispatched_rental_pipeline') return 'On_Site_Active';
    if (st === 'confirmed' || st === 'quotation_review' || st === 'picked_verified') return 'Dispatched';
    return 'Quotation';
  };

  // Inline shooting days adjustment (+/-)
  const handleUpdateShootDays = async (orderId: string, currentDays: number, delta: number) => {
    const newDays = Math.max(1, currentDays + delta);
    if (newDays === currentDays) return;

    setUpdatingDaysFor(orderId);
    try {
      await ordersService.updateActualShootDays(orderId, newDays);
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const oldDays = o.actual_shoot_days || o.rental_days || 3;
          const baseDaily = (o.total_rent_amount || 0) / (oldDays || 1);
          const newRent = Math.round(baseDaily * newDays);
          const laborCharges = o.total_labor_charges || 0;
          const tax = Math.round((newRent + laborCharges) * 0.18);
          const finalPayable = newRent + laborCharges + tax;
          return {
            ...o,
            actual_shoot_days: newDays,
            rental_days: newDays,
            total_rent_amount: newRent,
            final_payable: finalPayable,
          };
        })
      );
    } catch (err) {
      console.error('Failed to update shoot days:', err);
      alert('Error updating shooting days.');
    } finally {
      setUpdatingDaysFor(null);
    }
  };

  // Direct shoot days input
  const handleDirectShootDaysChange = async (orderId: string, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) return;
    setUpdatingDaysFor(orderId);
    try {
      await ordersService.updateActualShootDays(orderId, num);
      await loadOrders();
    } catch (err) {
      console.error('Failed to update days:', err);
    } finally {
      setUpdatingDaysFor(null);
    }
  };

  // Trigger Delivery Challan Modal
  const handleOpenChallanModal = async (order: WalkInOrder) => {
    const items = await fetchItemsForOrder(order.id);
    setChallanModalOrder(order);
    setChallanModalItems(items);
  };

  // Trigger Return Verification Modal
  const handleOpenReturnModal = async (order: WalkInOrder) => {
    const items = await fetchItemsForOrder(order.id);
    setReturnModalOrder(order);
    setReturnModalItems(items);
  };

  // Trigger Final Invoice Generation or View
  const handleOpenInvoice = async (order: WalkInOrder) => {
    try {
      let inv = await ordersService.getFinalInvoiceByOrderId(order.id);
      if (!inv) {
        inv = await ordersService.generateFinalInvoice(order.id);
      }
      setActiveInvoice(inv);
    } catch (err) {
      console.error('Failed to get or generate invoice:', err);
      alert('Could not generate final invoice.');
    }
  };

  // Overdue calculation
  const getDueStatus = (order: WalkInOrder) => {
    if (!order.rental_end_date) return { isOverdue: false, text: `${order.actual_shoot_days || order.rental_days || 3} Days`, days: 0 };
    const end = new Date(order.rental_end_date);
    const today = new Date();
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        isOverdue: true,
        text: `Overdue by ${Math.abs(diffDays)}d`,
        days: diffDays,
        dueText: `Return due ${order.rental_end_date}`,
      };
    } else if (diffDays === 0) {
      return {
        isOverdue: false,
        text: 'Due Today',
        days: 0,
        dueText: `Due today (${order.rental_end_date})`,
        isDueToday: true,
      };
    } else {
      return {
        isOverdue: false,
        text: `${diffDays}d left`,
        days: diffDays,
        dueText: `Due on ${order.rental_end_date}`,
      };
    }
  };

  // Stage filters & partitions
  const stageCounts = useMemo(() => {
    const counts = {
      all: 0, // Total Active Pipeline Orders
      dispatched: 0,
      on_site: 0,
      return_initiated: 0,
      verified_closed: 0, // Total Completed & Locked Archived Orders
      picking: 0,
    };
    orders.forEach((o) => {
      const isClosed = isOrderLocked(o) || o.is_archived_or_closed || o.status === 'CLOSED' || (o.status || '').toLowerCase() === 'returned';
      if (isClosed) {
        counts.verified_closed++;
      } else {
        counts.all++;
        const stage = getLifecycleStage(o);
        if (stage === 'Dispatched') counts.dispatched++;
        else if (stage === 'On_Site_Active') counts.on_site++;
        else if (stage === 'Return_Initiated') counts.return_initiated++;
        else counts.picking++;
      }
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      const isClosed = isOrderLocked(o) || o.is_archived_or_closed || o.status === 'CLOSED' || (o.status || '').toLowerCase() === 'returned';
      const stage = getLifecycleStage(o);

      if (activeStage === 'verified_closed') {
        if (!isClosed) return false;
      } else {
        // Active pipeline views strictly filter out closed/archived orders
        if (isClosed) return false;

        if (activeStage === 'dispatched' && stage !== 'Dispatched') return false;
        if (activeStage === 'on_site' && stage !== 'On_Site_Active') return false;
        if (activeStage === 'return_initiated' && stage !== 'Return_Initiated') return false;
        if (activeStage === 'picking' && stage !== 'Quotation') return false;
      }

      if (!q) return true;
      const orderNum = (o.order_number || '').toLowerCase();
      const client = (o.client_name || '').toLowerCase();
      const movie = (o.movie_project_name || o.production_name || '').toLowerCase();
      const loc = (o.shoot_location || '').toLowerCase();
      const vehicle = (o.vehicle_number || o.vehicle_no || '').toLowerCase();
      const driver = (o.driver_name || '').toLowerCase();

      return (
        orderNum.includes(q) ||
        client.includes(q) ||
        movie.includes(q) ||
        loc.includes(q) ||
        vehicle.includes(q) ||
        driver.includes(q)
      );
    });
  }, [orders, activeStage, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
              Full-Screen Data Timeline
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Active Pipeline: <strong className="text-slate-900">{stageCounts.all}</strong> • Archived: <strong className="text-purple-700">{stageCounts.verified_closed}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight font-sans">
            Rental Operations Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full horizontal data row timeline: Dispatched ➔ On-Site Active ➔ Return Initiated ➔ Verified &amp; Closed.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadOrders}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-sky-500 text-slate-600 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          <Link
            href="/admin/orders/in-person/create"
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md shadow-slate-950/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>New Walk-in Order</span>
          </Link>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Dispatched / Transit</span>
            <Truck className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-950 font-mono">{stageCounts.dispatched}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Staged for gate dispatch</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>On-Site Active Shoots</span>
            <Film className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-950 font-mono">{stageCounts.on_site}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Props actively filming on set</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Return Initiated</span>
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-950 font-mono">{stageCounts.return_initiated}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting floor inspection sign-off</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Completed &amp; Locked</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-950 font-mono">{stageCounts.verified_closed}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Strictly closed &amp; restocked</p>
        </div>
      </div>

      {/* Stage Tabs & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveStage('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeStage === 'all'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Active Pipeline</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeStage === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {stageCounts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveStage('dispatched')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeStage === 'dispatched'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>1. Dispatched</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeStage === 'dispatched' ? 'bg-sky-700 text-sky-100' : 'bg-sky-50 text-sky-700'
            }`}>
              {stageCounts.dispatched}
            </span>
          </button>

          <button
            onClick={() => setActiveStage('on_site')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeStage === 'on_site'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>2. On-Site Active</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeStage === 'on_site' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {stageCounts.on_site}
            </span>
          </button>

          <button
            onClick={() => setActiveStage('return_initiated')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeStage === 'return_initiated'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>3. Return Initiated</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeStage === 'return_initiated' ? 'bg-amber-700 text-amber-100' : 'bg-amber-50 text-amber-700'
            }`}>
              {stageCounts.return_initiated}
            </span>
          </button>

          <button
            onClick={() => setActiveStage('verified_closed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeStage === 'verified_closed'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Completed &amp; Locked (Archive)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeStage === 'verified_closed' ? 'bg-purple-700 text-purple-100' : 'bg-purple-50 text-purple-700'
            }`}>
              {stageCounts.verified_closed}
            </span>
          </button>

          <button
            onClick={() => setActiveStage('picking')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeStage === 'picking'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <span>In Picking</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              activeStage === 'picking' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {stageCounts.picking}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movie, client, vehicle, driver..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          FULL-SCREEN HORIZONTAL DENSE DATA ROW TIMELINE (PRIMARY ENTERPRISE LAYOUT)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Orders in this View</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}". Clear your search to see all.`
                : 'All orders in this stage have completed or no orders exist.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {/* Header Row */}
            <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              <div className="col-span-3">Order &amp; Movie Project</div>
              <div className="col-span-2">Fleet &amp; Sourced Crew</div>
              <div className="col-span-2 text-center">Shooting Days</div>
              <div className="col-span-2 text-right">Financials &amp; Advance</div>
              <div className="col-span-3 text-right">Pipeline Stage &amp; Actions</div>
            </div>

            {/* Order Rows */}
            {filteredOrders.map((order) => {
              const stage = getLifecycleStage(order);
              const due = getDueStatus(order);
              const isOverdue = (stage === 'On_Site_Active' || stage === 'Dispatched') && due.isOverdue;
              const isExpanded = expandedOrderId === order.id;
              const actualDays = order.actual_shoot_days || order.rental_days || 3;
              const totalRent = order.final_payable || order.total_rent_amount || 0;
              const advancePaid = order.advance_amount || 0;
              const balanceDue = Math.max(0, totalRent - advancePaid);
              const items = orderItemsMap[order.id] || [];

              return (
                <div
                  key={order.id}
                  className={`transition-colors duration-150 ${
                    isOverdue ? 'bg-rose-50/30' : isExpanded ? 'bg-slate-50/60' : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Main Horizontal Data Row */}
                  <div className="p-4 sm:px-5 sm:py-3.5 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
                    
                    {/* Col 1 (3 Cols): Order Identifier, Project Title, Client */}
                    <div className="col-span-12 lg:col-span-3 flex items-start gap-3">
                      <button
                        onClick={() => handleToggleExpand(order.id)}
                        className={`p-1.5 rounded-lg border border-slate-200 hover:border-slate-400 bg-white text-slate-600 transition-transform cursor-pointer mt-0.5 ${
                          isExpanded ? 'rotate-180 bg-slate-100 text-slate-900' : ''
                        }`}
                        title="Expand / Collapse Details Drawer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/orders/${order.id}/billing-cart`}
                            className="font-mono text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1"
                          >
                            <span>{order.order_number}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>

                          {stage === 'Verified_Closed' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                              <Lock className="w-2.5 h-2.5" />
                              LOCKED
                            </span>
                          )}

                          {isOverdue && (
                            <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-bold animate-pulse">
                              OVERDUE
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-slate-950 truncate mt-0.5" title={order.movie_project_name}>
                          {order.movie_project_name || 'Production Shoot'}
                        </h4>
                        <p className="text-xs text-slate-500 truncate" title={order.client_name}>
                          {order.client_name}
                        </p>
                      </div>
                    </div>

                    {/* Col 2 (2 Cols): Logistics: Vehicle & Crew */}
                    <div className="col-span-12 lg:col-span-2 space-y-1 text-xs">
                      {/* Vehicle & Driver */}
                      <div className="flex items-center gap-1.5 text-slate-800 font-mono text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="font-semibold">{order.vehicle_number || order.vehicle_no || 'TS 09 UA 8842'}</span>
                      </div>

                      {/* Driver */}
                      <div className="text-[11px] text-slate-500 truncate pl-5">
                        {order.driver_name || 'Mohan Babu'}
                      </div>

                      {/* Sourced Crew Badge */}
                      <div className="pt-0.5 pl-5">
                        {order.assigned_crew_type === 'client_sourced' || order.crew_type === 'client_sourced' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Users className="w-3 h-3 text-amber-600" />
                            Client Crew
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <HardHat className="w-3 h-3 text-emerald-600" />
                            In-House Crew
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Col 3 (2 Cols): Inline Dynamic Shooting Days Adjustment */}
                    <div className="col-span-12 lg:col-span-2 flex flex-col items-center justify-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 lg:hidden">
                        Shooting Days
                      </span>
                      <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                        <button
                          disabled={updatingDaysFor === order.id || actualDays <= 1 || stage === 'Verified_Closed' || isOrderLocked(order)}
                          onClick={() => handleUpdateShootDays(order.id, actualDays, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                          title={stage === 'Verified_Closed' || isOrderLocked(order) ? 'Order locked' : 'Decrease Shoot Days'}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="px-2 text-center">
                          <input
                            type="number"
                            min={1}
                            max={60}
                            disabled={stage === 'Verified_Closed' || isOrderLocked(order) || updatingDaysFor === order.id}
                            value={actualDays}
                            onChange={(e) => handleDirectShootDaysChange(order.id, e.target.value)}
                            className="w-10 text-center font-mono font-bold text-xs text-slate-900 bg-transparent focus:outline-none disabled:opacity-50"
                          />
                          <span className="block text-[9px] font-semibold text-slate-400 -mt-1">
                            DAYS
                          </span>
                        </div>

                        <button
                          disabled={updatingDaysFor === order.id || stage === 'Verified_Closed' || isOrderLocked(order)}
                          onClick={() => handleUpdateShootDays(order.id, actualDays, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                          title={stage === 'Verified_Closed' || isOrderLocked(order) ? 'Order locked' : 'Increase Shoot Days'}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {updatingDaysFor === order.id ? (
                        <span className="text-[10px] text-sky-600 flex items-center gap-1 mt-1 font-mono">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Recalculating...
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {due.text}
                        </span>
                      )}
                    </div>

                    {/* Col 4 (2 Cols): Financials & Inline Record Advance Button */}
                    <div className="col-span-12 lg:col-span-2 flex flex-col items-end text-xs">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[10px] uppercase font-semibold text-slate-400">Total:</span>
                        <span className="font-mono font-bold text-slate-950 text-sm">
                          {formatINR(totalRent)}
                        </span>
                      </div>

                      {/* Advance Paid & Record Button */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-mono font-semibold">
                          Adv: {formatINR(advancePaid)}
                        </span>
                        
                        {stage !== 'Verified_Closed' && !isOrderLocked(order) && (
                          <button
                            onClick={() => setAdvanceModalOrder(order)}
                            className="text-[10px] font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-0.5 cursor-pointer"
                            title="Record token or advance payment"
                          >
                            <CreditCard className="w-2.5 h-2.5 text-sky-600" />
                            + Adv
                          </button>
                        )}
                      </div>

                      {/* Balance Due */}
                      <div className="text-[11px] font-mono mt-0.5">
                        <span className="text-slate-400 text-[10px]">Due: </span>
                        <span className={balanceDue > 0 ? 'font-bold text-rose-600' : 'text-slate-600 font-medium'}>
                          {formatINR(balanceDue)}
                        </span>
                      </div>
                    </div>

                    {/* Col 5 (3 Cols): Pipeline Status & Action Buttons */}
                    <div className="col-span-12 lg:col-span-3 flex flex-col items-end gap-2">
                      {/* Micro Stepper Pipeline Progress */}
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        <span className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                          stage === 'Dispatched'
                            ? 'bg-sky-500 text-white shadow-xs'
                            : stage === 'On_Site_Active' || stage === 'Return_Initiated' || stage === 'Verified_Closed'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          Dispatched
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                        <span className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                          stage === 'On_Site_Active'
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : stage === 'Return_Initiated' || stage === 'Verified_Closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          On-Site
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                        <span className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                          stage === 'Return_Initiated'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : stage === 'Verified_Closed'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          Return
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                        <span className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                          stage === 'Verified_Closed'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          Closed
                        </span>
                      </div>

                      {stage === 'Verified_Closed' && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                          <Lock className="w-3 h-3 text-purple-600" />
                          <span>Order Completed &amp; Locked</span>
                        </div>
                      )}

                      {/* Action Trigger Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Challan Gate Pass Button */}
                        <button
                          onClick={() => handleOpenChallanModal(order)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="View / Print Official Delivery Challan Gate Pass"
                        >
                          <Printer className="w-3 h-3 text-slate-600" />
                          <span>Challan</span>
                        </button>

                        {/* Return Sign-Off Modal */}
                        {stage !== 'Verified_Closed' ? (
                          <button
                            onClick={() => handleOpenReturnModal(order)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            title="2-Step Return Verification (Field Crew Check & Floor Sales Sign-off)"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Verify Return</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenInvoice(order)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            title="View / Print Official Final Tax Invoice"
                          >
                            <Receipt className="w-3 h-3 text-amber-300" />
                            <span>Final Invoice</span>
                          </button>
                        )}

                        {/* Super Admin Pipeline Deletion Override */}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors shadow-2xs cursor-pointer"
                            title="Super Admin Override: Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* =================================================================
                      EXPANDABLE DRAWER ACCORDION (FULL MANIFEST & LOGISTICS VIEW)
                      ================================================================= */}
                  {isExpanded && (
                    <div className="px-5 py-5 bg-slate-50 border-t border-slate-200 text-xs space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                      
                      {/* Drawer Top Grid: Logistics & Sourced Crew Roster */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Box 1: Fleet & Logistics */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                          <h5 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                            <Truck className="w-3.5 h-3.5 text-sky-600" />
                            Lorry &amp; Transport Logistics
                          </h5>
                          <div className="space-y-1 text-slate-600">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Vehicle No:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {order.vehicle_number || order.vehicle_no || 'TS 09 UA 8842'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Driver Contact:</span>
                              <span className="text-slate-800 font-medium">
                                {order.driver_name || 'Mohan Babu'} ({order.driver_phone || '+91 94400 55667'})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Shoot Location:</span>
                              <span className="text-slate-800 truncate max-w-[160px]">
                                {order.shoot_location || 'Soundstage Hyderabad'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Box 2: Field Labor & Sourced Crew */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                              <HardHat className="w-3.5 h-3.5 text-amber-600" />
                              Handling &amp; Packing Crew
                            </h5>
                            <Link
                              href="/admin/crew/labor-sheet"
                              className="text-[10px] text-sky-700 hover:underline font-semibold"
                            >
                              Labor Sheet ➔
                            </Link>
                          </div>

                          <div className="space-y-1 text-slate-600">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Sourcing Model:</span>
                              <span className="font-semibold text-slate-900">
                                {order.assigned_crew_type === 'client_sourced' || order.crew_type === 'client_sourced'
                                  ? 'Client Production Crew'
                                  : 'Our In-House Crew'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Labor Charges:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {formatINR(order.total_labor_charges || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Wage Rate:</span>
                              <span className="font-mono text-slate-800">
                                ₹{order.daily_wage_rate || 750}/day • {actualDays} Days
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Box 3: Live Billing & Financial Ledger */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                          <h5 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            Live Financial Ledger
                          </h5>
                          <div className="space-y-1 text-slate-600">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Base Rentals ({actualDays}d):</span>
                              <span className="font-mono text-slate-800">{formatINR(order.total_rent_amount || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Handling Labor:</span>
                              <span className="font-mono text-slate-800">{formatINR(order.total_labor_charges || 0)}</span>
                            </div>
                            {order.damage_deduction_amount ? (
                              <div className="flex justify-between text-rose-600">
                                <span>Damage Penalty:</span>
                                <span className="font-mono font-bold">+{formatINR(order.damage_deduction_amount)}</span>
                              </div>
                            ) : null}
                            <div className="flex justify-between border-t border-slate-100 pt-1 font-semibold text-slate-900">
                              <span>Gross Total (w/ GST):</span>
                              <span className="font-mono">{formatINR(totalRent)}</span>
                            </div>
                            <div className="flex justify-between text-emerald-700 font-semibold">
                              <span>Less: Advance Paid:</span>
                              <span className="font-mono">-{formatINR(advancePaid)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-950">
                              <span>Net Balance Due:</span>
                              <span className="font-mono text-rose-600">{formatINR(balanceDue)}</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Dispatched Prop Manifest Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-[11px]">
                            <Layers className="w-3.5 h-3.5 text-sky-600" />
                            Dispatched Prop Manifest ({items.length} Items)
                          </h5>
                          <span className="text-[11px] text-slate-500">
                            Total Prop Valuation: <strong className="font-mono text-slate-900">{formatINR(order.total_replacement_val || 0)}</strong>
                          </span>
                        </div>

                        {loadingItemsFor === order.id ? (
                          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                            <span>Loading prop manifest...</span>
                          </div>
                        ) : items.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                            No props loaded or manifest is empty.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                <tr>
                                  <th className="p-2.5 w-12 text-center">Thumb</th>
                                  <th className="p-2.5">Prop Title &amp; Barcode</th>
                                  <th className="p-2.5">Category</th>
                                  <th className="p-2.5">Bay Location</th>
                                  <th className="p-2.5 text-right">Daily Rent</th>
                                  <th className="p-2.5 text-right">Line Total ({actualDays}d)</th>
                                  <th className="p-2.5 text-right">Replacement Val</th>
                                  <th className="p-2.5 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {items.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-2.5 text-center">
                                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 relative overflow-hidden mx-auto">
                                        <Image
                                          src={item.image_url || 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=120'}
                                          alt={item.prop_title}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    </td>
                                    <td className="p-2.5">
                                      <p className="font-semibold text-slate-900">{item.prop_title}</p>
                                      <p className="font-mono text-[10px] text-slate-500">{item.item_code}</p>
                                    </td>
                                    <td className="p-2.5 text-slate-600">
                                      {item.prop_category || 'General Prop'}
                                    </td>
                                    <td className="p-2.5 font-mono text-[11px] text-slate-600">
                                      {item.warehouse_location || 'Bay A-01'}
                                    </td>
                                    <td className="p-2.5 text-right font-mono">
                                      ₹{item.daily_rent_price?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                                      ₹{(item.daily_rent_price * actualDays).toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2.5 text-right font-mono text-slate-500">
                                      ₹{item.replacement_value?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        stage === 'Verified_Closed'
                                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}>
                                        {stage === 'Verified_Closed' ? 'Restocked' : 'Dispatched'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Drawer Bottom Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <div className="text-[11px] text-slate-500">
                          Order created by <strong className="text-slate-800">{order.created_by || 'Staff'}</strong> on {new Date(order.created_at).toLocaleDateString('en-IN')}
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/orders/${order.id}/billing-cart`}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs hover:bg-slate-50 flex items-center gap-1"
                          >
                            <span>Open in Live Cart</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>

                          <button
                            onClick={() => handleOpenChallanModal(order)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3 text-amber-400" />
                            <span>Print Gate Pass</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALS INTEGRATION
          ========================================================================= */}

      {/* 1. Delivery Challan Gate Pass Modal */}
      {challanModalOrder && (
        <DeliveryChallanModal
          order={challanModalOrder}
          items={challanModalItems}
          onClose={() => setChallanModalOrder(null)}
          onConfirmDispatch={async (dispatchData) => {
            await ordersService.dispatchOrder(challanModalOrder.id, {
              vehicle_number: dispatchData.vehicle_number,
              driver_name: dispatchData.driver_name,
              driver_phone: dispatchData.driver_phone,
            });
            await loadOrders();
            setChallanModalOrder(null);
          }}
        />
      )}

      {/* 2. 2-Step Safe Return Verification & Lifecycle Termination Modal */}
      {returnModalOrder && (
        <ReturnVerificationModal
          order={returnModalOrder}
          items={returnModalItems}
          onClose={() => setReturnModalOrder(null)}
          onReturnCompleted={async () => {
            await loadOrders();
            setReturnModalOrder(null);
          }}
          onOpenInvoice={() => {
            const currentOrder = returnModalOrder;
            setReturnModalOrder(null);
            handleOpenInvoice(currentOrder);
          }}
        />
      )}

      {/* 3. Inline Record Advance Payment Modal */}
      {advanceModalOrder && (
        <RecordAdvanceModal
          order={advanceModalOrder}
          onClose={() => setAdvanceModalOrder(null)}
          onAdvanceRecorded={async () => {
            await loadOrders();
            setAdvanceModalOrder(null);
          }}
        />
      )}

      {/* 4. Enterprise Printable Tax Invoice View Modal */}
      {activeInvoice && (
        <TaxInvoiceView
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
        />
      )}

      {/* 5. Super Admin Delete Confirmation Modal */}
      <DeleteOrderConfirmDialog
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        order={orderToDelete}
        currentUser={user}
        userRole={role}
        onOrderDeleted={(deletedId) => {
          setOrders((prev) => prev.filter((o) => o.id !== deletedId));
          setOrderToDelete(null);
          router.refresh();
        }}
      />
    </div>
  );
}
