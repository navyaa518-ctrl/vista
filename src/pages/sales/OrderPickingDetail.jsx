'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ScanLine,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Tag,
  Building2,
  Check,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  Camera,
} from 'lucide-react';
import { ordersService } from '@/lib/services/orders';
import { WalkInOrder, WalkInOrderItem } from '@/types/orders';
import { InOrderScannerDrawer } from '@/components/sales/InOrderScannerDrawer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

export function OrderPickingDetail({ orderId }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  const executiveId = profile?.id || user?.id || 'exec-001';
  const executiveName = profile?.full_name || 'Ravi Kumar (Senior Sales Executive)';

  const loadOrderData = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const [orderData, orderItems] = await Promise.all([
        ordersService.getOrderById(orderId),
        ordersService.getOrderItems(orderId),
      ]);
      setOrder(orderData);
      setItems(orderItems);
    } catch (err) {
      console.error('Failed to load order picking data:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderData();

    // Supabase Realtime channel for order_items synchronization
    const channel = supabase
      .channel(`order_items_realtime_${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items', filter: `order_id=eq.${orderId}` },
        () => {
          loadOrderData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, loadOrderData]);

  const handleItemAdded = (newItem) => {
    setItems((prev) => [newItem, ...prev.filter((it) => it.id !== newItem.id)]);
    // Re-sync totals from backend
    ordersService.getOrderById(orderId).then((updated) => {
      if (updated) setOrder(updated);
    });
    setSuccessBanner(`Successfully scanned & added: ${newItem.prop_title} (${newItem.item_code})`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Remove this prop line item from the order manifest?')) return;
    setDeletingId(itemId);
    try {
      await ordersService.deleteOrderItem(orderId, itemId);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
      const updated = await ordersService.getOrderById(orderId);
      if (updated) setOrder(updated);
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert('Could not remove line item. Please retry.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkPickingComplete = async () => {
    if (items.length === 0) {
      alert('Please scan at least one prop into the order before completing picking.');
      return;
    }

    setCompleting(true);
    try {
      // Transition order status to Quotation / Ready for Dispatch
      await ordersService.saveAsQuotation(orderId);
      await loadOrderData();
      setSuccessBanner('Order picking completed and manifest locked for client review!');
    } catch (err) {
      console.error('Error completing picking:', err);
      alert('Failed to update order status.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-600">Loading Order Picking Manifest...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 flex flex-col items-center justify-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested order ID does not exist or was deleted.</p>
        <Link
          href="/sales/orders"
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Return to Assigned Orders
        </Link>
      </div>
    );
  }

  const durationDays = order.rental_days || order.duration_days || 3;
  const totalDailyRent = items.reduce((acc, curr) => acc + (curr.daily_rent_price || 0) * (curr.quantity || 1), 0);
  const totalEstimatedRent = totalDailyRent * durationDays;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6">
      {/* 1. TOP NAVIGATION / BREADCRUMB */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/sales/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Orders Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadOrderData()}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            title="Refresh Manifest"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION BANNER */}
      {successBanner && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="p-1 hover:bg-emerald-600 rounded-lg">
            ✕
          </button>
        </div>
      )}

      {/* 2. ORDER META COMMAND CARD & LIVE BENTO */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 lg:p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {order.status || 'PICKING_IN_PROGRESS'}
              </span>
              <span className="font-mono text-xs font-bold text-slate-500">
                #{order.order_number}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              {order.movie_project_name || order.production_name || 'Cinema Production Order'}
            </h1>
            <p className="text-xs text-slate-600 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Client: <strong className="text-slate-900">{order.client_name}</strong></span>
              {order.client_phone && <span>• {order.client_phone}</span>}
            </p>
          </div>

          {/* Primary Action Button: SCAN & ADD PROP */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setScannerOpen(true)}
              className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
              id="sales-scan-add-prop-btn"
            >
              <ScanLine className="w-5 h-5 text-slate-950" />
              <span>Scan & Add Prop to Order</span>
            </button>
          </div>
        </div>

        {/* BENTO STATS / FINANCIAL KPI ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Live Pick Count
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
              {items.length} <span className="text-xs font-normal text-slate-500">props in cart</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Daily Rental Rate
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
              ₹{totalDailyRent.toLocaleString('en-IN')} <span className="text-xs font-normal text-amber-800">/ day</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Shoot Duration
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
              {durationDays} <span className="text-xs font-normal text-emerald-800">Days</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-sky-50/70 border border-sky-200">
            <div className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-sky-600" />
              Total Line Estimate
            </div>
            <div className="text-xl sm:text-2xl font-black text-sky-950 mt-1">
              ₹{totalEstimatedRent.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* SHOOT LOCATION & SCHEDULE PILL ROW */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Location: <strong className="text-slate-900">{order.shoot_location || 'Ramoji Film City / Hyderabad Set'}</strong></span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-500" />
            <span>Dates: <strong>{order.rental_start_date}</strong> to <strong>{order.rental_end_date}</strong></span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Assigned Floor: <strong>Floor 1 & 2 Warehouse Bays</strong></span>
          </div>
        </div>
      </div>

      {/* 3. LIVE PICKED PROPS MANIFEST */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-base text-slate-950 tracking-tight flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              Live Order Manifest & Scanned Props
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Props tagged into this order via physical barcode scan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkPickingComplete}
              disabled={completing || items.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              {completing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Mark Picking Complete
            </button>
          </div>
        </div>

        {/* EMPTY STATE */}
        {items.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-4 border-2 border-dashed border-slate-200 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto">
              <ScanLine className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">No Props Scanned Into Order Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Scan property barcodes using your device camera or tap the scan button to pick and reserve props for this shoot.
              </p>
            </div>
            <button
              onClick={() => setScannerOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <ScanLine className="w-4 h-4" />
              Launch In-Order QR Scanner
            </button>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Prop Item</th>
                    <th className="py-3 px-3">Serial Code</th>
                    <th className="py-3 px-3">Warehouse Location</th>
                    <th className="py-3 px-3">Daily Rent Rate</th>
                    <th className="py-3 px-3">Qty</th>
                    <th className="py-3 px-3">Subtotal ({durationDays}d)</th>
                    <th className="py-3 px-3">Picked By</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200 shrink-0">
                            <Image
                              src={item.image_url || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300'}
                              alt={item.prop_title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{item.prop_title}</span>
                            <span className="text-[10px] text-slate-400">{item.prop_category}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.item_code}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span>{item.warehouse_location || 'Floor 1, Rack A'}</span>
                        </div>
                      </td>

                      {/* LIVE RENTAL RATE DISPLAY */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                          ₹{(item.daily_rent_price || 0).toLocaleString('en-IN')}/day
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-800 font-bold">
                        {item.quantity || 1}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-900">
                        ₹{((item.daily_rent_price || 0) * (item.quantity || 1) * durationDays).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        <span className="block font-semibold text-slate-800">{item.scanned_by_name || 'Executive'}</span>
                        <span className="text-[10px] text-slate-400">
                          {item.scanned_at ? new Date(item.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Prop Line Item"
                        >
                          {deletingId === item.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS VIEW */}
            <div className="md:hidden space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200 shrink-0">
                      <Image
                        src={item.image_url || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300'}
                        alt={item.prop_title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 leading-tight truncate">
                        {item.prop_title}
                      </h4>
                      <div className="font-mono text-xs font-bold text-slate-700 mt-0.5">
                        {item.item_code}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-sky-500" />
                        <span>{item.warehouse_location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Daily Rent Rate</span>
                      <span className="font-bold text-amber-700">
                        ₹{(item.daily_rent_price || 0).toLocaleString('en-IN')}/day
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Line Total ({durationDays}d)</span>
                      <span className="font-bold text-slate-950">
                        ₹{((item.daily_rent_price || 0) * (item.quantity || 1) * durationDays).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 4. MOBILE FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 sm:hidden">
        <button
          onClick={() => setScannerOpen(true)}
          className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 shadow-2xl flex items-center justify-center border-2 border-white active:scale-95 transition-transform"
          title="Open Prop Scanner"
        >
          <ScanLine className="w-7 h-7" />
        </button>
      </div>

      {/* 5. IN-ORDER SCANNER DRAWER / MODAL */}
      <InOrderScannerDrawer
        order={order}
        executiveId={executiveId}
        executiveName={executiveName}
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
}

export default OrderPickingDetail;
