'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Order } from '@/types/database';
import { formatINR } from '@/lib/utils';
import { Smartphone, CheckCircle2, XCircle, ArrowRight, RefreshCw, Clock } from 'lucide-react';

export default function AppOrdersPage() {
  const [rfqOrders, setRfqOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppOrders();
  }, []);

  async function fetchAppOrders() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'rfq')
      .order('created_at', { ascending: false });

    if (data) setRfqOrders(data as Order[]);
    setLoading(false);
  }

  async function approveOrder(id: string) {
    await supabase.from('orders').update({ status: 'picking_in_progress' }).eq('id', id);
    setRfqOrders((prev) => prev.filter((o) => o.id !== id));
    alert('RFQ Approved! Assigned to Warehouse Floor Pickers.');
  }

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-sky-700 font-semibold uppercase tracking-wider mb-1">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Digital Client App Inquiries</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Client App Orders &amp; RFQs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quotations submitted through the client web portal and mobile app awaiting manager review and warehouse picking authorization.
          </p>
        </div>

        <button
          onClick={fetchAppOrders}
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading App RFQs...</div>
      ) : rfqOrders.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center space-y-2 shadow-2xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">All Client App RFQs Processed</h3>
          <p className="text-xs text-slate-500">
            No quotations currently pending approval. All active orders are dispatched or in picking.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rfqOrders.map((ord) => (
            <div
              key={ord.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    {ord.order_number}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    RFQ Pending Approval
                  </span>
                  <span className="text-xs text-slate-500">
                    {ord.rental_days} Days ({ord.start_date} to {ord.end_date})
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{ord.production_name}</h3>
                <div className="text-xs text-slate-500">
                  Client: <strong className="text-slate-700">{ord.client_name}</strong> • Shoot Location: {ord.shoot_location}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Quoted Amount</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {formatINR(ord.grand_total)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Repl: {formatINR(ord.total_replacement_value)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => approveOrder(ord.id)}
                    className="py-2 px-3.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve &amp; Pick</span>
                  </button>

                  <Link
                    href={`/admin/orders/${ord.id}/billing-cart`}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors"
                  >
                    Details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
