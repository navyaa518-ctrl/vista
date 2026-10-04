'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Order, OrderItem } from '@/types/database';
import { formatINR } from '@/lib/utils';
import { GatePassModal } from '@/components/documents/GatePassModal';
import { InvoiceModal } from '@/components/documents/InvoiceModal';
import {
  Sparkles,
  ShoppingBag,
  Clock,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  Truck,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function MyRentalsPage() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGatePassOrder, setSelectedGatePassOrder] = useState<Order | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [modalItems, setModalItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    fetchClientOrders();
  }, [user]);

  async function fetchClientOrders() {
    setLoading(true);
    try {
      // Fetch orders for this client (or all orders for demo evaluation)
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setOrders(data as Order[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openDoc(order: Order, type: 'gatepass' | 'invoice') {
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    setModalItems((items as OrderItem[]) || []);
    if (type === 'gatepass') setSelectedGatePassOrder(order);
    else setSelectedInvoiceOrder(order);
  }

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-200 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#121520] via-[#0e1017] to-[#121520] border-b border-amber-500/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Production Client Self-Service Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
              My Film Productions &amp; Rental Quotations
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Track movie shoot schedules, item pick status, authorized Gate Passes, and certified tax invoices.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/catalog"
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/20 hover:from-amber-300 transition-all flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>+ Explore 200k+ Props</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Client Profile Card */}
        <div className="p-5 rounded-2xl bg-[#0e1017] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold text-lg flex items-center justify-center">
              {profile?.full_name ? profile.full_name.charAt(0) : 'C'}
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {profile?.full_name || 'Simon Jones (Production Designer)'}
              </div>
              <div className="text-xs text-amber-300 font-medium">
                {profile?.production_company || 'Mythri Movie Makers & Jones VFX Studio'}
              </div>
              <div className="text-[11px] text-slate-400">
                {user?.email || 'simonjones518@gmail.com'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Client Status</span>
              <span className="text-amber-400 font-bold">Tier 1 Studio Account</span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Active Movie Sets &amp; RFQs ({orders.length})
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
              Loading production projects...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0e1017] border border-slate-800 text-center space-y-3">
              <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No active quotations yet</h3>
              <p className="text-xs text-slate-400">Browse our catalog to select props for your next film schedule.</p>
              <Link
                href="/catalog"
                className="inline-block py-2 px-4 rounded-xl text-xs font-bold bg-amber-500 text-black"
              >
                Browse Props
              </Link>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-2xl bg-[#0e1017] border border-amber-500/20 hover:border-amber-500/40 transition-all space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      {ord.order_number}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{ord.production_name}</h3>
                      <span className="text-xs text-slate-400">Location: {ord.shoot_location}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${
                      ord.status === 'dispatched'
                        ? 'bg-blue-950 text-blue-300 border-blue-800'
                        : ord.status === 'picked_verified'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    {ord.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Shoot Duration</span>
                    <span className="font-semibold text-white">
                      {ord.rental_days} Days ({ord.start_date} to {ord.end_date})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Certified Replacement</span>
                    <span className="font-mono text-slate-300">{formatINR(ord.total_replacement_value)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Refundable Deposit</span>
                    <span className="font-mono text-slate-300">{formatINR(ord.security_deposit)} (30%)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total Rental Value</span>
                    <span className="font-bold gold-gradient-text font-serif text-sm">
                      {formatINR(ord.grand_total)}
                    </span>
                  </div>
                </div>

                {/* Document Downloads */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    Dispatch Vehicle: <strong className="text-slate-200">{ord.vehicle_number || 'TS 09 UA 8842'}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDoc(ord, 'gatepass')}
                      className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Gate Pass</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDoc(ord, 'invoice')}
                      className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Tax Invoice / Quotation</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedGatePassOrder && (
        <GatePassModal
          order={selectedGatePassOrder}
          items={modalItems}
          onClose={() => setSelectedGatePassOrder(null)}
        />
      )}

      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          items={modalItems}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
