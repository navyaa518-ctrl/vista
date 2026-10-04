'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  MoreHorizontal,
  ShoppingCart,
  Coins,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Truck,
  CheckCircle2,
  Clock,
  Plus,
  Receipt,
  Layers,
  Sparkles,
  QrCode,
  ClipboardCheck,
  HardHat,
  Search,
  Filter,
  Check,
  X,
  Building2,
  Calendar,
  Eye,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { ordersService } from '@/lib/services/orders';
import { inventoryService } from '@/lib/services/inventory';
import { inspectionService } from '@/lib/services/inspectionService';
import { crewHubService } from '@/lib/services/crewHub';
import { formatINR } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// TanStack Query-style Client Memory Cache to guarantee 0-flicker instant tab transitions
const billingDashboardCache = {
  data: null,
  timestamp: 0,
};

export function BillingDashboard() {
  const { user, profile } = useAuth();

  // Primary Data States
  const [orders, setOrders] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [auditStats, setAuditStats] = useState(null);
  const [loading, setLoading] = useState(!billingDashboardCache.data);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Action Modal States
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [availableProps, setAvailableProps] = useState([]);
  const [newClient, setNewClient] = useState('');
  const [newProduction, setNewProduction] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDays, setNewDays] = useState(3);
  const [selectedPropIds, setSelectedPropIds] = useState([]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(null);

  // Toast Notification state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Fetch Real Data from Supabase with TanStack Query pattern
  const loadDashboardData = useCallback(async (isBackground = false) => {
    if (!isBackground && !billingDashboardCache.data) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // 1. Fetch Orders from Supabase or Fallback
      let ordersData = [];
      try {
        const { data: dbOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!ordersError && dbOrders && dbOrders.length > 0) {
          ordersData = dbOrders;
        } else {
          ordersData = await ordersService.getOrders();
        }
      } catch (err) {
        ordersData = await ordersService.getOrders();
      }

      // 2. Fetch Props for Category & Stock breakdown
      let propsData = [];
      try {
        const { data: dbProps, error: propsError } = await supabase
          .from('props')
          .select('*')
          .limit(50);
        if (!propsError && dbProps && dbProps.length > 0) {
          propsData = dbProps;
        } else {
          const invData = await inventoryService.getSerializedItems();
          propsData = invData;
        }
      } catch (err) {
        // Fallback
      }

      // 3. Fetch Audits
      let auditsData = [];
      try {
        auditsData = await inspectionService.getAudits();
      } catch (e) {
        // Ignore
      }

      const compiledPayload = {
        orders: ordersData,
        props: propsData,
        audits: auditsData,
      };

      billingDashboardCache.data = compiledPayload;
      billingDashboardCache.timestamp = Date.now();

      setOrders(ordersData);
      setAvailableProps(propsData);
    } catch (err) {
      console.warn('Dashboard data fetch warning:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Check cache first for instantaneous tab switching
    if (billingDashboardCache.data) {
      setOrders(billingDashboardCache.data.orders);
      setAvailableProps(billingDashboardCache.data.props);
      setLoading(false);
      // Revalidate in background if older than 30 seconds
      if (Date.now() - billingDashboardCache.timestamp > 30000) {
        loadDashboardData(true);
      }
    } else {
      loadDashboardData();
    }
  }, [loadDashboardData]);

  // Handle Quick Create Walk-in Spot Rental Order
  const handleCreateWalkInOrder = async (e) => {
    e.preventDefault();
    if (selectedPropIds.length === 0) {
      showToast('error', 'Please select at least 1 prop item for the walk-in cart.');
      return;
    }

    setCreatingOrder(true);
    try {
      const orderNumber = `ASH-WALK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const selectedProps = availableProps.filter((p) => selectedPropIds.includes(p.id));

      const totalRepl = selectedProps.reduce((sum, p) => sum + Number(p.replacement_value || 5000), 0);
      const totalDaily = selectedProps.reduce((sum, p) => sum + Number(p.daily_rental_rate || 800), 0);
      const baseRental = totalDaily * newDays;
      const securityDep = Math.round(totalRepl * 0.30);
      const taxAmt = Math.round(baseRental * 0.18);
      const grandTotal = baseRental + securityDep + taxAmt;

      const startDate = new Date().toISOString().split('T')[0];
      const endObj = new Date();
      endObj.setDate(endObj.getDate() + newDays);
      const endDate = endObj.toISOString().split('T')[0];

      // Insert order into Supabase
      const newOrder = {
        order_number: orderNumber,
        client_name: newClient || 'Walk-In Production Unit',
        production_name: newProduction || 'Spot Rental Project',
        shoot_location: newLocation || 'Warehouse Bay 1',
        start_date: startDate,
        end_date: endDate,
        rental_days: newDays,
        status: 'picking_in_progress',
        total_replacement_value: totalRepl,
        base_rental_amount: baseRental,
        discount_percent: 0,
        discount_amount: 0,
        security_deposit: securityDep,
        tax_amount: taxAmt,
        grand_total: grandTotal,
        assigned_executives: [
          { id: 'p1', name: 'Ravi Kumar', floor: 1 },
          { id: 'p2', name: 'Vikram Singh', floor: 2 },
        ],
        vehicle_number: 'TS 07 UA 4421',
        driver_name: 'Suresh Reddy',
        gate_pass_number: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        created_at: new Date().toISOString(),
      };

      try {
        const { data: dbData } = await supabase.from('orders').insert([newOrder]).select().single();
        if (dbData) {
          // Insert items
          const items = selectedProps.map((p) => ({
            order_id: dbData.id,
            prop_id: p.id,
            prop_title: p.title || p.name || 'Prop',
            replacement_value: p.replacement_value || 5000,
            daily_rental_rate: p.daily_rental_rate || 800,
            rental_days: newDays,
            floor: p.floor || 1,
            rack: p.rack || 'R-01',
            status: 'pending',
          }));
          await supabase.from('order_items').insert(items);
        }
      } catch (err) {
        // Fallback to local memory order creation
        await ordersService.createWalkInOrder({
          client_name: newOrder.client_name,
          production_name: newOrder.production_name,
          shoot_location: newOrder.shoot_location,
          start_date: newOrder.start_date,
          end_date: newOrder.end_date,
          rental_days: newOrder.rental_days,
          assigned_executives: newOrder.assigned_executives,
          vehicle_number: newOrder.vehicle_number,
          driver_name: newOrder.driver_name,
          items: selectedProps.map((p) => ({
            prop_sku_id: p.id,
            prop_title: p.title || p.name || 'Prop',
            category: p.category || 'General',
            replacement_value: p.replacement_value || 5000,
            daily_rental_rate: p.daily_rental_rate || 800,
            rental_days: newDays,
            quantity: 1,
            floor: p.floor || 1,
            rack: p.rack || 'R-01',
          })),
        });
      }

      showToast('success', `Spot Rental ${orderNumber} created! Picklist generated.`);
      setShowWalkinModal(false);
      setNewClient('');
      setNewProduction('');
      setNewLocation('');
      setSelectedPropIds([]);
      loadDashboardData(true);
    } catch (err) {
      showToast('error', 'Failed to create spot rental order');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Live Cart Actions data matching Admin 100% UI fidelity
  const liveCartActions = useMemo(() => {
    return [
      {
        orderNo: 'PSM02',
        orderId: 'c1000000-0000-0000-0000-000000000014',
        movieProject: 'Pushpa 2 VFX',
        production: 'SSMB23 Production',
        scannedBy: 'Ravi Kumar',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
        scannedAt: 'June 18, 2024 10:20:09 PM',
        propId: 'ASH-ELEC-0061',
        propName: 'SSMB23 Production Electronics',
        quantity: 10,
      },
      {
        orderNo: 'SSMB29',
        orderId: 'c1000000-0000-0000-0000-000000000052',
        movieProject: 'Game Changer Set',
        production: 'Game Changer Set',
        scannedBy: 'Vikram Singh',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
        scannedAt: 'June 18, 2024 10:20:09 PM',
        propId: 'ASH-FURN-0062',
        propName: 'Game Changer Set Throne Chair',
        quantity: 3,
      },
      {
        orderNo: 'SSMB33',
        orderId: 'c1000000-0000-0000-0000-000000000038',
        movieProject: 'Kalki Cinematic Unit',
        production: 'Kalki Cinematic Unit',
        scannedBy: 'Priya Sharma',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
        scannedAt: 'June 18, 2024 10:20:00 PM',
        propId: 'ASH-OPT-0063',
        propName: 'Kalki Cinematic Unit Arri 4K',
        quantity: 10,
      },
      {
        orderNo: 'CSMB03',
        orderId: 'c1000000-0000-0000-0000-000000000077',
        movieProject: 'Thandel VFX',
        production: 'Thandel VFX',
        scannedBy: 'Kiran Varma',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80',
        scannedAt: 'June 18, 2024 10:20:01 PM',
        propId: 'ASH-PROP-0064',
        propName: 'Thandel VFX Action Rig',
        quantity: 1,
      },
    ];
  }, []);

  return (
    <div className="space-y-5 animate-fade-in font-sans text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold backdrop-blur-md animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-50/95 text-rose-800 border-rose-200'
              : 'bg-emerald-50/95 text-emerald-800 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =====================================================================
          ACTION TOOLBAR / QUICK LAUNCHER PODS
          ===================================================================== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Billing &amp; Commercial Operations Hub</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400">
              Instant walk-in cart checkout, live inventory tracking, GST tax invoicing &amp; returns audit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowWalkinModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            id="billing-create-walkin-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Walk-in Live Cart</span>
          </button>

          <Link
            href="/billing/inventory/bulk-qr"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Bulk QR Generator</span>
          </Link>

          <Link
            href="/billing/inventory/health-audits"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Health Audits</span>
          </Link>

          <button
            onClick={() => loadDashboardData(true)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* =====================================================================
          TOP BENTO GRID: 4 COLUMNS (Prop Stock, Warehouse, Revenue, Right Stack)
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        {/* CARD 1: Prop Stock Summary (4 cols) */}
        <div className="xl:col-span-4 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Prop Stock Summary</h3>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3">
            {/* Left Column: Categories & Specific Prop list */}
            <div className="space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Electronics
                  </span>
                  <span className="font-bold text-slate-900 font-mono">200k+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Vintage Furniture
                  </span>
                  <span className="font-bold text-slate-900 font-mono">1.50k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Vehicles
                  </span>
                  <span className="font-bold text-slate-900 font-mono">1.50k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Costumes
                  </span>
                  <span className="font-bold text-slate-900 font-mono">200</span>
                </div>
              </div>

              {/* Specific Prop Inventory List */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Specific Prop
                </span>
                <div className="text-[11px] font-mono space-y-0.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>unique C0061</span>
                    <strong className="text-slate-900">150</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>unique C0062</span>
                    <strong className="text-slate-900">130</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>unique C0063</span>
                    <strong className="text-slate-900">5</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>unique C0064</span>
                    <strong className="text-slate-900">2</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>unique C0065</span>
                    <strong className="text-slate-900">1</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>unique C0066</span>
                    <strong className="text-slate-900">1</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Total Props Status & Donut Ring */}
            <div className="flex flex-col justify-between pl-2 border-l border-slate-100">
              <div className="space-y-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-800 block">Total Props</span>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      Available
                    </span>
                    <span className="font-bold text-slate-900 font-mono">155,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      On Rent
                    </span>
                    <span className="font-bold text-slate-900 font-mono">45,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Maintenance
                    </span>
                    <span className="font-bold text-slate-900 font-mono">200</span>
                  </div>
                </div>
              </div>

              {/* Condition Breakdown Donut Chart */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-600 block mb-1">
                  Condition Breakdown
                </span>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4.5" />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="4.5"
                        strokeDasharray="57 100"
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="4.5"
                        strokeDasharray="22 100"
                        strokeDashoffset="-57"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="4.5"
                        strokeDasharray="9 100"
                        strokeDashoffset="-79"
                      />
                    </svg>
                  </div>

                  <div className="text-[9px] text-slate-500 space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span>Elect (65%)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>90% Rent</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Other</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>Maint</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Warehouse Capacity (3 cols) */}
        <div className="xl:col-span-3 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Warehouse Capacity</h3>
              <span className="text-[10px] text-slate-400">Multi-floor map</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900 block leading-tight font-mono">78% Filled</span>
              <button className="text-slate-400 hover:text-slate-600 p-0.5">
                <MoreHorizontal className="w-3.5 h-3.5 inline" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 items-center">
            {/* Godown 1 & 2 Map Grid */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">Godown 1</span>
                  <span>F1: 70% • F2: 70%</span>
                </div>
                <div className="flex items-end gap-1 h-12 bg-slate-50 p-1 rounded-lg border border-slate-100">
                  <div className="w-2.5 h-[70%] bg-sky-500 rounded-xs" />
                  <div className="w-2.5 h-[85%] bg-sky-500 rounded-xs" />
                  <div className="w-2.5 h-[60%] bg-sky-500 rounded-xs" />
                  <div className="w-2.5 h-[40%] bg-sky-300 rounded-xs" />
                  <div className="w-2.5 h-[75%] bg-sky-500 rounded-xs" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">Godown 2</span>
                  <span>F1: 72% • F2: 60%</span>
                </div>
                <div className="grid grid-cols-4 gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-100 h-10">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        i % 3 === 0 ? 'bg-sky-500' : i % 2 === 0 ? 'bg-sky-300' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Dual Circular Radial Progress Gauges */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="4"
                    strokeDasharray="68 100"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-900 font-mono">78%</span>
              </div>

              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="4"
                    strokeDasharray="63 100"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-900 font-mono">72%</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Revenue Pulse (YTD) (3 cols) */}
        <div className="xl:col-span-3 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Revenue Pulse (YTD)</h3>
            <button className="text-slate-400 hover:text-slate-600 p-1">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-left">
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block leading-tight">
                Monthly Rental
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono">2008K+</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block leading-tight">
                Total Revenue
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono">₹1.85Cr</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block leading-tight">
                Net Profit
              </span>
              <span className="text-sm font-bold text-emerald-600 font-mono">₹52L</span>
            </div>
          </div>

          {/* Smooth SVG Area Chart with Blue Gradient */}
          <div className="pt-2">
            <div className="relative h-24 w-full">
              <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id="billingRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />

                <path
                  d="M 0 65 Q 30 75 60 55 T 120 40 T 180 30 T 240 60 T 300 25 L 300 100 L 0 100 Z"
                  fill="url(#billingRevenueGrad)"
                />
                <path
                  d="M 0 65 Q 30 75 60 55 T 120 40 T 180 30 T 240 60 T 300 25"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="flex justify-between text-[8px] text-slate-400 font-medium pt-1 px-1">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </div>
        </div>

        {/* CARD 4: Stacked Right KPI Widgets (2 cols) */}
        <div className="xl:col-span-2 flex flex-col justify-between gap-3">
          {/* Today's Sales */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Today's Sales</span>
              <span className="text-base font-bold text-slate-900 font-mono leading-tight">₹1,24,000</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>

          {/* Today's Collection */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Today's Collection</span>
              <span className="text-base font-bold text-slate-900 font-mono leading-tight">₹95,000</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Coins className="w-4 h-4" />
            </div>
          </div>

          {/* YTD Performance vs Target */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
            <span className="text-[10px] font-semibold text-slate-500 block leading-tight">
              YTD Performance vs Target
            </span>
            <div className="h-9 w-full mt-1">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                <path
                  d="M 0 24 Q 25 20 50 14 T 80 8 T 95 6"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="95" cy="6" r="3" fill="#0284c7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          BOTTOM SECTION: REALTIME LIVE CART ACTIONS & ACTIVE RENTAL PIPELINE
          ===================================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Realtime Live Cart Actions (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Realtime Live Cart Actions</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <Link
              href="/billing/orders/live-cart"
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              <span>View Counter</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-2">Order#</th>
                  <th className="py-2.5 px-2">Movie Project</th>
                  <th className="py-2.5 px-2">Production</th>
                  <th className="py-2.5 px-2">Scanned By</th>
                  <th className="py-2.5 px-2">Scanned At</th>
                  <th className="py-2.5 px-2">Prop ID</th>
                  <th className="py-2.5 px-2">Prop Name</th>
                  <th className="py-2.5 px-2 text-center">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {liveCartActions.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order# */}
                    <td className="py-2.5 px-2 font-mono font-bold text-sky-600">
                      <Link
                        href={`/billing/orders/live-cart`}
                        className="hover:underline flex items-center gap-0.5"
                      >
                        {row.orderNo}
                      </Link>
                    </td>

                    {/* Movie Project */}
                    <td className="py-2.5 px-2 font-semibold text-slate-900 whitespace-nowrap">
                      {row.movieProject}
                    </td>

                    {/* Production */}
                    <td className="py-2.5 px-2 text-slate-500 text-[11px] whitespace-nowrap">
                      {row.production}
                    </td>

                    {/* Scanned By Avatar */}
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5" title={row.scannedBy}>
                        <img
                          src={row.avatar}
                          alt={row.scannedBy}
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-[11px] text-slate-700 truncate max-w-[80px]">
                          {row.scannedBy.split(' ')[0]}
                        </span>
                      </div>
                    </td>

                    {/* Scanned At */}
                    <td className="py-2.5 px-2 text-slate-400 text-[10px] whitespace-nowrap font-mono">
                      {row.scannedAt}
                    </td>

                    {/* Prop ID with QR icon */}
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 bg-slate-100 rounded border border-slate-200 flex items-center justify-center p-0.5">
                          <QRCodeSVG value={row.propId} size={16} />
                        </div>
                        <span className="font-mono text-[10px] text-slate-600">{row.propId}</span>
                      </div>
                    </td>

                    {/* Prop Name */}
                    <td className="py-2.5 px-2 text-slate-800 text-[11px] truncate max-w-[120px]">
                      {row.propName}
                    </td>

                    {/* Quantity */}
                    <td className="py-2.5 px-2 text-center font-bold font-mono text-slate-900">
                      {row.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Rental Pipeline (5 cols) */}
        <div className="xl:col-span-5 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Active Rental Pipeline</h3>
            <Link
              href="/billing/rental/dispatched"
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              <span>View Full</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="py-2">
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {/* Stage 1: In Picking */}
              <div className="p-2 rounded-xl bg-sky-50 border border-sky-200/70 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-sky-700 block">In Picking</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">12</span>
                <span className="text-[9px] text-slate-500">In Picking</span>
              </div>

              {/* Stage 2: Staged & Ready */}
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/70 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-emerald-700 block">Staged</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">6</span>
                <span className="text-[9px] text-slate-500">Staged</span>
              </div>

              {/* Stage 3: Dispatched */}
              <div className="p-2 rounded-xl bg-sky-50 border border-sky-200/70 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-sky-700 block">Dispatched</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">12</span>
                <span className="text-[9px] text-slate-500 font-mono">Lorry TS 09</span>
              </div>

              {/* Stage 4: Out on Rent */}
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/70 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-amber-700 block">On Rent</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">18</span>
                <span className="text-[9px] text-slate-500">On Set</span>
              </div>

              {/* Stage 5: Returns Audit */}
              <div className="p-2 rounded-xl bg-red-50 border border-red-200/70 text-slate-800">
                <span className="text-[9px] uppercase font-bold text-red-700 block">Audit</span>
                <span className="text-base font-bold text-red-600 font-mono mt-0.5 block">4</span>
                <span className="text-[9px] text-slate-500">Returns</span>
              </div>
            </div>

            {/* Overdue Return Risk Warning */}
            <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>Overdue Return Risk: 9000-SEE</span>
              </div>
              <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                32% Risk
              </span>
            </div>
          </div>

          {/* Next Lorry Dispatch Info */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-500" />
              <span>Next Lorry Dispatch: <strong>TS 09 UA 8842</strong> (Ramoji Film City)</span>
            </div>
            <Link
              href="/billing/rental/dispatched"
              className="text-sky-600 hover:text-sky-700 font-bold text-[11px] flex items-center gap-0.5"
            >
              Manage &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL: CREATE WALK-IN SPOT RENTAL ORDER
          ===================================================================== */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-900">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create Walk-in Spot Rental</h3>
                  <p className="text-[11px] text-slate-500">Commercial counter intake &amp; instant picking pass</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalkinModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWalkInOrder} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Production House Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduction}
                    onChange={(e) => setNewProduction(e.target.value)}
                    placeholder="e.g. Mythri Movie Makers"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Art Director / Client Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    placeholder="e.g. Sabu Cyril Art Team"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Shoot Location / Floor
                  </label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Annapurna Studios - Floor 4"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Shoot Days (Duration)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={newDays}
                    onChange={(e) => setNewDays(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Select Requested Props */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select Requested Movie Props:
                </label>
                <div className="max-h-52 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  {availableProps.length === 0 ? (
                    <div className="py-4 text-center text-slate-400">Loading catalog items...</div>
                  ) : (
                    availableProps.map((p) => {
                      const isChecked = selectedPropIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-sky-50 border border-sky-200' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPropIds((prev) => [...prev, p.id]);
                                } else {
                                  setSelectedPropIds((prev) => prev.filter((id) => id !== p.id));
                                }
                              }}
                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            <span className="font-semibold text-slate-900">
                              {p.title || p.name || 'Prop Asset'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              (FL {p.floor || 1} • {p.rack || 'R-01'})
                            </span>
                          </div>
                          <span className="font-mono text-slate-600">
                            {formatINR(p.daily_rental_rate || 800)}/day
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {creatingOrder ? 'Creating Spot Order...' : 'Create & Issue Picklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingDashboard;
