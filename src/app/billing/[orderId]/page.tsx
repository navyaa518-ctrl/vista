'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Order, OrderItem } from '@/types/database';
import { GatePassModal } from '@/components/documents/GatePassModal';
import { LoadingSheetModal } from '@/components/documents/LoadingSheetModal';
import { InvoiceModal } from '@/components/documents/InvoiceModal';
import {
  Receipt,
  FileText,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Trash2,
  Percent,
  Plus,
  ArrowLeft,
  RefreshCw,
  Radio,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

export default function OrderBillingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Discount adjustment state
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [updatingBudget, setUpdatingBudget] = useState(false);

  // Modals state
  const [showGatePass, setShowGatePass] = useState(false);
  const [showLoadingSheet, setShowLoadingSheet] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceInitialMode, setInvoiceInitialMode] = useState<'invoice' | 'quotation'>('invoice');

  useEffect(() => {
    fetchOrderAndItems();
  }, [orderId]);

  // Realtime subscription to live warehouse picking
  useEffect(() => {
    const channel = supabase
      .channel(`billing_channel_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newItem = payload.new as OrderItem;
            setItems((prev) =>
              prev.map((i) => (i.id === newItem.id ? newItem : i))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setItems((prev) => prev.filter((i) => i.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function fetchOrderAndItems() {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (orderError) throw orderError;
      setOrder(orderData as Order);
      setDiscountPercent(orderData.discount_percent || 0);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (itemsError) throw itemsError;
      setItems(itemsData as OrderItem[]);
    } catch (err) {
      console.error('Error fetching billing details:', err);
    } finally {
      setLoading(false);
    }
  }

  // Budget adjustment: Delete item from order
  async function handleDeleteItem(itemId: string, propTitle: string) {
    if (!confirm(`Remove "${propTitle}" from this order to adjust client budget? This will alert the floor executive.`)) {
      return;
    }

    try {
      // 1. Delete from order_items
      await supabase.from('order_items').delete().eq('id', itemId);

      // 2. Log removal for floor executive notification
      if (order) {
        await supabase.from('inventory_logs').insert([
          {
            order_id: order.id,
            action: 'budget_removal',
            executive_name: 'Counter Billing Manager',
            details: { item_id: itemId, title: propTitle },
          },
        ]);
      }

      // Recalculate totals
      const remainingItems = items.filter((i) => i.id !== itemId);
      recalculateAndSaveOrder(remainingItems, discountPercent);
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to remove item.');
    }
  }

  // Recalculate financial totals
  async function recalculateAndSaveOrder(currentItems: OrderItem[], newDiscountPercent: number) {
    if (!order) return;
    setUpdatingBudget(true);

    try {
      const rentalDays = order.rental_days;
      const totalRepl = currentItems.reduce((sum, i) => sum + Number(i.replacement_value), 0);
      const totalDaily = currentItems.reduce((sum, i) => sum + Number(i.daily_rental_rate), 0);
      const baseRental = totalDaily * rentalDays;

      const discountAmt = Math.round(baseRental * (newDiscountPercent / 100));
      const discountedRental = baseRental - discountAmt;
      const securityDep = Math.round(totalRepl * 0.30);
      const taxAmt = Math.round(discountedRental * 0.18);
      const grandTotal = discountedRental + securityDep + taxAmt;

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
          total_replacement_value: totalRepl,
          base_rental_amount: baseRental,
          discount_percent: newDiscountPercent,
          discount_amount: discountAmt,
          security_deposit: securityDep,
          tax_amount: taxAmt,
          grand_total: grandTotal,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (error) throw error;
      if (updatedOrder) setOrder(updatedOrder as Order);
    } catch (err) {
      console.error('Error recalculating budget:', err);
    } finally {
      setUpdatingBudget(false);
    }
  }

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-slate-300">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mr-3" />
        <span>Loading Counter Billing Terminal...</span>
      </div>
    );
  }

  const pickedCount = items.filter((i) => i.status === 'picked').length;

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-200 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#121520] via-[#0e1017] to-[#121520] border-b border-amber-500/20 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/billing"
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400">
                  {order.order_number}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs uppercase font-semibold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Warehouse Feed
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif mt-0.5">
                Counter Estimation &amp; Billing Terminal
              </h1>
            </div>
          </div>

          {/* Action Document Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowGatePass(true)}
              className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Gate Pass</span>
            </button>

            <button
              onClick={() => setShowLoadingSheet(true)}
              className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Loading Sheet</span>
            </button>

            <button
              onClick={() => {
                setInvoiceInitialMode('quotation');
                setShowInvoice(true);
              }}
              className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Quotation</span>
            </button>

            <button
              onClick={() => {
                setInvoiceInitialMode('invoice');
                setShowInvoice(true);
              }}
              className="py-2 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Order Header Summary */}
        <div className="p-6 rounded-2xl bg-[#0e1017] border border-amber-500/20 grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-xl">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Client / Production</span>
            <span className="text-sm font-bold text-white">{order.production_name}</span>
            <span className="text-xs text-slate-400 block">{order.client_name}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Shoot Period</span>
            <span className="text-sm font-bold text-amber-300">
              {order.rental_days} Days ({order.start_date} to {order.end_date})
            </span>
            <span className="text-xs text-slate-400 block">{order.shoot_location}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lorry / Vehicle Details</span>
            <span className="text-sm font-mono font-bold text-slate-200">
              {order.vehicle_number || 'TS 09 UA 8842'}
            </span>
            <span className="text-xs text-slate-400 block">
              Driver: {order.driver_name || 'Mohan Babu'} ({order.driver_phone || '+91 94400 55667'})
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Warehouse Status</span>
            <span className="text-sm font-bold text-emerald-400">
              {pickedCount} of {items.length} Props Picked
            </span>
            <span className="text-xs text-slate-400 block">
              Assigned: Ravi (FL 1) &amp; Vikram (FL 2)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ITEMS FEED (LEFT 2 COLS) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                Live Order Items &amp; Pick Status
              </span>
              <span className="text-xs text-slate-400">
                Auto-updating via Supabase Realtime
              </span>
            </div>

            {items.map((item, idx) => {
              const isPicked = item.status === 'picked';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isPicked
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-[#0f1118] border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isPicked ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Floor {item.floor} • {item.rack}
                        </span>
                        <span className="text-xs text-slate-400">{item.prop_category}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1">{item.prop_title}</h4>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                        <span>Repl: {formatINR(item.replacement_value)}</span>
                        <span>Rent: {formatINR(item.daily_rental_rate)}/day</span>
                        {isPicked && (
                          <span className="text-emerald-400 font-semibold font-mono">
                            Scanned Serial: {item.item_serial} ({item.picked_by_name})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Line total & Budget Removal Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-sm font-bold gold-gradient-text font-serif">
                        {formatINR(item.daily_rental_rate * order.rental_days)}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPicked
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {isPicked ? 'PICKED' : 'PENDING'}
                      </span>
                    </div>

                    {/* Budget Tool: Remove Item */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id, item.prop_title)}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                      title="Remove from Order (Budget Adjustment)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FINANCIAL SUMMARY & BUDGET ADJUSTMENT TOOL */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0f1118] border border-amber-500/30 space-y-5 shadow-2xl sticky top-28">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block border-b border-slate-800 pb-3">
                Live Billing Breakdown
              </span>

              {/* Budget Discount Tool */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/25 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-400" />
                    Manager Discount Override:
                  </span>
                  <span className="font-bold text-amber-400">{discountPercent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={5}
                  value={discountPercent}
                  onChange={(e) => {
                    const newPct = Number(e.target.value);
                    setDiscountPercent(newPct);
                    recalculateAndSaveOrder(items, newPct);
                  }}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0% (Standard)</span>
                  <span>15% (VIP Production)</span>
                  <span>30% (Max Waiver)</span>
                </div>
              </div>

              {/* Price Figures */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Certified Replacement Value:</span>
                  <span className="text-slate-300 font-semibold">{formatINR(order.total_replacement_value)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Base Prop Rental ({order.rental_days} Days @ 20%):</span>
                  <span className="text-white font-semibold">{formatINR(order.base_rental_amount)}</span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Manager Discount Applied ({order.discount_percent}%):</span>
                    <span className="font-semibold">-{formatINR(order.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                  <span>Refundable Security Deposit (30%):</span>
                  <span className="text-slate-300 font-semibold">{formatINR(order.security_deposit)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>GST (18% Goods &amp; Services Tax):</span>
                  <span className="text-slate-300 font-semibold">{formatINR(order.tax_amount)}</span>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-white block">Grand Total:</span>
                    <span className="text-[10px] text-slate-500">(Rental + Security Deposit + Tax)</span>
                  </div>
                  <span className="text-2xl font-bold gold-gradient-text font-serif">
                    {formatINR(order.grand_total)}
                  </span>
                </div>
              </div>

              {/* Dispatch Order Trigger */}
              <button
                onClick={async () => {
                  await supabase
                    .from('orders')
                    .update({ status: 'dispatched' })
                    .eq('id', order.id);
                  alert('Order dispatched! Gate pass active.');
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" />
                <span>Authorize Dispatch &amp; Seal Gate Pass</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showGatePass && (
        <GatePassModal
          order={order}
          items={items}
          onClose={() => setShowGatePass(false)}
        />
      )}

      {showLoadingSheet && (
        <LoadingSheetModal
          order={order}
          items={items}
          onClose={() => setShowLoadingSheet(false)}
        />
      )}

      {showInvoice && (
        <InvoiceModal
          order={order}
          items={items}
          initialMode={invoiceInitialMode}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
}
